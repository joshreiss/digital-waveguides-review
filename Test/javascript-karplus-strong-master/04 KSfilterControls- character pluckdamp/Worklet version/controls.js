function getControlsValues() {
  pitchValue.value = pitchSlider.value;
  characterVariationValue.value = characterVariationSlider.value;
  var stringTension = stringTensionSlider.valueAsNumber;
  stringTensionValue.value = stringTensionSlider.value;
  var stringDamping = stringDampingSlider.valueAsNumber;
  stringDampingValue.value = stringDampingSlider.value;
  var stringDampingVariation = stringDampingVariationSlider.valueAsNumber;
  stringDampingVariationValue.value = stringDampingVariationSlider.value;
  var pluckDamping = pluckDampingSlider.valueAsNumber;
  pluckDampingValue.value = pluckDampingSlider.value;
  var pluckDampingVariation = pluckDampingVariationSlider.valueAsNumber;
  pluckDampingVariationValue.value = pluckDampingVariationSlider.value;
  return { stringTension: stringTension, stringDamping: stringDamping, stringDampingVariation: stringDampingVariation, 
    pluckDamping: pluckDamping, pluckDampingVariation: pluckDampingVariation };
}