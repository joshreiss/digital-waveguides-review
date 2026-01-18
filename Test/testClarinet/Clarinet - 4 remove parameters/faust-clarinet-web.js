class ClarinetModel {
  constructor(context) {
    // Create nodes
    this.outputNode = context.createGain()
    this.delayLine = context.createDelay(2.0); // Max 2 seconds delay
    this.breathPressure = context.createGain();
    this.breathEnvelope = context.createGain()    
    this.filter = new BiquadFilterNode(context,{type:'highpass',frequency:8000,Q:0.7})// One-zero filter (approximated with BiquadFilter)
    // Reed table (nonlinear waveshaper)
    this.reedTable = context.createWaveShaper();
    this.updateReedTable(0.5); // Default reed stiffness
    // Vibrato
    this.vibratoOsc = context.createOscillator();
    this.vibratoGain = context.createGain();
    this.vibratoEnvelope = context.createGain();
    // Nonlinear filter simulation
    this.nonLinearityNode = context.createGain();
    // Setup default parameter values (matching Faust implementation)
    this.parameters = {
      freq:440,reedStiffness:0.5,pressure:1.0,nonLinearity:0.0,nonLinAttack:0.1,vibratoFreq:5.0,
      vibratoGain:0.1,vibratoAttack:0.5,vibratoRelease:0.01,envelopeAttack:0.01,envelopeDecay:0.05,envelopeRelease:0.1 }   
    // Initialize all values
    this.breathEnvelope.gain.value = 0.0;
    this.vibratoGain.gain.value = 0.0;
    this.vibratoOsc.frequency.value = this.parameters.vibratoFreq
    // Connect the nodes to create the waveguide model
    this.setupAudioGraph();    
    // Start oscillators
    this.vibratoOsc.start()
    // Set initial frequency 440    
    // Store the frequency value
    this.parameters.freq = 440
    // Calculate delay line length based on frequency
    // Delay length = (sample rate / frequency) * 0.5 - filter corrections
    const delayLength = (context.sampleRate / 440) * 0.5 - 1.5    
    // Set the delay time
    this.delayLine.delayTime.setTargetAtTime(delayLength / context.sampleRate,context.currentTime,0.01)  
  }  
  setupAudioGraph() {
    // Breath pressure path
    this.breathEnvelope.connect(this.breathPressure);  
    // Vibrato
    this.vibratoOsc.connect(this.vibratoGain);
    this.vibratoGain.connect(this.vibratoEnvelope);
    this.vibratoEnvelope.connect(this.breathPressure.gain);    
    // Main waveguide feedback loop
    this.breathPressure.connect(this.reedTable);
    this.reedTable.connect(this.delayLine);
    this.delayLine.connect(this.filter);
    this.filter.connect(this.nonLinearityNode);    
    // Feedback from filter back to reed table
    this.filter.connect(this.reedTable);    
    // Output path
    this.nonLinearityNode.connect(this.outputNode)
  }  
  updateReedTable(stiffness) {
    // Reed table parameters (from the Faust implementation)
    const offset = 0.7;
    const slope = -0.44 + (0.26 * stiffness)    
    // Create the reed table waveshaper curve
    const tableSize = 2048;
    const curve = new Float32Array(tableSize)    
    for (let i = 0; i < tableSize; i++) {
      // Map index to range -1 to 1
      let x = (i / (tableSize - 1)) * 2 - 1;      
      // Apply reed table function (offset + slope * x)
      let y = offset + (slope * x);      
      // Apply limiting
      if (y > 1.0) y = 1.0;
      if (y < -1.0) y = -1.0;
      curve[i] = y;
    }    
    this.reedTable.curve = curve;
  }  
  startNote(frequency,velocity = 1.0) {
    const now = context.currentTime 
    // Set envelope parameters
    const attack = this.parameters.envelopeAttack;
    const decay = this.parameters.envelopeDecay;
    const release = this.parameters.envelopeRelease;    
    // Calculate breath pressure based on velocity and pressure parameter
    const maxPressure = this.parameters.pressure * velocity;    
    // Apply ADSR envelope
    this.breathEnvelope.gain.cancelScheduledValues(now);
    this.breathEnvelope.gain.setValueAtTime(0,now);
    this.breathEnvelope.gain.linearRampToValueAtTime(maxPressure,now + attack);
    this.breathEnvelope.gain.linearRampToValueAtTime(maxPressure * 0.9,now + attack + decay);    
        // Start vibrato with attack
    const vibratoAttack = this.parameters.vibratoAttack;
    this.vibratoEnvelope.gain.cancelScheduledValues(now);
    this.vibratoEnvelope.gain.setValueAtTime(0,now);
    this.vibratoEnvelope.gain.linearRampToValueAtTime(this.parameters.vibratoGain * 0.1,now + vibratoAttack * 0.1);
    this.vibratoEnvelope.gain.linearRampToValueAtTime(this.parameters.vibratoGain,now + vibratoAttack);
  }  
  stopNote() {
    const now = context.currentTime;
    const release = this.parameters.envelopeRelease;
    const vibratoRelease = this.parameters.vibratoRelease    
    // Apply release to breath pressure
    this.breathEnvelope.gain.cancelScheduledValues(now);
    this.breathEnvelope.gain.setValueAtTime(this.breathEnvelope.gain.value,now);
    this.breathEnvelope.gain.linearRampToValueAtTime(0,now + release);
    // Apply release to vibrato
    this.vibratoEnvelope.gain.cancelScheduledValues(now);
    this.vibratoEnvelope.gain.setValueAtTime(this.vibratoEnvelope.gain.value,now);
    this.vibratoEnvelope.gain.linearRampToValueAtTime(0,now + vibratoRelease);
  }
  connect(destination) { this.outputNode.connect(destination)}
  // Parameter setters
  setReedStiffness(value) {
    this.parameters.reedStiffness = value;
    this.updateReedTable(value);
  }
  setPressure(value) { this.parameters.pressure = value} // Actual pressure is set during noteOn
  setNonLinearity(value) {
    this.parameters.nonLinearity = value;
    this.nonLinearityNode.gain.setTargetAtTime(1.0 + value * 0.2,context.currentTime,0.05)// Simple approximation of nonlinear effect
  }
  setVibratoFreq(value) {
    this.parameters.vibratoFreq = value;
    this.vibratoOsc.frequency.setTargetAtTime(value,context.currentTime,0.05);
  }
  setVibratoGain(value) { this.parameters.vibratoGain = value } // Actual vibrato gain is applied during noteOn with envelope  }
  setEnvelopeAttack(value) { this.parameters.envelopeAttack = value  }
  setEnvelopeDecay(value) { this.parameters.envelopeDecay = value  }
  setEnvelopeRelease(value) { this.parameters.envelopeRelease = value }
  setVibratoAttack(value) { this.parameters.vibratoAttack = value  }
  setVibratoRelease(value) { this.parameters.vibratoRelease = value }
  setNonLinAttack(value) { this.parameters.nonLinAttack = value }
}