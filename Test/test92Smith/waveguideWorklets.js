registerProcessor('waveguide-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.9,minValue:-1,maxValue:1},
    {name:'delayTime',defaultValue:10,minValue:0,maxValue:1000}]
  }
  constructor() {
    super()
    this.upperRail={},this.lowerRail={},
    this.yPlus0,this.yMinusM
    var pitch= 100, pick = 0.1, pickup = 0.2// pitch(Hz) pickPosition<1 pickupPosition<1  
    this.railLength = sampleRate/pitch/2 + 1 // 48000/200 = 240
    this.pickSample = Math.round(Math.max(railLength * pick, 1))//Round pick position to nearest spatial sample. Pick position x = 0 not allowed
    this.pickupSample = Math.round(pickup * railLength) // 240 * 0.2 = 48
    this.upperRail = new Array(sampleRate), this.lowerRail = new Array(sampleRate)
    for (i=0;i<railLength;++i) this.upperRail[i] = 0  
    for (i=0;i<railLength;++i) this.lowerRail[i] = 0  
    this.upperPointer = 0, this.lowerPointer = 0
    this.counter = 0
  }
  process(inputs, outputs, parameters) {
    for (let i=0;i<outputs[0][0].length;++i) {        
      this.lowerRail[this.pickSample] = inputs[0][0][i], this.upperRail[this.pickSample] = inputs[0][0][i] 
      outputs[0][0][i] = this.delayLineAccess(this.upperRail,this.upperPointer,this.pickupSample) + 
                         this.delayLineAccess(this.lowerRail,this.lowerPointer,this.pickupSample) //Output at pickup location
      this.yPlus0 = -0.995*(this.delayLineAccess(this.lowerRail,this.lowerPointer, 1)) // Reflection at yielding bridge
      this.yMinusM = -this.delayLineAccess(this.upperRail,this.upperPointer, this.railLength - 2) // Inverting reflection at rigid nut
      // upperDelayLineUpdate, Decrement pointer then update
      this.upperPointer--
      this.upperPointer = (this.upperPointer + this.railLength) % this.railLength
      this.upperRail[this.upperPointer] = this.yPlus0
      //lowerDelayLineUpdate, Update then increment pointer 
      this.lowerRail[this.lowerPointer] = this.yMinusM
      this.lowerPointer++
      this.lowerPointer = (this.lowerPointer + this.railLength) % this.railLength      
    }
    return true
  }
  delayLineAccess(delayLine, pointer, position) { //Return spatial sample at position. 0 points to most recently inserted sample
    let outputLocation = pointer + position
    outputLocation = (outputLocation + this.railLength) % this.railLength
    return delayLine[outputLocation]
  }
})
