function AsmFunctionsWrapper() { }
AsmFunctionsWrapper.prototype.initAsm = function(heapSize) {
  // data in/out via heap.  seedNoise.length will be different depending on string, so enlarge as needed
  this.heap = new Float32Array(1048576)
  var heapBuffer = this.heap.buffer;// heap passed in as plain ArrayBuffer (.buffer is ArrayBuffer referenced by Float32Buffer)
  var foreignFunctions = { random: Math.random, round: Math.round };// nonasm functions 
  this.asm = asmFunctions(window, foreignFunctions, heapBuffer); // do this here so only recreate asm functions if needed
}
AsmFunctionsWrapper.prototype.pluck = function(channelBuffer,seedNoise,hz) {
  var requiredHeapSize = seedNoise.length + channelBuffer.length;
  if (typeof(this.heap) == 'undefined') { this.initAsm(requiredHeapSize); }
  if (requiredHeapSize > this.heap.length) this.initAsm(requiredHeapSize);
  var heapFloat32 = this.heap;
  var asm = this.asm;
  for (var i = 0; i < seedNoise.length; i++) heapFloat32[i] = seedNoise[i];
  var heapOffsets = { seedStart: 0,seedEnd: seedNoise.length - 1, targetStart: seedNoise.length,targetEnd: seedNoise.length + channelBuffer.length - 1 };
  asm.renderKarplusStrong(heapOffsets.seedStart,heapOffsets.seedEnd,heapOffsets.targetStart,heapOffsets.targetEnd,hz);
  for (i=0;i<channelBuffer.getChannelData(0).length;i++) channelBuffer.getChannelData(0)[i] = heapFloat32[heapOffsets.targetStart+i] * 0.5;
  for (i=0;i<channelBuffer.getChannelData(1).length;i++) channelBuffer.getChannelData(1)[i] = heapFloat32[heapOffsets.targetStart+i] * 0.5;
};
// standard asm.js block; stdlib: calling library functions, foreign: calling external functions, heap: buffer for data in/out of function
function asmFunctions(stdlib, foreign, heapBuffer) {
  "use asm";
  var heap = new stdlib.Float32Array(heapBuffer);// heap supposed to come in as just ArrayBuffer so first need to get Float32 view of it
  var round = foreign.round;  
  function lowPass(lastOutput, currentInput, smoothingFactor) {
    lastOutput = +lastOutput;
    currentInput = +currentInput;
    smoothingFactor = +smoothingFactor
    var currentOutput = 0.0;
    currentOutput = smoothingFactor * currentInput + (1.0 - smoothingFactor) * lastOutput
    return +currentOutput;
  }
  function renderKarplusStrong(seedNoiseStart,seedNoiseEnd,targetArrayStart,targetArrayEnd,hz) {
    seedNoiseStart = seedNoiseStart|0;
    seedNoiseEnd = seedNoiseEnd|0;
    targetArrayStart = targetArrayStart|0;
    targetArrayEnd = targetArrayEnd|0;
    hz = +hz;
    var sampleRate = 48000;
    var periodSamples = 0;
    var sampleCount = 0;
    var noiseSample = 0.0;
    var heapNoiseIndexBytes = 0;// byte-addressed index of heap as whole that we get noise samples from
    var targetIndex = 0;    // Float32-addressed index of  portion of heap that we'll be writing to
    var heapTargetIndexBytes = 0;// byte-addressed index of heap as whole where we'll be writing
    var lastPeriodInputIndexBytes = 0;// byte-addressed index of heap as whole from where we take samples from last period
    periodSamples = ~~(+round( +(sampleRate>>>0)) / hz);
    console.log('periodSamples',periodSamples)
    console.log('hz',hz)    
    var lastOutputSample = 0.0;
    var curInputSample = 0.0;
    var curOutputSample = 0.0;
    var smoothingFactor = 0.5;
    sampleCount = (targetArrayEnd-targetArrayStart+1)|0;
    console.log('sampleCount',sampleCount)
    console.log('smooth',smoothingFactor)
    for (targetIndex = 0; (targetIndex|0) < (sampleCount|0); targetIndex = (targetIndex + 1)|0) {
      heapTargetIndexBytes = (targetArrayStart + targetIndex) << 2;
      if ((targetIndex|0) < (periodSamples|0)) { // for first period, feed in noise. note heap index has to be bytes.
        heapNoiseIndexBytes = (seedNoiseStart + targetIndex) << 2;
        noiseSample = +heap[heapNoiseIndexBytes >> 2];
        noiseSample = noiseSample * 0.25
        curInputSample = 0.96 * (noiseSample);
      } else { // for subsequent periods, feed in output from about one period ago
        lastPeriodInputIndexBytes = (heapTargetIndexBytes - (periodSamples << 2))|0;
        curInputSample = +heap[lastPeriodInputIndexBytes >> 2];
      }
      curOutputSample = +lowPass(lastOutputSample, curInputSample, smoothingFactor);
      heap[heapTargetIndexBytes >> 2] = curOutputSample;
      lastOutputSample = curOutputSample;
    }
  }
  return { renderKarplusStrong: renderKarplusStrong };
}