registerProcessor('white-noise-generator',class extends AudioWorkletProcessor {
  constructor() { super(); }
  process(inputs, outputs) {
    let output = outputs[0];
    for (let channel=0;channel<output.length;++channel) {
      let outputChannel = output[channel];
      for (let i=0;i<outputChannel.length;++i)  outputChannel[i]=2*Math.random()-1;
    }
    return true;
  }
});

registerProcessor('phasor-generator',class extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
  }
  static get parameterDescriptors() {
    return [ {name:"phase",defaultValue: 0,max: 1,min:0},{name:"frequency",defaultValue: 1000},
    {name:"sync",defaultValue: 0,min: 0},{name:"duty",defaultValue:1,max: 1,min:0.000001}];
  }
  process(inputs, outputs, params) {
    let input = inputs[0],output = outputs[0];
    let frequency = params.frequency;
    let duty = params.duty;
    for (let channel = 0; channel < output.length; ++channel) {
      let inputChannel = input[channel],outputChannel = output[channel];
      if (frequency.length === 1)
      {

        for (let i = 0; i < outputChannel.length; ++i) {
          if (this.phase > duty) outputChannel[i]=0;
          else outputChannel[i]=this.phase * (1/duty);
          this.phase += frequency[0] / sampleRate;
          this.phase = this.phase-Math.floor(this.phase);
            // console.log("freq.length === 1 this.phase: ", this.phase);
        }
      }
      else
      {
        for (let i = 0; i < outputChannel.length; ++i) {
          if (this.phase > duty) outputChannel[i]=0;
          else outputChannel[i]=this.phase * (1/duty);
          this.phase += frequency[i] / sampleRate;
          this.phase = this.phase-Math.floor(this.phase);
        }
      }
    //   console.log("phase: ", this.phase);
    }
    return true;
  }
});

// One pole IIR low pass filter with approximate cutoff frequency
registerProcessor('single-pole-lpf', class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{
            name: 'frequency',
            defaultValue: 100,
            minValue: 0
        }];
    }
    constructor() {
        super();
        this.lastOut =  new Array(2);
        this.lastOut.fill(0);
        this.coeff;
        this.updateCoefficientsWithFrequency_(100);
    }
    updateCoefficientsWithFrequency_(frequency) {
        // loose approximation of the actual coefficient
        this.coeff = 2 * Math.PI * frequency / sampleRate;
        if (this.coeff > 1.0) this.coeff = 1.0;
        else if (this.coeff < 0) this.coeff = 0;
    }
    process(inputs, outputs, parameters) {
        let input = inputs[0],
            output = outputs[0];
        let frequency = parameters.frequency[0];
        for (let channel = 0; channel < input.length; ++channel) {
            let inputChannel = input[channel],
                outputChannel = output[channel];
            if (frequency.length === 1) {
                this.updateCoefficientsWithFrequency_(frequency);
                for (let i = 0; i < outputChannel.length; ++i) {
                    outputChannel[i] = inputChannel[i] * this.coeff + (1 - this.coeff) * this.lastOut[channel];
                    this.lastOut[channel] = outputChannel[i];
                }
            } else {
                for (let i = 0; i < outputChannel.length; ++i) {
                    this.updateCoefficientsWithFrequency_(frequency);
                    outputChannel[i] = inputChannel[i] * this.coeff + (1 - this.coeff) * this.lastOut[channel];
                    this.lastOut[channel] = outputChannel[i];
                }
            }
        }
        return true;
    }
});