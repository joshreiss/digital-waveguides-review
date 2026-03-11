registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) { 
    for (let i=0;i<outputs[0][0].length;++i) outputs[0][0][i]=2*Math.random()-1
    return true
  }
})

//look at GuitarAmidFish 02-06 for how filter implemented in loop
//assume single channel
registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.9,minValue:-1,maxValue:1},
    {name:'frequency',defaultValue:1000,minValue:0,maxValue:16000},
    {name:'delayTime',defaultValue:10,minValue:0,maxValue:1000}]
  }
  constructor() {
    super()
    this.x= new Array(2).fill(0)
    this.y= new Array(2).fill(0)
    this.Buffer= new Array(sampleRate).fill(0)
    this.ReadPtr=0,this.WritePtr=0
  }
  process(inputs, outputs, parameters) {
    let delaySamples=Math.round(sampleRate*parameters.delayTime[0]/1000),
        bufferSize=this.Buffer.length,
        coef=this.lowPassCoefficients(parameters.frequency[0]),
        input = inputs[0][0],output = outputs[0][0]
    for (let n=0; n<output.length; ++n) { //over 128 samples
      // apply loop filter
      this.x[1]=this.x[0]
      this.y[1]=this.y[0]
      this.x[0]=this.Buffer[this.ReadPtr]
      //apply the difference equation
      this.y[0] = (coef.FF0*this.x[0] + coef.FF1*this.x[1] - coef.FB1*this.y[1] ) / coef.FB0
      let filtered=this.y[0]

      output[n]= parameters.gain[0]*filtered+input[n]

      this.Buffer[this.WritePtr]=output[n]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
  lowPassFilter(coef,Sample) {
      this.x[1]=this.x[0]
      this.y[1]=this.y[0]
      this.x[0]=Sample
      //apply the difference equation
      this.y[0] = (coef.FF0*this.x[0] + coef.FF1*this.x[1] - coef.FB1*this.y[1]) / coef.FB0
      return(this.y[0])
  }
  lowPassCoefficients(frequency) {
    let Omega_0= 2 * Math.PI * frequency / sampleRate
    var coefficients = {
      FF0: Math.tan(Omega_0/2),
      FF1: Math.tan(Omega_0/2),
      FB0: 1+Math.tan(Omega_0/2),
      FB1: -1+Math.tan(Omega_0/2)
    }
    return (coefficients) 
  }
})
