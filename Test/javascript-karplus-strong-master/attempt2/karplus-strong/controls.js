function getControlsValues() {
    var stringTension = stringTensionSlider.valueAsNumber;
    var characterVariation = characterVariationSlider.valueAsNumber;
    var stringDamping = stringDampingSlider.valueAsNumber;
    var stringDampingVariation = stringDampingVariationSlider.valueAsNumber;
    var pluckDamping = pluckDampingSlider.valueAsNumber;
    var pluckDampingVariation = pluckDampingVariationSlider.valueAsNumber;
    var magicCalculationRadio = document.getElementById("magicCalculation");
    var directCalculationRadio = document.getElementById("directCalculation");
    var stringDampingCalculation;
    if (magicCalculationRadio.checked) stringDampingCalculation = "magic";
    else if (directCalculationRadio.checked) stringDampingCalculation = "direct";
    var noBodyRadio = document.getElementById("noBody");
    var simpleBodyRadio = document.getElementById("simpleBody");
    var body;
    if (noBodyRadio.checked) body = "none";
    else if (simpleBodyRadio.checked) body = "simple";
    return { stringTension: stringTension, characterVariation: characterVariation, stringDamping: stringDamping, 
        stringDampingVariation: stringDampingVariation, stringDampingCalculation: stringDampingCalculation, 
        pluckDamping: pluckDamping, pluckDampingVariation: pluckDampingVariation, body: body };
}
// calculate constant used for low-pass filter in the Karplus-Strong loop
function calculateSmoothingFactor(string, tab, options) {
    var smoothingFactor;
    if (options.stringDampingCalculation == "direct") smoothingFactor = options.stringDamping;
    else if (options.stringDampingCalculation == "magic") {
        // this is copied verbatim from the flash one. Its magical, don't know how it works
        var noteNumber = (string.semitoneIndex + tab - 19)/44;
        smoothingFactor = options.stringDamping + Math.pow(noteNumber, 0.5) * (1 - options.stringDamping) * 0.5 +
            (1 - options.stringDamping) * Math.random() * options.stringDampingVariation;
    }
    return smoothingFactor;
}
function toggleGuitarPlaying(buttonID, mode) {
    var startStopButton = document.getElementById(buttonID);
    var text = startStopButton.innerHTML;
    var playState = document.getElementById("playState");
    if (text == "Start") {
        startStopButton.innerHTML = "Stop";
        playState.value = "playing";
        guitar.setMode(mode);
        startGuitarPlaying();
    } else {
        startStopButton.innerHTML = "Start";
        playState.value = "stopped";
    }
}
function updateStringDamping() { stringDampingValue.value = stringDampingSlider.value; }
function updateStringDampingVariation() { stringDampingVariationValue.value = stringDampingVariationSlider.value; }
function updateStringTension() { stringTensionValue.value = stringTensionSlider.value }
function updateCharacterVariation() { characterVariationValue.value = characterVariationSlider.value; }
function updatePluckDamping() { pluckDampingValue.value = pluckDampingSlider.value; }
function updatePluckDampingVariation() { pluckDampingVariationValue.value = pluckDampingVariationSlider.value; }