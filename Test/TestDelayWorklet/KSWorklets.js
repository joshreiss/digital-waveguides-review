registerProcessor('const-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=1
    return true
  }
})

registerProcessor('myDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
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
      this.Buffer[this.WritePtr]=inputs[0][0][i]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
})