// Web Audio implementation of Faust Clarinet
class ClarinetModel {
  constructor(audioContext) {
    this.context = audioContext    
    // Create nodes
    this.input = this.context.createGain()
    this.outputNode = this.context.createGain()
    this.delayLine = this.context.createDelay(2.0); // Max 2 seconds delay
    // One-zero filter (approximated with BiquadFilter)    
    this.filter = new BiquadFilterNode(this.context,{type:'highpass',frequency:8000,Q:0.7})
    // Reed table (nonlinear waveshaper)
    this.reedTable = this.context.createWaveShaper();
    this.updateReedTable(0.5); // Default reed stiffness  
    // Nonlinear filter simulation
    this.nonLinearityNode = this.context.createGain();
    // Setup default parameter values (matching Faust implementation)
    this.parameters = { freq:440,reedStiffness:0.5,nonLinearity:0.0,nonLinAttack:0.1 }     
    // WAVEGUIDE feedback loop ***
    this.input.connect(this.reedTable)
    this.reedTable.connect(this.delayLine)
    this.delayLine.connect(this.filter)
    this.filter.connect(this.nonLinearityNode)
    // Feedback from filter back to reed table
    this.filter.connect(this.reedTable)
    // Output path
    this.nonLinearityNode.connect(this.outputNode)
    // Set initial frequency
    this.setFrequency(this.parameters.freq)
  }
  updateReedTable(stiffness) {
    // Reed table parameters (from the Faust implementation)
    const offset = 0.7;
    const slope = -0.44 + (0.26 * stiffness)    
    // Create the reed table waveshaper curve
    const tableSize = 2048
    const curve = new Float32Array(tableSize)    
    for (let i = 0; i < tableSize; i++) {
      let x = (i / (tableSize - 1)) * 2 - 1 // Map index to range -1 to 1
      let y = offset + (slope * x) // Apply reed table function
      if (Math.abs(y) > 1) y = Math.sign(y)// Apply limiting
      curve[i] = y
    }    
    this.reedTable.curve = curve
  }
  setFrequency(frequency) {    //console.log(value); 
    this.parameters.freq = frequency // Store the frequency value
    // Calculate delay line length based on frequency
    // Delay length = (sample rate / frequency) * 0.5 - filter corrections
    const delayLength = (this.context.sampleRate / frequency) * 0.5 - 1.5    
    // Set the delay time
    this.delayLine.delayTime.setTargetAtTime(delayLength / this.context.sampleRate,this.context.currentTime,0.01)
  }  
  // Parameter setters
  setReedStiffness(value) {console.log(value); 
    this.parameters.reedStiffness = value;
    this.updateReedTable(value);
  }
  setNonLinearity(value) {console.log(value); 
    this.parameters.nonLinearity = value;
    this.nonLinearityNode.gain.setTargetAtTime(1 + 0.2*value,this.context.currentTime,0.05) // Simple approximation of nonlinear effect
  }
  setNonLinAttack(value) { console.log(value); this.parameters.nonLinAttack = value }
  connect(destination) { this.outputNode.connect(destination) }
}
