var context = new AudioContext
let Noise = new AudioBufferSourceNode(context,{loop:true}),
    NoiseGain = new GainNode(context,{gain:0}),
    delay= new DelayNode(context,{delayTime:0.001}),
    feedbackGain= new GainNode(context,{gain:0.8})
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
//user interface

Delay.oninput = () =>  {
  delay.delayTime.value = Delay.value / 1000
  DelayNumber.value = Delay.value
}
DelayNumber.oninput = () =>  {
  delay.delayTime.value = DelayNumber.value
  Delay.value = DelayNumber.value
}
Decay.oninput = () => {
  feedbackGain.gain.value = Decay.value
  DecayNumber.value = Decay.value
}
DecayNumber.oninput = () => {
  feedbackGain.gain.value = DecayNumber.value
  Decay.value = DecayNumber.value
}
Width.oninput = () => {
  WidthNumber.value = Gain.value
}
WidthNumber.oninput = () => {
  Width.value = WidthNumber.value
}
Freq.oninput = () => {
  //feedback.gain.value = Gain.value
  FreqNumber.value = Gain.value
}
FreqNumber.oninput = () => {
  //feedback.gain.value = FreqNumber.value
  Freq.value = FreqNumber.value
}
Play.onclick = function() {
  context.resume()
  let now = context.currentTime
  NoiseGain.gain.setValueAtTime(0.5, now)
  NoiseGain.gain.linearRampToValueAtTime(0, now + Width.value/1000)
}
