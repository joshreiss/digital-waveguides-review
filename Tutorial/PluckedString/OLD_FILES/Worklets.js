registerProcessor('phasor-generator',class extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.test=0
  }
  static get parameterDescriptors() {
    return [ {name:"phase",defaultValue: 0,max: 1,min:0},{name:"frequency",defaultValue: 1000},
    {name:"sync",defaultValue: 0,min: 0},{name:"duty",defaultValue:1,max: 1,min:0.000001}];
  }
  process(inputs, outputs, params) {
    let input = inputs[0],output = outputs[0];
    let frequency = params.frequency;
    let duty = params.duty;
    if (this.test < 10){ 
      console.log(frequency.length,duty.length)
      console.log(frequency[0],duty[0])
      this.test = 20
    }
    for (let channel = 0; channel < output.length; ++channel) {
      let inputChannel = input[channel],outputChannel = output[channel];
      if (frequency.length === 1)
      {

        for (let i = 0; i < outputChannel.length; ++i) {
          if (this.phase > duty[0]) outputChannel[i]=0;
          else outputChannel[i]=this.phase * (1/duty[0]);
          this.phase += frequency[0] / sampleRate;
          this.phase = this.phase-Math.floor(this.phase);
        }
      }
      else
      {
        for (let i = 0; i < outputChannel.length; ++i) {
          if (this.phase > duty[i]) outputChannel[i]=0;
          else outputChannel[i]=this.phase * (1/duty[i]);
          this.phase += frequency[i] / sampleRate;
          this.phase = this.phase-Math.floor(this.phase);
        }
      }
    }
    return true;
  }
})