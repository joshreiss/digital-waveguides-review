var context = new AudioContext
context.audioWorklet.addModule('Worklets.js').then(() => {
  var constantNode= new ConstantSourceNode(context,{offset:0})
  constantNode.start()
  aDelay = context.createDelay(1)
  var Osc = new OscillatorNode(context,{frequency:800})
  Osc.start()
  OscGain = new GainNode(context,{gain:0})
  Osc.connect(OscGain)
  Phasor = new AudioWorkletNode(context, 'phasor-generator',{parameterData:{frequency:1200,duty:0.7}})
  PhasorGain = new GainNode(context,{gain:0})
  Phasor.connect(PhasorGain)
  var flatNoise = new AudioWorkletNode(context, 'white-noise-generator')
  var flatNoiseGain = new GainNode(context,{gain:0.5})
  flatNoise.connect(flatNoiseGain)
  var LPFilter1 = new AudioWorkletNode(context, 'single-pole-lpf',{parameterData:{frequency:5700}})  
  OutGain = new GainNode(context)
  flatNoiseGain.connect(OutGain)
  PhasorGain.connect(OutGain)
  OscGain.connect(OutGain)
  var DriveNode = new multiplySignals(constantNode,OutGain,context)
  DecayGain = new GainNode(context,{gain:0})
  LPFilter1.connect(DecayGain)
  DecayGain.connect(aDelay)
  DriveNode.connect(aDelay)
  aDelay.connect(LPFilter1)
  DecayGain.connect(context.destination)  
  Pluck.onclick = function() { 
    console.log(decay.value)
    let width1 = width.value*400 
    aDelay.delayTime.value = 1 / (440 * Math.pow (2, (note.value - 69) / 12)) - 128 / context.sampleRate
    DecayGain.gain.value=decay.value
    //DelayNode adds 128 samples to delay time, so highest pitch around E4. Compensate to set frequency properly.
    LPFilter1.parameters.get('frequency').value = cutoff.value
    OscGain.gain.value=sine.value 
    PhasorGain.gain.value=sawtooth.value
    flatNoiseGain.gain.value=noise.value
    var ramp=0,now = context.currentTime
    constantNode.offset.cancelScheduledValues(now)
    constantNode.offset.linearRampToValueAtTime(1, now + ramp*0.001)
    constantNode.offset.linearRampToValueAtTime(0.999, now + ramp*0.001 + width1*0.001)
    constantNode.offset.linearRampToValueAtTime(0, now + ramp*0.001 + width1*0.005)
  }
}) 

function multiplySignals(inputA, inputB, context) {
  this.context = context;
  this.multGain = new GainNode(this.context,{gain:0});
  inputA.connect(this.multGain);
  inputB.connect(this.multGain.gain);
  this.connect = function(destination) { this.multGain.connect(destination); };
  this.disconnect = function(destination) { this.multGain.disconnect(destination); };
}