registerProcessor('feedbackDelay-processor', class extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [
    {name:'gain',defaultValue:0.9,minValue:-1,maxValue:1},
    {name:'delayTime',defaultValue:10,minValue:0,maxValue:1000}]
  }
  constructor() {
    super()
    this.Buffer= new Array(sampleRate).fill(0) //one second
    this.ReadPtr=0,this.WritePtr=0  

    var upperRail,lowerRail, amp= 0.5, pitch= 100, pick = 0.1, pickup = 0.2// amp<1 pitch(Hz) pickPosition<1 pickupPosition<1  
    var pickupSample = initString(amp, pitch, pick, pickup)
  }
  process(inputs, outputs, parameters) {
    let delaySamples=Math.round(sampleRate*parameters.delayTime[0]/1000),
        bufferSize=this.Buffer.length
    for (let i=0;i<outputs[0][0].length;++i) {
      outputs[0][0][i]= parameters.gain[0]*this.Buffer[this.ReadPtr]+inputs[0][0][i]
      // outputSound[0][0][i] = nextStringSample(pickupSample)
      this.Buffer[this.WritePtr]=outputs[0][0][i]
      this.WritePtr++
      if (this.WritePtr>=bufferSize) this.WritePtr=this.WritePtr-bufferSize
      this.ReadPtr=this.WritePtr-delaySamples
      if (this.ReadPtr<0) this.ReadPtr=this.ReadPtr+bufferSize
    }
    return true
  }
  initString(amplitude, pitch, pick, pickup) {
    var i, railLength = sampleRate/pitch/2 + 1 // 48000/200 = 240
    let pickSample = Math.max(railLength * pick, 1)//Round pick position to nearest spatial sample. Pick position x = 0 not allowed
    let initialShape = []//length railLength
    upperRail = initDelayLine(railLength), lowerRail = initDelayLine(railLength)
  // Init conditions for plucked string. Past history measured backward from end of array
    lowerRail.data[pickSample] = 1
    upperRail.data[pickSample] = 1
    return pickup * railLength // 240 * 0.2 = 48
  }
  initDelayLine(length) { 
    delayLine.data = new Array(length)
    delayLine.pointer = 0
    return delayLine
  }
//Place nut-reflected sample from upper delayline into lower delayline pointer location (represents x = 0 position). 
//Pointer incremented (wave travels sample to left), turning previous position into effective x=L position for next iteration
  lowerDelayLineUpdate(delayLine, inputSample) {
    delayLine.data[delayLine.pointer] = inputSample
    delayLine.pointer++
    delayLine.pointer = (delayLine.pointer + delayLine.length) % delayLine.length
  }
//Decrement upper delayline pointer position (wave travels sample to right), moving it to effective x=0 position for next iteration. bridge-reflected sample from lower delay-line then placed into this position
  upperDelayLineUpdate(delayLine, inputSample) {
    delayLine.pointer--
    delayLine.pointer = (delayLine.pointer + delayLine.length) % delayLine.length
    delayLine.data[delayLine.pointer] = inputSample
  }
//Return spatial sample at position. x=0 points to most recently inserted sample, ie current delayline pointer position. Upper right-going delay-line: position increases to right, delay increases to right, left = past, right = future. Lower left-going delay-line: position increases to right, delay decreases to right, left = future, right = past
  delayLineAccess(delayLine, position) {
    let outputLocation = delayLine.pointer + position
    outputLocation = (outputLocation + delayLine.length) % delayLine.length
    return outputLocation
  }
  bridgeReflection(inputSample) { //One-pole lowpass with feedback coefficient = 0.5
    let state = 0 // filter memory
    outputSamp = 0.5 * state + 0.5 * inputSample
    state = outputSamp
    return outputSamp
  }
  nextStringSample(pickupLocation) {
    let yPlus0,yMinus0,yPlusM,yMinusM, outputSamp
    outputSamp= delayLineAccess(upperRail,pickupLocation) + delayLineAccess(lowerRail,pickupLocation) //Output at pickup location
    yPlus0 = -bridgeReflection(delayLineAccess(lowerRail, 1)) // Reflection at yielding bridge
    yMinusM = -delayLineAccess(upperRail, upperRail.length - 2) // Inverting reflection at rigid nut
    /* String state update */
    upperDelayLineUpdate(upperRail, yPlus0) // Decrement pointer then update 
    lowerDelayLineUpdate(lowerRail, yMinusM) // Update then increment pointer 
    return outputSamp
  }
})
