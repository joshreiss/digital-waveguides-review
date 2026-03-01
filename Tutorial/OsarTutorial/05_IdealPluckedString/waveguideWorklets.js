registerProcessor('waveguide-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'pitch',defaultValue:500,minValue:20,maxValue:10000},
    {name:'pick',defaultValue:0.1,minValue:0,maxValue:1},
    {name:'pickup',defaultValue:0.2,minValue:0,maxValue:1}]
  }
  constructor() {
    super()
    this.upperRail={},this.lowerRail={}
    var pitch= 100, i
    this.upperRail = new Array(sampleRate).fill(0), this.lowerRail = new Array(sampleRate).fill(0)
    this.upperPointer = 0, this.lowerPointer = 0
    //this.port.onmessage= () => {this.upperPointer = 0, this.lowerPointer = 0}
  }
  process(inputs, outputs, parameters) {
    let yPlus0,yMinusM    
    let railLength =Math.round(sampleRate/parameters.pitch[0]/2 + 1), 
        pickSample = Math.round(Math.max(railLength * parameters.pick[0], 1)), //Round pick position to nearest spatial sample. Pick position x = 0 not allowed
        pickupSample = Math.round(parameters.pickup[0] * railLength)
    for (let i=0;i<outputs[0][0].length;++i) {        
      this.lowerRail[pickSample] = inputs[0][0][i], this.upperRail[pickSample] = inputs[0][0][i] 
      outputs[0][0][i] = this.delayLineAccess(this.upperRail,this.upperPointer,pickupSample,railLength) + 
                         this.delayLineAccess(this.lowerRail,this.lowerPointer,pickupSample,railLength) //Output at pickup location
      yPlus0 = -0.99*(this.delayLineAccess(this.lowerRail,this.lowerPointer, 1,railLength)) // Reflection at yielding bridge
      yMinusM = -this.delayLineAccess(this.upperRail,this.upperPointer, railLength - 2,railLength) // Inverting reflection at rigid nut
      // upperDelayLineUpdate, Decrement pointer then update
      this.upperPointer--
      this.upperPointer = (this.upperPointer + railLength) % railLength
      this.upperRail[this.upperPointer] = yPlus0
      //lowerDelayLineUpdate, Update then increment pointer 
      this.lowerRail[this.lowerPointer] = yMinusM
      this.lowerPointer++
      this.lowerPointer = (this.lowerPointer + railLength) % railLength      
    }
    return true
  }
  delayLineAccess(delayLine, pointer, position, length) { //Return spatial sample at position. 0 points to most recently inserted sample
    let outputLocation = pointer + position
    outputLocation = (outputLocation + length) % length
    return delayLine[outputLocation]
  }
})
