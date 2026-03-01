function AsmFunctionsWrapper() { }
AsmFunctionsWrapper.prototype.initAsm = function(heapSize) {
    var roundedHeapSize = getNextValidFloat32HeapLength(heapSize);
    // asm.js requires all data in/out of function to be via heap object. don't want to allocate new heap every call,so reuse 
    // static variable but seedNoise.length will be different depending on string, so be willing to enlarge it if needed
    this.heap = new Float32Array(roundedHeapSize)
    // from asm.js spec, seems heap must be passed in as plain ArrayBuffer (.buffer is ArrayBuffer referenced by Float32Buffer)
    var heapBuffer = this.heap.buffer;
    // any non-asm.js functions must be referenced through a "foreign function" interface
    var foreignFunctions = { random: Math.random, round: Math.round, };
    // do this here so we only recreate asm functions if needed. so V8 will be able to cache optimized versions of functions
    this.asm = asmFunctions(window, foreignFunctions, heapBuffer);
}
AsmFunctionsWrapper.prototype.pluck = function(channelBuffer,seedNoise,sampleRate,hz,smoothingFactor,velocity,options) {
    var requiredHeapSize = seedNoise.length + channelBuffer.length;
    if (typeof(this.heap) == 'undefined') { this.initAsm(requiredHeapSize); }
    if (requiredHeapSize > this.heap.length) this.initAsm(requiredHeapSize);
    var heapFloat32 = this.heap;
    var asm = this.asm;
    var i;
    for (i = 0; i < seedNoise.length; i++) heapFloat32[i] = seedNoise[i];
    var heapOffsets = { seedStart: 0,seedEnd: seedNoise.length - 1,
      targetStart: seedNoise.length,targetEnd: seedNoise.length + channelBuffer.length - 1 };
    asm.renderKarplusStrong(heapOffsets.seedStart,heapOffsets.seedEnd,heapOffsets.targetStart,
        heapOffsets.targetEnd,sampleRate,hz,velocity,smoothingFactor,options.stringTension,
        options.pluckDamping,options.pluckDampingVariation,options.characterVariation);
    if (options.body == "simple") { asm.resonate(heapOffsets.targetStart, heapOffsets.targetEnd); }
    asm.fadeTails(heapOffsets.targetStart,heapOffsets.targetEnd - heapOffsets.targetStart + 1);
    var targetArrayL = channelBuffer.getChannelData(0);
    var targetArrayR = channelBuffer.getChannelData(1);
    for (i = 0; i < targetArrayL.length; i++) { targetArrayL[i] = heapFloat32[heapOffsets.targetStart+i] * 0.5; }
    for (i = 0; i < targetArrayL.length; i++) { targetArrayR[i] = heapFloat32[heapOffsets.targetStart+i] * 0.5; }
};
// http://asmjs.org/spec/latest/#modules
//  byte length must be 2^n for n in [12, 24], or for bigger heaps, 2^24 * n for n >= 1
function getNextValidFloat32HeapLength(desiredLengthFloats) {
    var heapLengthBytes;
    var desiredLengthBytes = desiredLengthFloats << 2;
    if (desiredLengthBytes <= Math.pow(2, 12)) { heapLengthBytes = Math.pow(2, 12); } 
    else if (desiredLengthBytes < Math.pow(2, 24)) { heapLengthBytes = Math.pow(2, Math.ceil(Math.log2(desiredLengthBytes))); } 
    else throw("Heap length greater than 2^24 bytes not implemented");
    return heapLengthBytes;
}
// standard asm.js block
// stdlib: object through which standard library functions are called
// foreign: object through which external javascript functions are called
// heap: buffer used for all data in/out of function
function asmFunctions(stdlib, foreign, heapBuffer) {
    "use asm";
    // heap is supposed to come in as just an ArrayBuffer so first need to get a Float32 view of it
    var heap = new stdlib.Float32Array(heapBuffer);
    var fround = stdlib.Math.fround;
    var sin = stdlib.Math.sin;
    var pi = stdlib.Math.PI;
    var floor = stdlib.Math.floor;
    var pow = stdlib.Math.pow;
    var random = foreign.random;
    var round = foreign.round;
    function lowPass(lastOutput, currentInput, smoothingFactor) {// simple discrete-time lowpass filter
        // +x represents double, coersion to indicate type of arguments, do arithmetic with doubles because in asm.js spec, 
        // float operations resolve to 'floatish'es, which need to be coerced back to floats & code becomes unreadable
        lastOutput = +lastOutput;
        currentInput = +currentInput;
        smoothingFactor = +smoothingFactor
        var currentOutput = 0.0;
        currentOutput = smoothingFactor * currentInput + (1.0 - smoothingFactor) * lastOutput
        return +currentOutput;
    }
    function highPass(lastOutput, lastInput, currentInput, smoothingFactor) {// simple discrete-time highpass filter
        lastOutput = +lastOutput;
        lastInput = +lastInput;
        currentInput = +currentInput;
        smoothingFactor = +smoothingFactor;
        var currentOutput = 0.0;
        currentOutput = smoothingFactor * lastOutput + smoothingFactor * (currentInput - lastInput);
        return +currentOutput;
    }    
    function resonate(heapStart, heapEnd) {// Copied from original ActionScript source, haven't figured out how it works
        // '|0' declares parameter as int http://asmjs.org/spec/latest/#parameter-type-annotations
        heapStart = heapStart|0;
        heapEnd = heapEnd|0;
        // explicitly initialise all variables so types are declared
        var r00 = 0.0,f00 = 0.0,r10 = 0.0,f10 = 0.0;
        var f0 = 0.0,c0 = 0.0,c1 = 0.0,r0 = 0.0,r1 = 0.0;
        var i = 0;
        var resonatedSample = 0.0;
        var resonatedSamplePostHighPass = 0.0;
        // by making the smoothing factor large, we make cutoff frequency very low, acting as just an offset remover
        var highPassSmoothingFactor = 0.999;
        var lastOutput = 0.0;
        var lastInput = 0.0;
        // +x indicates that x is a double , asm.js Math functions take doubles as arguments
        c0 = 2.0 * sin(pi * 3.4375 / 44100.0);
        c1 = 2.0 * sin(pi * 6.124928687214833 / 44100.0);
        r0 = 0.98;
        r1 = 0.98
        // asm.js seems to require byte addressing of the heap? http://asmjs.org/spec/latest/#validateheapaccess-e
        // yeah, when accessing heap with index which is an expression, total index expression is validated in a way 
        // that forces index to be a byte and apparently '|0' coerces to signed when not in context of parameters
        // http://asmjs.org/spec/latest/#binary-operators
        for (i = heapStart << 2; (i|0) <= (heapEnd << 2); i = (i + 4)|0) {
            r00 = r00 * r0;
            r00 = r00 + (f0 - f00) * c0;
            f00 = f00 + r00;
            f00 = f00 - f00 * f00 * f00 * 0.166666666666666;
            r10 = r10 * r1;
            r10 = r10 + (f0 - f10) * c1;
            f10 = f10 + r10;
            f10 = f10 - f10 * f10 * f10 * 0.166666666666666;
            f0 = +heap[i >> 2];
            resonatedSample = f0 + (f00 + f10) * 2.0;
            // I'm not sure why, but the resonating process plays havok with DC offset - it jumps around everywhere.
            // We put it back to zero DC offset by adding a high-pass filter with a super low cutoff frequency.
            resonatedSamplePostHighPass = +highPass(lastOutput,lastInput,resonatedSample,highPassSmoothingFactor);
            heap[i >> 2] = resonatedSamplePostHighPass;
            lastOutput = resonatedSamplePostHighPass;
            lastInput = resonatedSample;
        }
    }
    // apply fade envelope to end of buffer to make end 0 ampltiude, to avoid clicks heard when sample suddenly cuts off
    function fadeTails(heapStart, length) {
        heapStart = heapStart|0;
        length = length|0;
        var heapEnd = 0;
        var tailProportion = 0.0;
        var tailSamples = 0;
        var tailSamplesStart = 0;
        var i = 0;
        var samplesThroughTail = 0;
        var proportionThroughTail = 0.0;
        var gain = 0.0;
        tailProportion = 0.1;
        // first convert length from int to unsigned (>>>0) so we can convert it to double for argument of floor()
        // then convert it to double (+) then convert double result of floor to a signed with ~~
        // http://asmjs.org/spec/latest/#binary-operators
        // http://asmjs.org/spec/latest/#standard-library
        // http://asmjs.org/spec/latest/#binary-operators
        tailSamples = ~~floor(+(length>>>0) * tailProportion);
        // http://asmjs.org/spec/latest/#additiveexpression result of addition is intish & must be coerced back to an int
        tailSamplesStart = (heapStart + length - tailSamples)|0;
        heapEnd = (heapStart + length)|0;
        // i represents a byte index, and the heap is a Float32Array (4 bytes)
        for (i= tailSamplesStart << 2,samplesThroughTail = 0; 
          (i|0) < (heapEnd << 2);i= (i + 4)|0,
          samplesThroughTail= (samplesThroughTail+1)|0) {
            proportionThroughTail = (+(samplesThroughTail>>>0)) / (+(tailSamples>>>0));
            gain = 1.0 - proportionThroughTail;
            heap[i >> 2] = heap[i >> 2] * fround(gain);
        }
    }
    // smoothing factor parameter is coefficient used on terms in main lowpass filter in Karplus-Strong loop
    function renderKarplusStrong(seedNoiseStart,seedNoiseEnd,targetArrayStart,targetArrayEnd,sampleRate, hz, velocity,
                                 smoothingFactor, stringTension,pluckDamping,pluckDampingVariation,characterVariation) {
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
        characterVariation = +characterVariation;
        var period = 0.0;
        var periodSamples = 0;
        var sampleCount = 0;
        var lastOutputSample = 0.0;
        var curInputSample = 0.0;
        var noiseSample = 0.0;
        var skipSamplesFromTension = 0;
        var curOutputSample = 0.0;
        var pluckDampingMin = 0.0;
        var pluckDampingMax = 0.0;
        var pluckDampingVariationMin = 0.0;
        var pluckDampingVariationMax = 0.0;
        var pluckDampingVariationDifference = 0.0;
        var pluckDampingCoefficient = 0.0;
        var heapNoiseIndexBytes = 0;// byte-addressed index of heap as whole that we get noise samples from
        var targetIndex = 0;        // Float32-addressed index of  portion of heap that we'll be writing to
        var heapTargetIndexBytes = 0;// byte-addressed index of heap as whole where we'll be writing
        var lastPeriodStartIndexBytes = 0;// byte-addressed index of heap as whole of start of last period of samples
        var lastPeriodInputIndexBytes = 0;// byte-addressed index of heap as whole from where we take samples from last period, after having added skip from tension
        period = 1.0/hz;
        periodSamples = ~~(+round(period * +(sampleRate>>>0)));
        sampleCount = (targetArrayEnd-targetArrayStart+1)|0;
        /*
        |- pluckDampingMax
        |
        |               | - pluckDampingVariationMax         | -
        |               | (pluckDampingMax - pluckDamping) * |
        |               | pluckDampingVariation              | pluckDamping
        |- pluckDamping | -                                  | Variation
        |               | (pluckDamping - pluckDampingMin) * | Difference
        |               | pluckDampingVariation              |
        |               | - pluckDampingVariationMin         | -
        |
        |- pluckDampingMin
        */
        pluckDampingMin = 0.1;
        pluckDampingMax = 0.9;
        pluckDampingVariationMin = pluckDamping - (pluckDamping - pluckDampingMin) * pluckDampingVariation;
        pluckDampingVariationMax = pluckDamping + (pluckDampingMax - pluckDamping) * pluckDampingVariation;
        pluckDampingVariationDifference = pluckDampingVariationMax - pluckDampingVariationMin;
        pluckDampingCoefficient = pluckDampingVariationMin + (+random()) * pluckDampingVariationDifference;
        for (targetIndex = 0; (targetIndex|0) < (sampleCount|0); targetIndex = (targetIndex + 1)|0) {
            heapTargetIndexBytes = (targetArrayStart + targetIndex) << 2;
            if ((targetIndex|0) < (periodSamples|0)) {
                // for the first period, feed in noise. remember, heap index has to be bytes...
                heapNoiseIndexBytes = (seedNoiseStart + targetIndex) << 2;
                noiseSample = +heap[heapNoiseIndexBytes >> 2];
                noiseSample = noiseSample * (1.0 - characterVariation);// create room for character variation noise
                noiseSample = noiseSample + characterVariation * (-1.0 + 2.0 * (+random()));// add character variation
                noiseSample = noiseSample * velocity;// also velocity
                // noiseSample = noiseSample * (1 - characterVariation) + characterVariation * (2*random()-1)

                // by varying 'pluck damping', we can control the spectral content of the input noise
                curInputSample =
                    +lowPass(curInputSample, noiseSample,pluckDampingCoefficient);
            } else if (stringTension != 1.0) {
                // for subsequent periods, feed in the output from about one period ago
                lastPeriodStartIndexBytes = (heapTargetIndexBytes - (periodSamples << 2))|0;
                skipSamplesFromTension =  ~~floor(stringTension * (+(periodSamples>>>0)));
                lastPeriodInputIndexBytes = (lastPeriodStartIndexBytes + (skipSamplesFromTension << 2))|0;
                curInputSample = +heap[lastPeriodInputIndexBytes >> 2];
            } else curInputSample = 0.0;// if stringTension=1, read & write same sample, only first period of noise preserved,
                // rest of buffer silent. But we're reusing heap, so we'd be reading samples from old waves
            // current period generated by applying a low-pass filter to the last period
            curOutputSample = +lowPass(lastOutputSample, curInputSample, smoothingFactor);
            heap[heapTargetIndexBytes >> 2] = curOutputSample;
            lastOutputSample = curOutputSample;
        }
    }
    return { renderKarplusStrong: renderKarplusStrong, fadeTails: fadeTails, resonate: resonate, };
}

