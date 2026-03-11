registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=2*Math.random()-1
    return true
  }
})

registerProcessor('lowpass-webaudio-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'frequency',defaultValue:1000,minValue:0,maxValue:10000},
    {name:'Q',defaultValue:1,minValue:-100,maxValue:1000}]
  }
  constructor() {
    super()
    // Assumes maximum of 8 channels, so [8][2] arrays for inputs x and outputs y
    // Initialises two values (current and two previous) for each array
    this.x = Array(8).fill().map(() => Array(3).fill(0))
    this.y = Array(8).fill().map(() => Array(3).fill(0))
  }
  process(inputs, outputs, parameters) {
    let coef=this.lowPassCoefficients(parameters.frequency[0],parameters.Q[0])
    const input=inputs[0],output=outputs[0]// output[channel][sample],input[channel][sample]
    let nChannels=input.length
    for (let c=0; c<nChannels; ++c) {
      const inputChannel = input[c],outputChannel = output[c]
      for (let n=0; n<outputChannel.length; ++n) { //over 128 samples
        // Now update the values
        this.x[c][2]=this.x[c][1]
        this.y[c][2]=this.y[c][1]
        this.x[c][1]=this.x[c][0]
        this.y[c][1]=this.y[c][0]
        this.x[c][0]=inputChannel[n]
        //apply the difference equation
        this.y[c][0] = (coef.FF0*this.x[c][0] + coef.FF1*this.x[c][1] + coef.FF2*this.x[c][2]
           - coef.FB1*this.y[c][1] - coef.FB2*this.y[c][2] ) / coef.FB0
        //set output
        outputChannel[n]= this.y[c][0]
      }
    }
    return true
  }
  lowPassCoefficients(frequency, Q) {
    // From Web Audio specification
    let Omega_0= 2 * Math.PI * frequency / sampleRate
    let Qlin=Math.pow(10,Q/20)
    let Alpha_Q= Math.sin(Omega_0)/(2*Qlin)
    var coefficients = {
      FF0:  (1-Math.cos(Omega_0))/2,
      FF1: 1-Math.cos(Omega_0),
      FF2:  (1-Math.cos(Omega_0))/2,
      FB0:  1+Alpha_Q,
      FB1:  -2*Math.cos(Omega_0),
      FB2:  1-Alpha_Q
    }
    return (coefficients)
  }
})
