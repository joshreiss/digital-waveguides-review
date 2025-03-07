
var context = new AudioContext()
var Tone = context.createOscillator()
var Recording = new Recorder(Tone)
function Start() {
  Tone.start()
  Recording.record()
}
function Stop() {
  Recording.stop()
  Tone.stop()
  Recording.exportWAV(blob => audio.src = URL.createObjectURL(blob))
}