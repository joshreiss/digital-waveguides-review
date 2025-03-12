registerProcessor('noise-generator',class extends AudioWorkletProcessor {
  process(inputs, outputs) {
    for (let i=0;i<outputs[0][0].length;++i)  outputs[0][0][i]=2*Math.random()-1
    return true
  }
})

registerProcessor('feedbackFilterDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.9,minValue:-1,maxValue:1},
    {name:'frequency',defaultValue:1200,minValue:100,maxValue:10000},
    {name:'delayTime',defaultValue:10,minValue:0,maxValue:1000}]
  }
  constructor() {
    super()
    this.Buffer= new Array(48000).fill(0)
    this.ReadPtr=0,this.WritePtr=0
    this.lastOut = 0
    this.lastIn = 0
  }
  process(inputs, outputs, parameters) {
    let delaySamples=Math.round(sampleRate*parameters.delayTime[0]/1000),
        bufferSize=this.Buffer.length        
        //let omega_0= 2*MathPI*parameters.frequency[0]/sampleRate
        let omega_0= 2*Math.PI*10000/sampleRate
    let a,b,DelayedIn,FilteredIn
    a= [Math.tan(omega_0/2)+1,Math.tan(omega_0/2)-1],
    b= [Math.tan(omega_0/2),Math.tan(omega_0/2)]
    for (let i=0;i<outputs[0][0].length;++i) {
      //Delay it
      DelayedIn = this.Buffer[this.ReadPtr]
      //Now filter it
      FilteredIn = DelayedIn
      FilteredIn = (b[0]*DelayedIn + b[1]*this.lastIn -a[1]*this.lastOut)/a[0]
      // Apply gain and add to original
      outputs[0][0][i]= parameters.gain[0]*FilteredIn+inputs[0][0][i]
      //increment filter
      this.lastIn=DelayedIn
      this.lastOut=FilteredIn
      //increment delay line
      this.Buffer[this.WritePtr]=outputs[0][0][i]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
})