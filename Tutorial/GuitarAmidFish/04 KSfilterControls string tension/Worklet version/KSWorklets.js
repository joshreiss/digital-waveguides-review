registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=2*Math.random()-1
    return true
  }
})
registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.96,minValue:-1,maxValue:1},
    {name:'pitch',defaultValue:130,minValue:0,maxValue:1000},
    {name:'smoothingFactor',defaultValue:0.5,minValue:0,maxValue:1}]
  }
  constructor() {
    super()
    this.Buffer= new Array(48000).fill(0)
    this.ReadPtr=0,this.WritePtr=0
    this.lastOutput = 0
    this.message = "start"
    console.log("start")
    this.port.onmessage = (event) => {
      this.message = event.data
      console.log(event.data)
    }
  }
  process(inputs, outputs, parameters) {
    let currentInput = 0;
    let delaySamples=Math.round(sampleRate/parameters.pitch[0]), //this is period samples in asm
        bufferSize=this.Buffer.length
    for (let i=0;i<outputs[0][0].length;++i) {
      currentInput = this.Buffer[this.ReadPtr]
      if (this.message == 'stop') this.lastOutput = lowPass(this.lastOutput, currentInput, 0.1)
      else this.lastOutput = lowPass(this.lastOutput, currentInput, parameters.smoothingFactor[0])
      //if (this.ReadPtr >bufferSize*.61) this.lastOutput=0 //first attempt string tension
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
