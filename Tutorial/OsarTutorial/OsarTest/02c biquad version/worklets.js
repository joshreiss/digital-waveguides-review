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
        coef=this.lowPassCoefficients(12000,0.0),
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
      let filtered=this.y[0]
      //filtered=this.x[0]

      output[n]= 0.881*filtered+input[n]
      
      this.Buffer[this.WritePtr]=output[n]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
  lowPassFilter(coef,Sample) {
      this.x[2]=this.x[1]
      this.y[2]=this.y[1]
      this.x[1]=this.x[0]
      this.y[1]=this.y[0]
      this.x[0]=Sample
      //apply the difference equation
      this.y[0] = (coef.FF0*this.x[0] + coef.FF1*this.x[1] + coef.FF2*this.x[2]
        - coef.FB1*this.y[1] - coef.FB2*this.y[2] ) / coef.FB0
      return(this.y[0])
      //return((this.x[2]+this.x[1]+this.x[0])/3)
  }
  lowPassCoefficients(frequency, Q) {
    // From Web Audio specification
    let Omega_0= 2 * Math.PI * frequency / sampleRate
    let Qlin=Math.pow(10,Q/20)
    Qlin=1
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
