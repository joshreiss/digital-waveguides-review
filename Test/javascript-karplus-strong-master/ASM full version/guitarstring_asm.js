function AsmFunctionsWrapper() { }
AsmFunctionsWrapper.prototype.initAsm = function(heapSize) {
  var roundedHeapSize = getNextValidFloat32HeapLength(heapSize);
  // asm.js requires all data in/out of function to be via heap object. don't want to allocate new heap every call,so reuse 
  // static variable but seedNoise.length will be different depending on string, so be willing to enlarge it if needed
  this.heap = new Float32Array(roundedHeapSize)
  // from asm.js spec, seems heap must be passed in as plain ArrayBuffer (.buffer is ArrayBuffer referenced by Float32Buffer)
  var heapBuffer = this.heap.buffer;
  var foreignFunctions = { random: Math.random, round: Math.round };// nonasm functions referenced via foreign function interface 
  // do this here so we only recreate asm functions if needed. so V8 will be able to cache optimized versions of functions
  this.asm = asmFunctions(window, foreignFunctions, heapBuffer);
}
AsmFunctionsWrapper.prototype.pluck = function(channelBuffer,seedNoise,sampleRate,hz,smoothingFactor,velocity,options) {
  console.log(smoothingFactor)
  var requiredHeapSize = seedNoise.length + channelBuffer.length;
  if (typeof(this.heap) == 'undefined') { this.initAsm(requiredHeapSize); }
  if (requiredHeapSize > this.heap.length) this.initAsm(requiredHeapSize);
  var heapFloat32 = this.heap;
  var asm = this.asm;
  for (var i = 0; i < seedNoise.length; i++) heapFloat32[i] = seedNoise[i];
  var heapOffsets = { seedStart: 0,seedEnd: seedNoise.length - 1,
    targetStart: seedNoise.length,targetEnd: seedNoise.length + channelBuffer.length - 1 };
  asm.renderKarplusStrong(heapOffsets.seedStart,heapOffsets.seedEnd,heapOffsets.targetStart,heapOffsets.targetEnd,
    sampleRate,hz,velocity,smoothingFactor,options.stringTension,options.pluckDamping,options.pluckDampingVariation);
  for (i=0;i<channelBuffer.getChannelData(0).length;i++) { channelBuffer.getChannelData(0)[i] = heapFloat32[heapOffsets.targetStart+i] * 0.5; }
  for (i=0;i<channelBuffer.getChannelData(1).length;i++) { channelBuffer.getChannelData(1)[i] = heapFloat32[heapOffsets.targetStart+i] * 0.5; }
};
// http://asmjs.org/spec/latest/#modules  byte length must be 2^n for n in [12, 24]
function getNextValidFloat32HeapLength(desiredLengthFloats) {
  var heapLengthBytes;
  var desiredLengthBytes = desiredLengthFloats << 2;
  if (desiredLengthBytes <= Math.pow(2, 12)) { heapLengthBytes = Math.pow(2, 12); } 
  else if (desiredLengthBytes < Math.pow(2, 24)) { heapLengthBytes = Math.pow(2, Math.ceil(Math.log2(desiredLengthBytes))); } 
  return heapLengthBytes;
}
// standard asm.js block
// stdlib: calling standard library functions, foreign: calling external javascript functions
// heap: buffer used for all data in/out of function
function asmFunctions(stdlib, foreign, heapBuffer) {
  "use asm";
  var heap = new stdlib.Float32Array(heapBuffer);// heap supposed to come in as just ArrayBuffer so first need to get Float32 view of it
  var floor = stdlib.Math.floor;
  var random = foreign.random;
  var round = foreign.round;
  function lowPass(lastOutput, currentInput, smoothingFactor) {
    lastOutput = +lastOutput;
    currentInput = +currentInput;
    smoothingFactor = +smoothingFactor
    var currentOutput = 0.0;
    currentOutput = smoothingFactor * currentInput + (1.0 - smoothingFactor) * lastOutput
    return +currentOutput;
  }
  // smoothing factor parameter is coefficient used on terms in main lowpass filter in Karplus-Strong loop
  function renderKarplusStrong(seedNoiseStart,seedNoiseEnd,targetArrayStart,targetArrayEnd,sampleRate, hz, velocity,
                 smoothingFactor, stringTension,pluckDamping,pluckDampingVariation) {
    seedNoiseStart = seedNoiseStart|0;
    seedNoiseEnd = seedNoiseEnd|0;
    targetArrayStart = targetArrayStart|0;
    targetArrayEnd = targetArrayEnd|0;
    sampleRate = sampleRate|0;
    hz = +hz;
    velocity = +velocity;
    smoothingFactor = +smoothingFactor;
    stringTension = +stringTension;
    pluckDamping = +pluckDamping;
    pluckDampingVariation = +pluckDampingVariation;
    var period = 0.0;
    var periodSamples = 0;
    var sampleCount = 0;
    var lastOutputSample = 0.0;
    var curInputSample = 0.0;
    var curOutputSample = 0.0;
    var noiseSample = 0.0;
    var skipSamplesFromTension = 0;
    var pluckDampingMin = 0.1, pluckDampingMax = 0.9;
    var pluckDampingVariationMin = 0.0, pluckDampingVariationMax = 0.0;
    var pluckDampingVariationDifference = 0.0;
    var pluckDampingCoefficient = 0.0;
    var heapNoiseIndexBytes = 0;// byte-addressed index of heap as whole that we get noise samples from
    var targetIndex = 0;    // Float32-addressed index of  portion of heap that we'll be writing to
    var heapTargetIndexBytes = 0;// byte-addressed index of heap as whole where we'll be writing
    var lastPeriodStartIndexBytes = 0;// byte-addressed index of heap as whole of start of last period of samples
    var lastPeriodInputIndexBytes = 0;// byte-addressed index of heap as whole from where we take samples from last period, after having added skip from tension
    period = 1.0/hz;
    periodSamples = ~~(+round(period * +(sampleRate>>>0)));
    sampleCount = (targetArrayEnd-targetArrayStart+1)|0;
    /*  |- pluckDampingMax
      |
      |         | - pluckDampingVariationMax     | -
      |         | (pluckDampingMax - pluckDamping) * |
      |         | pluckDampingVariation        | pluckDamping
      |- pluckDamping | -                  | Variation
      |         | (pluckDamping - pluckDampingMin) * | Difference
      |         | pluckDampingVariation        |
      |         | - pluckDampingVariationMin     | -
      |
      |- pluckDampingMin */
    pluckDampingVariationMin = pluckDamping - (pluckDamping - pluckDampingMin) * pluckDampingVariation;
    pluckDampingVariationMax = pluckDamping + (pluckDampingMax - pluckDamping) * pluckDampingVariation;
    // (pluckDampingMax - pluckDampingMin) * pluckDampingVariation)
    pluckDampingVariationDifference = pluckDampingVariationMax - pluckDampingVariationMin;
    pluckDampingCoefficient = pluckDampingVariationMin + (+random()) * pluckDampingVariationDifference;
    for (targetIndex = 0; (targetIndex|0) < (sampleCount|0); targetIndex = (targetIndex + 1)|0) {
      heapTargetIndexBytes = (targetArrayStart + targetIndex) << 2;
      if ((targetIndex|0) < (periodSamples|0)) {
        // for the first period, feed in noise. note heap index has to be bytes...
        heapNoiseIndexBytes = (seedNoiseStart + targetIndex) << 2;
        noiseSample = +heap[heapNoiseIndexBytes >> 2];
        noiseSample = noiseSample * velocity;// also velocity
        // by varying pluck damping, control spectral content of input noise
        curInputSample = +lowPass(curInputSample, noiseSample,pluckDampingCoefficient);
      } else if (stringTension != 1.0) {
        // for subsequent periods, feed in the output from about one period ago
        lastPeriodStartIndexBytes = (heapTargetIndexBytes - (periodSamples << 2))|0;
        skipSamplesFromTension =  ~~floor(stringTension * (+(periodSamples>>>0)));
        lastPeriodInputIndexBytes = (lastPeriodStartIndexBytes + (skipSamplesFromTension << 2))|0;
        curInputSample = +heap[lastPeriodInputIndexBytes >> 2];
        //console.log(periodSamples,lastPeriodStartIndexBytes,skipSamplesFromTension,lastPeriodInputIndexBytes,curInputSample)
      } else curInputSample = 0.0;// if stringTension=1, read & write same sample, only first period of noise preserved,
        // rest of buffer silent. But we're reusing heap, so we'd be reading samples from old waves
      // current period generated by applying a low-pass filter to the last period
      curOutputSample = +lowPass(lastOutputSample, curInputSample, smoothingFactor);
      heap[heapTargetIndexBytes >> 2] = curOutputSample;
      lastOutputSample = curOutputSample;
    }
  }
  return { renderKarplusStrong: renderKarplusStrong, };
}

