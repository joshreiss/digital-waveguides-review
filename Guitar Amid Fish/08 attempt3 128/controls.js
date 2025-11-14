function getControlsValues() {
  var stringTension = stringTensionSlider.valueAsNumber;
  var stringDamping = stringDampingSlider.valueAsNumber;
  var stringDampingVariation = stringDampingVariationSlider.valueAsNumber;
  var pluckDamping = pluckDampingSlider.valueAsNumber;
  var pluckDampingVariation = pluckDampingVariationSlider.valueAsNumber;
  return { stringTension: stringTension, stringDamping: stringDamping, stringDampingVariation: stringDampingVariation, 
    pluckDamping: pluckDamping, pluckDampingVariation: pluckDampingVariation };
}
// calculate constant used for lowpass filter in the Karplus-Strong loop
function calculateSmoothingFactor(string, tab, options) {
    var smoothingFactor;
    smoothingFactor = options.stringDamping;
    return smoothingFactor;
}
function toggleGuitarPlaying() {
    if (startStopButton.innerHTML == "Start") {
        startStopButton.innerHTML = "Stop";
        playState.value = "playing";
        startGuitarPlaying();
    } else {
        startStopButton.innerHTML = "Start";
        playState.value = "stopped";
    }
}
function updateStringDamping() { stringDampingValue.value = stringDampingSlider.value; }
function updateStringDampingVariation() { stringDampingVariationValue.value = stringDampingVariationSlider.value; }
function updateStringTension() { stringTensionValue.value = stringTensionSlider.value }
function updatePluckDamping() { pluckDampingValue.value = pluckDampingSlider.value; }
function updatePluckDampingVariation() { pluckDampingVariationValue.value = pluckDampingVariationSlider.value; }