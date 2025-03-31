initString(pitch, pick, pickup) { // pitch= 100, pick = 0.1, pickup = 0.2
    var i, railLength = sampleRate/pitch/2 + 1 // 48000/200 = 240
    let pickSample = Math.max(railLength * pick, 1)//Round pick position to nearest spatial sample. 0 not allowed
    upperRail.data = new Array(railLength), lowerRail.data = new Array(railLength)
    upperRail.pointer = 0, lowerRail.pointer = 0
    pickupSample = pickup * railLength } // 240 * 0.2 = 48 
lowerDelayLineUpdate(delayLine, inputSample) {
    delayLine.data[delayLine.pointer] = inputSample
    delayLine.pointer++
    delayLine.pointer = (delayLine.pointer + delayLine.length) % delayLine.length }
upperDelayLineUpdate(delayLine, inputSample) {
    delayLine.pointer--
    delayLine.pointer = (delayLine.pointer + delayLine.length) % delayLine.length
    delayLine.data[delayLine.pointer] = inputSample }
delayLineAccess(delayLine, position) { //Return spatial sample at position. 0 points to most recently inserted sample
    let outputLocation = delayLine.pointer + position
    outputLocation = (outputLocation + delayLine.length) % delayLine.length
    return outputLocation }
nextStringSample(pickupLocation) { // Call this with each input sample
    let yPlus0,yMinus0,yPlusM,yMinusM, outputSamp
    lowerRail.data[pickSample] = input[0][0][i], upperRail.data[pickSample] = 1 // Instead of 1 init, should be input samples
    outputSamp= delayLineAccess(upperRail,pickupLocation) + delayLineAccess(lowerRail,pickupLocation) //Output at pickup location
    yPlus0 = -0.5*(delayLineAccess(lowerRail, 1)) // Reflection at yielding bridge
    yMinusM = -delayLineAccess(upperRail, upperRail.length - 2) // Inverting reflection at rigid nut
    /* String state update */
    upperDelayLineUpdate(upperRail, yPlus0) // Decrement pointer then update 
    lowerDelayLineUpdate(lowerRail, yMinusM) // Update then increment pointer 
    return outputSamp }