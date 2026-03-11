var context = new AudioContext
context.audioWorklet.addModule('worklets.js').then(() => {
  var constantNode= new ConstantSourceNode(context,{offset:0})
  constantNode.start()
  aDelay = context.createDelay(1)
  Phasor = new AudioWorkletNode(context, 'phasor-generator',{parameterData:{frequency:1200,duty:0.7}})
  var DriveNode = new multiplySignals(constantNode,Phasor,context)
  DecayGain = new GainNode(context,{gain:0})
  DecayGain.connect(aDelay)
  DriveNode.connect(aDelay)
  aDelay.connect(DecayGain)
  DecayGain.connect(context.destination)  
  Pluck.onclick = function() { 
    context.resume()
    aDelay.delayTime.value =0.01
    DecayGain.gain.value=0.97
    now = context.currentTime
    constantNode.offset.cancelScheduledValues(now)
    constantNode.offset.linearRampToValueAtTime(1, now)
    constantNode.offset.linearRampToValueAtTime(0, now + 0.01)
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