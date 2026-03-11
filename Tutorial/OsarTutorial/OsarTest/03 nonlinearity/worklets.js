registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=2*Math.random()-1
    return true
  }
})

//assume single channel
registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.9,minValue:-1,maxValue:1},
    {name:'frequency',defaultValue:1000,minValue:0,maxValue:10000},
    {name:'delayTime',defaultValue:10,minValue:0,maxValue:1000}]
  }
  constructor() {
    super()
    this.x= new Array(3).fill(0)
    this.y= new Array(3).fill(0)
    this.Buffer= new Array(sampleRate).fill(0)
    this.ReadPtr=0,this.WritePtr=0
  }
  process(inputs, outputs, parameters) {
    let delaySamples=Math.round(sampleRate*parameters.delayTime[0]/1000),
        bufferSize=this.Buffer.length,
        coef=this.lowPassCoefficients(parameters.frequency[0],1.0),
        input = inputs[0][0],output = outputs[0][0]
    for (let n=0; n<output.length; ++n) { //over 128 samples
      // apply loop filter
      this.x[2]=this.x[1]
      this.y[2]=this.y[1]
      this.x[1]=this.x[0]
      this.y[1]=this.y[0]
      this.x[0]=this.Buffer[this.ReadPtr]
      //apply the difference equation
      this.y[0] = (coef.FF0*this.x[0] + coef.FF1*this.x[1] + coef.FF2*this.x[2]
        - coef.FB1*this.y[1] - coef.FB2*this.y[2] ) / coef.FB0
      let filterOutput=this.y[0] 
      output[n]= filterOutput
      
      this.Buffer[this.WritePtr]=Math.tanh(parameters.gain[0]*filterOutput)+input[n] // note nonlinearity

      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
  lowPassCoefficients(frequency) {
    let Omega_0= 2 * Math.PI * frequency / sampleRate,
        c= Math.cos(Omega_0/2)/Math.sin(Omega_0/2)
    var coefficients = {
      FF0: 1,
      FF1: 2,
      FF2: 1,
      FB0: c*c+c*Math.SQRT2+1,
      FB1: 2*(1-c*c),
      FB2: c*c-c*Math.SQRT2+1
    }
    return (coefficients) 
  }
})
