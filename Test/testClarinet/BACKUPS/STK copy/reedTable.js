class ReedTable {
    constructor(audioContext) {
      this.waveShaper = audioContext.createWaveShaper();// Create WaveShaperNode for nonlinear reed table        
      this.offset = 0.7, this.slope = -0.3;// Default parameters 
      this.updateCurve();// Initialize the waveshaper curve
    }  
    // Update the waveshaper curve based on offset and slope
    updateCurve() {
      const tableSize = 4096;
      const curve = new Float32Array(tableSize);    
      for (let i = 0; i < tableSize; i++) {        
        let x = (i / (tableSize - 1)) * 2 - 1;// Map index to range -1 to 1         
        let y = this.offset + (this.slope * x);// Apply reed table function          
        if (Math.abs(y) > 1.0) y = Math.sign(y);// Apply limiting
        curve[i] = y;
      }    
      this.waveShaper.curve = curve;
    }  
    // Set reed table offset (reed rest position)
    setOffset(offset) {
      this.offset = offset;
      this.updateCurve();
    }  
    // Set reed table slope (reed stiffness)
    setSlope(slope) {
      this.slope = slope;
      this.updateCurve();
    }
  }
  