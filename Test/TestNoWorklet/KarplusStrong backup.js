var context = new AudioContext
output = new GainNode(context)
var Recording = new Recorder(output)
function Start() {
  Recording.record()
}
function Stop() {
  Recording.stop()
  Recording.exportWAV(blob => audio.src = URL.createObjectURL(blob))
}
let Noise = new AudioBufferSourceNode(context,{loop:true}),
    NoiseGain = new GainNode(context,{gain:0}),
    delay= new DelayNode(context,{delayTime:Delay.value/1000}),
    feedbackGain= new GainNode(context,{gain:Decay.value})
Noise.buffer = context.createBuffer(1,context.sampleRate,context.sampleRate)
for (i=0;i<context.sampleRate;i++) 
  Noise.buffer.getChannelData(0)[i] = 2*Math.random()-1
Noise.start()    
Noise.connect(NoiseGain)
NoiseGain.connect(output)
NoiseGain.connect(delay)
delay.connect(feedbackGain)
feedbackGain.connect(delay)
feedbackGain.connect(output)
output.connect(context.destination)
Decay.oninput = function() {
  feedbackGain.gain.value=this.value
  DecayLabel.innerHTML = this.value
}
Delay.oninput = function() {
  delay.delayTime.value=0.001*this.value
  DelayLabel.innerHTML = this.value
  console.log(this.value, DelayLabel.innerHTML )
}
Width.oninput = function() { WidthLabel.innerHTML = this.value}
Play.onclick = function() {
  context.resume()
  console.log(context.sampleRate);
  console.log(feedbackGain.gain.value, Decay.value)
  let now = context.currentTime
  NoiseGain.gain.setValueAtTime(0.5, now)
  //NoiseGain.gain.linearRampToValueAtTime(0, now + Width.value/1000)
  
  delay.delayTime.value=0.001*this.value
  NoiseGain.gain.setValueAtTime(0, now + 1 / context.sampleRate)
}
