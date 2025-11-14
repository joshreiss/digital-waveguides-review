var context = new AudioContext
context.audioWorklet.addModule('Worklets.js').then(() => {
  var width1 = width.value * 400
  var constantNode= new ConstantSourceNode(context,{offset:0})
  constantNode.start()
  aDelay = context.createDelay(1)
  aDelay.delayTime.value = 1 / (440 * Math.pow (2, (note.value - 69) / 12)) - 128 / context.sampleRate
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
  var controlNode6  = new multiplySigVal(LPFilter1,decay.value,context)
  controlNode6.connect(aDelay)
  DriveNode.connect(aDelay)
  aDelay.connect(LPFilter1)
  controlNode6.connect(context.destination)

  width.onchange = function() { width1 = width.value*400 }
  //DelayNode adds 128 samples to delay time, so highest pitch around E4. Compensate to set frequency properly.
  note.onchange = ()=> { aDelay.delayTime.value = 1/(440 * Math.pow (2, (note.value - 69) / 12)) - 128/context.sampleRate }
  cutoff.onchange = ()=> { LPFilter1.parameters.get('frequency') = cutoff.value}
  sine.onchange = ()=> { OscGain.gain.value=sine.value }
  sawtooth.onchange = ()=> { PhasorGain.gain.value=sawtooth.value}
  noise.onchange = ()=> { flatNoiseGain.gain.value=noise.value}
  Pluck.onclick = function() { 
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
function multiplySigVal(inputA, val, context) {
  this.context = context;
  this.val = val;
  this.multGain = new GainNode(this.context,{gain:0});
  this.csNode = new ConstantSourceNode(this.context,{offset:this.val});
  this.csNode.start();
  inputA.connect(this.multGain);
  this.csNode.connect(this.multGain.gain);
  this.connect = function(destination) { this.multGain.connect(destination); };
  this.disconnect = function(destination) { this.multGain.disconnect(destination); };
  this.updateOffsetValue = function(value) { this.csNode.offset.value = value; }
}