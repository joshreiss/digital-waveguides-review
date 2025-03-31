function initDelayLine(length) { 
  dl.data = new Array(length)
  dl.pointer = 0
  return dl
}

//Place nut-reflected sample from upper delayline into lower delay-line pointer location (represents x = 0 position). 
//Pointer incremented (wave travels sample to left), turning previous position into effective x=L position for next iteration
function lowerDelayLineUpdate(dl, inputSample) {
  dl.data[dl.pointer] = inputSample
  dl.pointer++
  if (ptr >= dl.length) dl.pointer -= dl.length
}

//Decrement upper delayline pointer position (wave travels sample to right), moving it to effective x=0 position for next iteration. bridge-reflected sample from lower delay-line then placed into this position
function upperDelayLineUpdate(dl, inputSample) {
  dl.pointer--
  if (dl.pointer < 0) dl.pointer+= dl.length
  dl.data[dl.pointer] = inputSample
}

//Return spatial sample at position. x=0 points to most recently inserted sample, i.e. current delayline pointer position. Upper right-going delay-line: position increases to right, delay increases to right, left = past, right = future. Lower left-going delay-line: position increases to right, delay decreases to right, left = future, right = past
function delayLineAccess(dl, position) {
  let outputLocation = dl.pointer + position
  while (outputLocation < dl.data) outputLocation += dl.length
  while (outputLocation >= dl.length) outputLocation -= dl.length
  return outputLocation
}

function initString(amplitude, pitch, pick, pickup) {
  var i, railLength = sampleRate/pitch/2 + 1
  let pickSample = Math.max(railLength * pick, 1)//Round pick position to nearest spatial sample. Pick position x = 0 not allowed
  let initialShape = []//length railLength
  upperRail = initDelayLine(railLength), lowerRail = initDelayLine(railLength)
  initialShape[pickSample] = 1
// Init conditions for plucked string. Past history measured backward from end of array
  for (i=0;i<dl.length;i++) lowerRail.data[i] = initialShape[i]
  for (i=0;i<dl.length;i++) upperRail.data[i] = initialShape[i]
  return pickup * railLength
}

function bridgeReflection(inputSample) { //One-pole lowpass with feedback coefficient = 0.5
  let state = 0 // filter memory
  outputSamp = 0.5 * state + 0.5 * inputSample
  state = outputSamp
  return outputSamp
}

function nextStringSample(pickupLocation) {
  let yPlus0,yMinus0,yPlusM,yMinusM, outputSamp
  outputSamp= delayLineAccess(upperRail,pickupLocation) + delayLineAccess(lowerRail,pickupLocation) //Output at pickup location
  yPlus0 = -bridgeReflection(delayLineAccess(lowerRail, 1)) // Reflection at yielding bridge
  yMinusM = -delayLineAccess(upperRail, upperRail.length - 2) // Inverting reflection at rigid nut
  /* String state update */
  upperDelayLineUpdate(upperRail, yPlus0) // Decrement pointer then update 
  lowerDelayLineUpdate(lowerRail, yMinusM) // Update then increment pointer 
  return outputSamp
}

let upperRail,lowerRail, let amp = 0.5, duration = 1, pitch = 100, pick = 0.1, pickup = 0.2
// amp(<1.0) pitch(Hz) pickPosition(<1.0) pickupPosition(<1.0) duration(sec) 
let pickupSample = initString(amp, pitch, pick, pickup)
for (i=0;i<duration*sampleRate;i++) outputSound[i] = nextStringSample(pickupSample)
