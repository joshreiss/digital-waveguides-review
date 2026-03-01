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
  feedbackDelay= new AudioWorkletNode(context,'feedbackDelay-processor',
    {parameterData:{delayTime:Delay.value/1000,gain:Decay.value}
  })
  Noise.connect(NoiseGain)
  NoiseGain.connect(feedbackDelay)
  feedbackDelay.connect(output)
  output.connect(context.destination)
  Decay.oninput = function() {
    feedbackDelay.parameters.get('gain').value=this.value
    DecayLabel.innerHTML = this.value
  }
  Delay.oninput = function() {
    feedbackDelay.parameters.get('delayTime').value=this.value
    DelayLabel.innerHTML = this.value
  }
  Width.oninput = function() { WidthLabel.innerHTML = this.value}
  Play.onclick = function() {
    context.resume()
    feedbackDelay.parameters.get('delayTime').value= 1
    let now = context.currentTime
    NoiseGain.gain.setValueAtTime(0.5, now)
    NoiseGain.gain.setValueAtTime(0, now + 1 / context.sampleRate)
  }
})