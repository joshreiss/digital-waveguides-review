var context = new AudioContext
output = new GainNode(context)
var Recording = new Recorder(output)
function Start() {
  context.resume()
  Recording.record()
}
function Stop() {
  Recording.stop()
  Recording.exportWAV(blob => audio.src = URL.createObjectURL(blob))
}
context.audioWorklet.addModule('KSWorklets.js').then(() => {
  let Const = new AudioWorkletNode(context,'const-generator'),
  ConstGain = new GainNode(context,{gain:0}),
  feedbackGain = new GainNode(context,{gain:0.99}),
  feedbackDelay= new AudioWorkletNode(context,'myDelay-processor',
    {parameterData:{delayTime:1}
  })
  Const.connect(ConstGain).connect(output)
  ConstGain.connect(feedbackDelay).connect(output)
  output.connect(context.destination)
  Play.onclick = function() {
    context.resume()
    let now = context.currentTime
    ConstGain.gain.setValueAtTime(0.5, now)
    ConstGain.gain.setValueAtTime(0, now + 1.6/context.sampleRate)
  }  
})