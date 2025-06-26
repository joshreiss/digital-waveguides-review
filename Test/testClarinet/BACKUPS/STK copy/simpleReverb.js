// Simple reverb implementation (similar to JCRev)
class SimpleReverb {
    constructor(audioContext) {
      this.context = audioContext      
      // Create nodes
      this.input = this.context.createGain();
      this.output = this.context.createGain();
      this.wetGain = this.context.createGain();
      this.dryGain = this.context.createGain();      
      // Connect dry path
      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);
      
      // Create parallel comb filters
      this.combDelays = [];
      const combTimes = [25.31, 26.94, 28.96, 30.75]; // in milliseconds
      
      for (let i = 0; i < combTimes.length; i++) {
        const delay = this.context.createDelay(1.0);
        const feedback = this.context.createGain();        
        delay.delayTime.value = combTimes[i] / 1000;
        feedback.gain.value = 0.8;
        
        this.input.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(this.wetGain);
        
        this.combDelays.push(delay);
      }
      
      // Create allpass filters in series
      this.allpassDelays = [];
      const allpassTimes = [5.0, 1.68]; // in milliseconds
      
      let lastNode = this.wetGain;
      
      for (let i = 0; i < allpassTimes.length; i++) {
        const delay = this.context.createDelay(0.1);
        const gain = this.context.createGain();
        const gainInv = this.context.createGain();
        const mixer = this.context.createGain();
        
        delay.delayTime.value = allpassTimes[i] / 1000;
        gain.gain.value = 0.7;
        gainInv.gain.value = -0.7;
        
        lastNode.connect(delay);
        lastNode.connect(gainInv);
        delay.connect(gain);
        gain.connect(mixer);
        gainInv.connect(mixer);        
        lastNode = mixer;
      }      
      // Connect the last allpass to the output
      lastNode.connect(this.wetGain);
      this.wetGain.connect(this.output);      
      this.setMix(0.2);// Set default mix
    }
       
    connect(destination) { this.output.connect(destination) }// Connect output
    
    setMix(mix) {
      mix = Math.max(0, Math.min(mix, 1))// Ensure mix is between 0 and 1
      this.wetGain.gain.value = mix;
      this.dryGain.gain.value = 1 - mix;
    }
  }
  