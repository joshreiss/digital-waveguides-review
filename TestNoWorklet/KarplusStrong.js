var context = new AudioContext
let Noise = new AudioBufferSourceNode(context,{loop:true}),
    NoiseGain = new GainNode(context,{gain:0}),
    delay= new DelayNode(context,{delayTime:Delay.value/1000}),
    feedbackGain= new GainNode(context,{gain:Decay.value})
Noise.buffer = context.createBuffer(1,context.sampleRate,context.sampleRate)
for (i=0;i<context.sampleRate;i++) 
  Noise.buffer.getChannelData(0)[i] = 2*Math.random()-1
Noise.start()    
Noise.connect(NoiseGain)
NoiseGain.connect(context.destination)
NoiseGain.connect(delay)
delay.connect(feedbackGain)
feedbackGain.connect(delay)
feedbackGain.connect(context.destination)
Decay.oninput = function() {
  feedbackGain.gain.value=this.value
  DecayLabel.innerHTML = this.value
}
Delay.oninput = function() {
  delay.delayTime.value=0.001*this.value
  DelayLabel.innerHTML = this.value
}
Width.oninput = function() { WidthLabel.innerHTML = this.value}
Play.onclick = function() {
  context.resume()
  console.log(feedbackGain.gain.value, Decay.value)
  let now = context.currentTime
  NoiseGain.gain.setValueAtTime(0.5, now)
  NoiseGain.gain.linearRampToValueAtTime(0, now + Width.value/1000)
}
