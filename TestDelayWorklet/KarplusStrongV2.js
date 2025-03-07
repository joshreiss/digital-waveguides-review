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

context.audioWorklet.addModule('KSWorklets.js').then(() => {
  let Noise = new AudioWorkletNode(context,'noise-generator'),
  NoiseGain = new GainNode(context,{gain:0}),
  feedbackGain = new GainNode(context,{gain:Decay.value}),
  feedbackDelay= new AudioWorkletNode(context,'myDelay-processor',
    {parameterData:{delayTime:Delay.value}
  })
  Noise.connect(NoiseGain)
  NoiseGain.connect(output)
  output.connect(feedbackDelay)
  feedbackDelay.connect(feedbackGain)
  feedbackGain.connect(output)
  output.connect(context.destination)
  Decay.oninput = function() {
    feedbackGain.gain.value=this.value
    DecayLabel.innerHTML = this.value
  }
  Delay.oninput = function() {
    feedbackDelay.parameters.get('delayTime').value=this.value
    DelayLabel.innerHTML = this.value
  }
  Width.oninput = function() { WidthLabel.innerHTML = this.value}
  Play.onclick = function() {
    context.resume()
    var newDelay= Number(Delay.value)+1000*128/context.sampleRate
    feedbackDelay.parameters.get('delayTime').value= newDelay
    let now = context.currentTime
    NoiseGain.gain.setValueAtTime(0.5, now)
    NoiseGain.gain.linearRampToValueAtTime(0, now + Width.value/1000)
  }  
})