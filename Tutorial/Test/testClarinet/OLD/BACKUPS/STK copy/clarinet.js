// Clarinet implementation for Web Audio API, based on the STK (Synthesis ToolKit) C++ implementation
class Clarinet {
    constructor(audioContext) {
      this.context = audioContext;    
      // Set default parameters
      this.frequency = 440.0;
      this.sampleRate = this.context.sampleRate;    
      // Create nodes
      this.outputNode = this.context.createGain();
      this.boreLengthGain = this.context.createGain();    
      // Delay line (bore) - Web Audio DelayNode
      this.delayLine = this.context.createDelay(1.0); // 1 second max delay    
      // Nonlinear reed function
      this.reedTable = new ReedTable(this.context);    
      // One-zero filter for bore losses, approximate with BiquadFilter
      this.lossFilter = new BiquadFilterNode(this.context,{frequency:12000})
      // Noise source (breath noise)
      this.noiseSource = this.context.createBufferSource();
      this.noiseGain = new GainNode(this.context,{gain:0.2})
      this.createNoiseBuffer();    
      // Breath pressure envelope
      this.breathEnvelope = new GainNode(this.context,{gain:0.0})   
      // Vibrato
      this.vibratoOsc = new OscillatorNode(this.context,{frequency:5.0})  
      this.vibratoGain = new GainNode(this.context,{gain:0.0}) 
      // Start oscillators
      this.vibratoOsc.start();
      this.noiseSource.loop = true;
      this.noiseSource.start();
      
      this.connect();// Connect components to create waveguide feedback loop
    }
    
    // Create and connect the audio graph
    connect() {
      // Feedback loop:
      // Breath pressure + noise -> reed table -> bore -> loss filter -> output
      //                     ^                                    |
      //                     |                                    |
      //                     +------------------------------------+
      
      // Breath and noise to reed input
      this.breathEnvelope.connect(this.reedTable.waveShaper);
      this.noiseGain.connect(this.reedTable.waveShaper);
      
      // Vibrato modulation
      this.vibratoOsc.connect(this.vibratoGain);
      this.vibratoGain.connect(this.breathEnvelope.gain);    
      
      this.reedTable.waveShaper.connect(this.delayLine);// Reed table to delay line (bore)     
      this.delayLine.connect(this.lossFilter);// Delay line to loss filter    
      this.lossFilter.connect(this.outputNode);// Loss filter to output  
      this.lossFilter.connect(this.reedTable.waveShaper);// Feedback: loss filter back to reed table
      this.setFrequency(this.frequency);// Set bore length based on current frequency
    }  
    // Create noise buffer for breath noise
    createNoiseBuffer() {
      const bufferSize = this.sampleRate;
      console.log(1, bufferSize, this.sampleRate);
      const noiseBuffer = this.context.createBuffer(1, bufferSize, this.sampleRate);
      const output = noiseBuffer.getChannelData(0);    
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1    
      this.noiseSource.buffer = noiseBuffer;
    }    
    connectTo(destination) { this.outputNode.connect(destination) }// Connect to destination
    
    // Set frequency (pitch)
    setFrequency(frequency) {
      this.frequency = frequency;    
      // Calculate delay length based on frequency
      // Delay length = (sampleRate / frequency) / 2 - halfFilterDelay
      // In the original STK, this accounts for fractional delay
      // We approximate with the Web Audio DelayNode
      const delayLength = (this.sampleRate / frequency) / 2 - 0.5;
      // Ensure delay length is positive and within limits
      const safeDelayLength = Math.max(0.1, Math.min(delayLength, 1.0))      
      // Set delay length
      this.delayLine.delayTime.setTargetAtTime(safeDelayLength / this.sampleRate, this.context.currentTime, 0.01)
    }
    
    // Start playing note
    noteOn(frequency, velocity) {      
      this.setFrequency(frequency)// Set frequency
      const breathPressure = velocity * 0.01// Scale velocity to appropriate breath pressure
      
      // Ramp up breath pressure
      this.breathEnvelope.gain.cancelScheduledValues(this.context.currentTime);
      this.breathEnvelope.gain.setValueAtTime(this.breathEnvelope.gain.value, this.context.currentTime);
      this.breathEnvelope.gain.linearRampToValueAtTime(breathPressure, this.context.currentTime + 0.1);
    }
    
    // Stop playing note
    noteOff(velocity) {
      // Ramp down breath pressure
      const releaseTime = 0.1;
      this.breathEnvelope.gain.cancelScheduledValues(this.context.currentTime);
      this.breathEnvelope.gain.setValueAtTime(this.breathEnvelope.gain.value, this.context.currentTime);
      this.breathEnvelope.gain.linearRampToValueAtTime(0.0, this.context.currentTime + releaseTime);
    }
    
    // Control change - similar to MIDI CC
    controlChange(number, value) {
      const normalizedValue = value / 128.0      
      switch (number) {
        case 1: // Vibrato gain (modulation wheel)
          this.vibratoGain.gain.setValueAtTime(normalizedValue * 0.2, this.context.currentTime);
          break;          
        case 2: // Reed stiffness
          this.reedTable.setSlope(-0.1 - (normalizedValue * 0.4));
          break;          
        case 4: // Breath noise gain
          this.noiseGain.gain.setValueAtTime(normalizedValue * 0.4, this.context.currentTime);
          break;          
        case 11: // Vibrato frequency
          this.vibratoOsc.frequency.setValueAtTime(normalizedValue * 12 + 0.5, this.context.currentTime);
          break;          
        case 128: // Breath pressure
          this.breathEnvelope.gain.cancelScheduledValues(this.context.currentTime);
          this.breathEnvelope.gain.setValueAtTime(this.breathEnvelope.gain.value, this.context.currentTime);
          this.breathEnvelope.gain.linearRampToValueAtTime(normalizedValue, this.context.currentTime + 0.05);
          break;
      }
    }
  }  