// Initialize Web Audio components on start button click
let clarinet, audioContext= new AudioContext    
// Noise source for breath noise
noiseSource = new AudioBufferSourceNode(audioContext,{loop:true})
const bufferSize = audioContext.sampleRate
noiseSource.buffer = audioContext.createBuffer(1,bufferSize,audioContext.sampleRate)
noiseGain = new GainNode(audioContext,{gain:0.1})
for (let i=0;i<bufferSize;i++) noiseSource.buffer.getChannelData(0)[i] = 2*Math.random()-1
noiseSource.start()
breathPressure = audioContext.createGain()
breathEnvelope = audioContext.createGain()    
// Vibrato
vibratoOsc = audioContext.createOscillator()
vibratoOsc.start()
vibratoGain = audioContext.createGain()
vibratoEnvelope = audioContext.createGain()

noiseSource.connect(noiseGain)
noiseGain.connect(breathPressure)
breathEnvelope.connect(breathPressure)
vibratoOsc.connect(vibratoGain).connect(vibratoEnvelope)
vibratoEnvelope.connect(breathPressure.gain)
startButton.onclick = ()=> {
    audioContext.resume()  
    createKeyboard();// Create keyboard        
    startButton.disabled = true
    clarinet = new ClarinetModel(audioContext)// Create clarinet model
    breathPressure.connect(clarinet.input)
    clarinet.connect(audioContext.destination);// Connect audio path   
}
// Play and stop notes
function playNote(frequency) {  
  const now = audioContext.currentTime     
  const velocity = 1
  const maxPressure = pressureSlider.value * velocity// Calculate breath pressure based on velocity & pressure parameter
  // Set noise gain
  noiseGain.gain.setTargetAtTime(noiseGainSlider.value * maxPressure,now,0.01)
  // Set envelope parameters
  const attack = parseInt(envelopeAttackSlider.value)
  const decay = parseInt(envelopeDecaySlider.value)
  const release = parseInt(envelopeReleaseSlider.value)
  // Apply ADSR envelope
  breathEnvelope.gain.cancelScheduledValues(now)
  breathEnvelope.gain.setValueAtTime(0, now)
  breathEnvelope.gain.linearRampToValueAtTime(maxPressure, now + attack);
  breathEnvelope.gain.linearRampToValueAtTime(maxPressure * 0.9, now + attack + decay)
  // Start vibrato with attack
  const vibratoAttack = parseInt(vibratoAttackSlider.value)
  vibratoEnvelope.gain.cancelScheduledValues(now)
  vibratoEnvelope.gain.setValueAtTime(0, now)
  vibratoEnvelope.gain.linearRampToValueAtTime(vibratoGainSlider.value * 0.1,now + vibratoAttack * 0.1)
  vibratoEnvelope.gain.linearRampToValueAtTime(vibratoGainSlider.value,now + vibratoAttack)
  clarinet.setFrequency(frequency)        
  freqSlider.value = Math.round(frequency)// Update frequency display
}    
function stopNote() { 
    const now = audioContext.currentTime;
    const release = parseInt(envelopeReleaseSlider.value)
    const vibratoRelease = parseInt(vibratoReleaseSlider.value)  
    // Apply release to breath pressure
    breathEnvelope.gain.cancelScheduledValues(now)
    breathEnvelope.gain.setValueAtTime(breathEnvelope.gain.value, now);
    breathEnvelope.gain.linearRampToValueAtTime(0, now + release)    
    // Apply release to vibrato
    vibratoEnvelope.gain.cancelScheduledValues(now);
    vibratoEnvelope.gain.setValueAtTime(vibratoEnvelope.gain.value, now);
    vibratoEnvelope.gain.linearRampToValueAtTime(0, now + vibratoRelease)
}    
// Set up all sliders
freqSlider.oninput = () => clarinet.setFrequency(freqSlider.value)  
reedStiffnessSlider.oninput = () => clarinet.setReedStiffness(reedStiffnessSlider.value)
noiseGainSlider.oninput = () => noiseGain.gain.value = noiseGainSlider.value
nonLinearitySlider.oninput = () => clarinet.setNonLinearity(nonLinearitySlider.value);
nonLinAttackSlider.oninput = () => clarinet.setNonLinAttack(nonLinAttackSlider.value);      
vibratoFreqSlider.oninput = () => vibratoOsc.frequency.setTargetAtTime(vibratoFreqSlider.value,audioContext.currentTime,0.05)
