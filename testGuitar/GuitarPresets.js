var presetObject = {};
presetObject["RTSFXguitar"] = {
    PickPosition: 0,
    PickDirection: 0.9,
    Decay: 4,
    Brightness: 1,
    DynamicLevel: 1,
};
presetObject["RTSFXoverdrive"] = {
    bypass: 0,
};
presetObject["RTSFXeq"] = {
    bypass: 0,
};
presetObject["RTSFXconvReverb"] = {
    bypass: 0,
};
presetObject["RTSFXdelay"] = {
    bypass: 0,
};
presetObject["RTSFXcompressor"] = {
    bypass: 0,
};
addPreset(presetObject, 'Muted Guitar');
var presetObject = {};
presetObject["RTSFXguitar"] = {
    PickPosition: 0,
    PickDirection: 0,
    Decay: 9,
    Brightness: 1,
    DynamicLevel: 0.8,
};
presetObject["RTSFXconvReverb"] = {
    bypass: 0,
};
presetObject["RTSFXdelay"] = {
    bypass: 0,
};
presetObject["RTSFXoverdrive"] = {
    bypass: 1,
    drive: 50,
    tone: 0.2,
    knee: 1,
    bias: 0.88,
    volume: -19.18,
};
presetObject["RTSFXcompressor"] = {
    bypass: 1,
    thres: -63.7,
    knee: 40,
    ratio: 20,
    reduction: 0,
    attack: 0,
    release: 1,
};
presetObject["RTSFXeq"] = {
    bypass: 1,
    Band1Gain: -12,
    Band1FilterType: 1,
    Band1Frequency: 100,
    Band3Gain: 3.9,
    Band3Frequency: 1000,
    Band4Gain: 8.5,
    Band4Frequency: 3300,
    Band5Gain: -8.9,
    Band5Frequency: 8200
};
addPreset(presetObject, 'Distorted Guitar');

var presetObject = {};
presetObject["RTSFXguitar"] = {
    PickPosition: 0.6,
    PickDirection: 0.07,
    Decay: 10,
    Brightness: 1,
    DynamicLevel: 1,
};
presetObject["RTSFXoverdrive"] = {
    bypass: 0,
};
presetObject["RTSFXconvReverb"] = {
    bypass: 0,
};
presetObject["RTSFXdelay"] = {
    bypass: 1,
    feedback: -3,
    delay: 295.85,
    wet: 1,
    dry: 0.12,
    cutoff: 1426,
    level: 1,
};
presetObject["RTSFXconvReverb"] = {
    bypass: 1,
    highCut: 11416,
    lowCut: 20,
    wet: 1,
    dry: 1,
    level: 1,
    type: 'Large Impulse Response',
};
presetObject["RTSFXcompressor"] = {
    bypass: 1,
    thres: -48.86,
    knee: 0,
    ratio: 20,
    reduction: 0,
    attack: 0,
    release: 1,
};
presetObject["RTSFXeq"] = {
    bypass: 0,
};
addPreset(presetObject, 'Ambient Texture');
var presetObject = {};
presetObject["RTSFXguitar"] = {
    PickPosition: 0.37,
    PickDirection: 0,
    Decay: 3.35,
    Brightness: 1,
    DynamicLevel: 1,
};
presetObject["RTSFXoverdrive"] = {
    bypass: 0,
};
presetObject["RTSFXdelay"] = {
    bypass: 0,
};
presetObject["RTSFXconvReverb"] = {
    bypass: 0,
};
presetObject["RTSFXcompressor"] = {
    bypass: 0,
};
presetObject["RTSFXeq"] = {
    bypass: 1,
    Band1Gain: -12,
    Band1FilterType: 1,
    Band1Frequency: 100,
    Band2Gain: 0.4,
    Band2Frequency: 424.5,
    Band3Gain: 1.3,
    Band3Frequency: 1000,
    Band4Gain: 0.5,
    Band4Frequency: 3300,
    Band5Gain: -12,
    Band5Frequency: 6486.8
};
addPreset(presetObject, 'Nylon Strings');
if (typeof scene == 'undefined') {
    addPresetOption(null, presets[0]);
    addPresetOption(null, presets[1]);
    addPresetOption(null, presets[2]);
    addPresetOption(null, presets[3]);
}