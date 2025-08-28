registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=2*Math.random()-1
    return true
  }
})
registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'pitch',defaultValue:130,minValue:0,maxValue:1000},
    {name:'smoothingFactor',defaultValue:0.5,minValue:0,maxValue:1},  
    {name:'stringTension',defaultValue:1,minValue:0.7,maxValue:1}]
  }
  constructor() {
    super()
    this.Buffer= new Array(48000).fill(0)
    this.ReadPtr=0,this.WritePtr=0
    this.lastOutput = 0
  }
  process(inputs, outputs, parameters) {
    let currentInput = 0;
    let delaySamples=Math.round(sampleRate/parameters.pitch[0]), //this is period samples in asm
        bufferSize=this.Buffer.length
    for (let i=0;i<outputs[0][0].length;++i) {
      currentInput = this.Buffer[this.ReadPtr]
      this.lastOutput = this.lastOutput * parameters.stringTension[0]
      this.lastOutput = lowPass(this.lastOutput, currentInput, parameters.smoothingFactor[0])
      outputs[0][0][i]= this.lastOutput+inputs[0][0][i]
      this.Buffer[this.WritePtr]=outputs[0][0][i]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    function lowPass(lastOutput, currentInput, smoothingFactor) {// simple discrete-time lowpass filter
      return (smoothingFactor * currentInput + (1.0 - smoothingFactor) * lastOutput)
    }
    return true
  }
})
registerProcessor('smoothing-filter', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'smoothingFactor',defaultValue:0.5,minValue:0}
  ]}
  constructor() {
    super()
    this.lastOut = 0
    this.j=0
  }
  process(inputs, outputs, parameters) {
    if (this.j<100) console.log(outputs[0].length)
      this.j++
    let smoothingFactor = parameters.smoothingFactor[0]
    for (let i=0;i<outputs[0].length;++i) {
      for (let j=0;j<outputs[0][i].length;++j) {
        outputs[0][i][j]= smoothingFactor * inputs[0][i][j] + (1.0-smoothingFactor) * this.lastOut
        this.lastOut=outputs[0][i][j]
      }
    }
    return true
  }
})
