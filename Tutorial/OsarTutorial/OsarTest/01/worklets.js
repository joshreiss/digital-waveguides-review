registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=2*Math.random()-1
    return true
  }
})

registerProcessor('peakLimiter-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'attack',defaultValue:0,minValue:0,maxValue:1}, // time it takes to limit the signal when level exceeds a threshold, in seconds
    {name:'release',defaultValue:0.01,minValue:0,maxValue:1},// time it takes to stop limiting the signal when level drops below a threshold, in seconds
    {name:'threshold',defaultValue:-15,minValue:-100,maxValue:100}]
  }
  constructor() {
    super()
    this.level=0
  }
  process(inputs, outputs, parameters) {
    let beta_a = 1 - Math.exp( -1 / ( parameters.attack[0] * sampleRate ))
    let beta_r = 1 - Math.exp( -1 / ( parameters.release[0] * sampleRate ))
    for (let i=0;i<outputs[0][0].length;++i) {
      let x = Math.abs(inputs[0][0][i]) // convert input to decibel value of at least -100 dB

      if (x > this.level) this.level += beta_a * (x - this.level)
      else this.level += beta_r * (x - this.level)
      
      let gain = Math.pow(10,parameters.threshold[0]/20)/this.level
      if (Math.random()<0.0001) console.log(gain)
      let gain_db = 20 * Math.log10(gain)
      gain_db = Math.min(0, gain_db) // gain cannot be a positive db boost
      //if (Math.random()<0.0001) console.log(gain_db)
      outputs[0][0][i]= inputs[0][0][i] //* Math.pow(10,gain_db/20)
    }
    return true
  }
})

registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.9,minValue:-1,maxValue:1},
    {name:'delayTime',defaultValue:10,minValue:0,maxValue:1000}]
  }
  constructor() {
    super()
    this.Buffer= new Array(48000).fill(0)
    this.ReadPtr=0,this.WritePtr=0
  }
  process(inputs, outputs, parameters) {
    let delaySamples=Math.round(sampleRate*parameters.delayTime[0]/1000),
        bufferSize=this.Buffer.length
    for (let i=0;i<outputs[0][0].length;++i) {
      outputs[0][0][i]= this.Buffer[this.ReadPtr]
      this.Buffer[this.WritePtr]=parameters.gain[0]*this.Buffer[this.ReadPtr]+inputs[0][0][i] 
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
})
