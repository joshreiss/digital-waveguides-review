function GuitarString(octave, semitone) {
    this.basicHz = 16.35 * Math.pow(2, octave+semitone/12);// C0=16.35 is reference
    var basicPeriodSamples = Math.round(sampleRate/this.basicHz);    
    this.seedNoise = new Float32Array(basicPeriodSamples);
    for (var i = 0; i < basicPeriodSamples; i++) this.seedNoise[i] = 2*Math.random()-1;
    this.asmWrapper = new AsmFunctionsWrapper();
}
GuitarString.prototype.pluck = function(startTime, velocity, tab) {
    var buffer = context.createBuffer(2, sampleRate, sampleRate);// create 1 second buffer
    var options = getControlsValues();
    // 'tab' represents which fret held while plucking, each fret represents increase in pitch by a semitone (1/12th octave)
    var hz = this.basicHz * Math.pow(2, tab/12);    
    velocity /= 4;// to match original ActionScript source
    this.asmWrapper.pluck(buffer,this.seedNoise,sampleRate,hz,options.stringDamping,velocity,options);
    var bufferSource = new AudioBufferSourceNode(context,{buffer: buffer} );
    bufferSource.connect(context.destination)
    bufferSource.start(startTime);
}
function Guitar() {
    this.strings = [ // 'strings' becomes a property (an instance variable), arguments are octave, semitone
        new GuitarString(2, 4), new GuitarString(2, 9), new GuitarString(3, 2),
        new GuitarString(3, 7), new GuitarString(3, 11), new GuitarString(4, 4)]; 
}
// each fret represents increase in pitch by 1 semitone; logarithmically, 1/12th of octave, -1: don't pluck that string
Guitar.Cmajor = [-1,3,2,0,0,0],Guitar.Gmajor = [3,2,0,0,0,3],Guitar.Aminor = [0,0,2,2,0,0],Guitar.Eminor = [0,2,2,0,3,0];
Guitar.prototype.strumChord = function(time, velocity, chord) {
    for (var stringNumber = 0; stringNumber < 6; stringNumber++) {
        if (chord[stringNumber] != -1) this.strings[stringNumber].pluck(time, velocity, chord[stringNumber]);
        time += Math.random()/128;
    }
}