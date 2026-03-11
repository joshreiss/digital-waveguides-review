registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) { 
    for (let i=0;i<outputs[0][0].length;++i) outputs[0][0][i]=2*Math.random()-1
    return true
  }
})

registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { 
  }
  constructor() {
    super()
    this.x= new Array(3).fill(0)
    this.y= new Array(3).fill(0)
    this.Buffer= new Array(sampleRate).fill(0)
    this.ReadPtr=0,this.WritePtr=0
  }
  process(inputs, outputs, parameters) {
    let delaySamples=Math.round(240),
        bufferSize=this.Buffer.length,
        firstOrder =0,
        coef=this.lowPassCoefficients1(1200),
        coef2=this.lowPassCoefficients2(2000),
        input = inputs[0][0],output = outputs[0][0],
        filterOutput
    for (let n=0; n<output.length; ++n) { //over 128 samples
      if (firstOrder) {
      this.x[1]=this.x[0]
      this.y[1]=this.y[0]
      this.x[0]=this.Buffer[this.ReadPtr] //output of delay goes into filter
      //apply the difference equation
        this.y[0] = (coef.FF0*this.x[0] + coef.FF1*this.x[1] - coef.FB1*this.y[1]) / coef.FB0
      } else {
        // apply loop filter
        this.x[2]=this.x[1]
        this.y[2]=this.y[1]
        this.x[1]=this.x[0]
        this.y[1]=this.y[0]
        this.x[0]=this.Buffer[this.ReadPtr] //output of delay goes into filter
        //apply the difference equation
        this.y[0] = (coef2.FF0*this.x[0] + coef2.FF1*this.x[1] + coef2.FF2*this.x[2] - coef2.FB1*this.y[1] - coef2.FB2*this.y[2]) / coef2.FB0
      }
      let filterOutput=this.y[0] 

      output[n]= filterOutput

      ///this.Buffer[this.WritePtr]=output[n]
      this.Buffer[this.WritePtr]=0.9031*filterOutput+input[n]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
  lowPassCoefficients1(frequency) {
    let Omega_0= 2 * Math.PI * frequency / sampleRate
    var coefficients = {
      FF0: Math.tan(Omega_0/2),
      FF1: Math.tan(Omega_0/2),
      FB0: 1+Math.tan(Omega_0/2),
      FB1: -1+Math.tan(Omega_0/2)
    }
    return (coefficients) 
  }
  lowPassCoefficients2(frequency) {
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
