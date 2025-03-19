//adapted from https://www.acoustics.ed.ac.uk/wp-content/uploads/AMT_MSc_FinalProjects/2012__Carpenter_AMT_MSc_FinalProject_AudioUnitWaveguides.pdf
Fs = context.sampleRate // sample rate
f = 440 // frequency
N = length(Envelope); // set iterations as length of envelope
mult = []], mult2 = [] // length N
n= 0:N-1;
vib= Math.sin(2*Math.PI*4.5*n/Fs); // sine wave for vibrato
// loop to setup the mouth pressure.
for i = 1:N
    mult(i)= NoiseSource(i)*Envelope(i);
    mult2(i) = vib(i)*Envelope(i);
    input(i)= Envelope(i)+(0.0085*mult(i))+0.008*vib(i); // create the actual input
end

var Envelope = new GainNode(context,{gain:0})
var NoiseSource = new AudioBufferSourceNode(context,{loop: true} )
let samples = 3*context.sampleRate
NoiseSource.buffer = context.createBuffer(2,nFrames,context.sampleRate)
for (channel=0;channel<2;channel++) for (i=0;i<samples;i++) 
    NoiseSource.buffer.getChannelData(channel)[i] = 2*Math.random()-1
NoiseSource.start()
NoiseSource.connect(Envelope)
Envelope.connect(context.destination)
Mult = new GainNode(context,{gain:0.0085})
Mult2 = new GainNode(context,{gain:0.008})
Tone.start()
trigger.onclick = function() {
  context.resume()
  Tone.frequency.value = Frequency.value
  // 25 ms attack, then hold 2 seconds, then release 1 ms
  let now = context.currentTime
  Envelope.gain.setValueAtTime(0,now)
  Envelope.gain.linearRampToValueAtTime(0.5,now+0.025) // sustainLevel 0.5
  Envelope.gain.setValueAtTime(0.5,now + 2.025)
  Envelope.gain.linearRampToValueAtTime(0,now + 2.025 + 0.001)
}