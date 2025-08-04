// Derived experimentally to match Andre Michelle's, I've no idea how it works out as this...
// it doesn't seem to appear in the ActionScript code anywhere...
var timeUnit = 0.12;
// Create sound samples for current part of strum sequence, queue generation of sound samples of following part.
// Rhythm parts have as fine a granularity as possible to enable adjustment of guitar parameters with real-time feedback.
// (higher strumGenerationsPerRun, longer delay between parameter adjustments & samples created with new parameters.
function queueStrums(sequenceN, blockStartTime, chordIndex, precacheTime) {
    var chords = [ Guitar.C_MAJOR, Guitar.G_MAJOR, Guitar.A_MINOR, Guitar.E_MINOR ];
    var playState = document.getElementById("playState").value;
    if (playState == "stopped") return;
    var curStrumStartTime;
    var chord = chords[chordIndex];
    switch(sequenceN % 13) {
        case 0:
            curStrumStartTime = blockStartTime + timeUnit * 0;
            guitar.strumChord(curStrumStartTime,  true,  1.0, chord);
            break;
        case 1:
            curStrumStartTime = blockStartTime + timeUnit * 4;
            guitar.strumChord(curStrumStartTime,  true,  1.0, chord);
            break;
        case 2:
            curStrumStartTime = blockStartTime + timeUnit * 6;
            guitar.strumChord(curStrumStartTime,  false, 0.8, chord);
            break;
        case 3:
            curStrumStartTime = blockStartTime + timeUnit * 10;
            guitar.strumChord(curStrumStartTime, false, 0.8, chord);
            break;
        case 4:
            curStrumStartTime = blockStartTime + timeUnit * 12;
            guitar.strumChord(curStrumStartTime, true,  1.0, chord);
            break;
        case 5:
            curStrumStartTime = blockStartTime + timeUnit * 14;
            guitar.strumChord(curStrumStartTime, false, 0.8, chord);
            break;
        case 6:
            curStrumStartTime = blockStartTime + timeUnit * 16;
            guitar.strumChord(curStrumStartTime, true,  1.0, chord);
            break;
        case 7:
            curStrumStartTime = blockStartTime + timeUnit * 20;
            guitar.strumChord(curStrumStartTime, true,  1.0, chord);
            break;
        case 8:
            curStrumStartTime = blockStartTime + timeUnit * 22;
            guitar.strumChord(curStrumStartTime, false, 0.8, chord);
            break;
        case 9:
            curStrumStartTime = blockStartTime + timeUnit * 26;
            guitar.strumChord(curStrumStartTime, false, 0.8, chord);
            break;
        case 10:
            curStrumStartTime = blockStartTime + timeUnit * 28;
            guitar.strumChord(curStrumStartTime, true,  1.0, chord);
            break;
        case 11:
            curStrumStartTime = blockStartTime + timeUnit * 30;
            guitar.strumChord(curStrumStartTime, false, 0.8, chord);
            break;
        case 12:
            curStrumStartTime = blockStartTime + timeUnit * 31;
            guitar.strings[2].pluck(curStrumStartTime,   0.7, chord[2]);
            curStrumStartTime = blockStartTime + timeUnit * 31.5;
            guitar.strings[1].pluck(curStrumStartTime, 0.7, chord[1]);
            chordIndex = (chordIndex + 1) % 4;
            blockStartTime += timeUnit*32;
            break;
    }
    sequenceN++;
    // if we're only generating next strum 200 ms ahead of current time, we might be falling behind, so increase precache time
    if (curStrumStartTime - audioCtx.currentTime < 0.2) precacheTime += 0.1;
    document.getElementById("precacheTime").innerHTML = precacheTime.toFixed(1) + " seconds";
    // we try to maintain constant time between when strum has finished generated and when it actually plays
    // next strum will be played at curStrumStartTime; so start generating one after next strum at precacheTime before
    var generateIn = curStrumStartTime - audioCtx.currentTime - precacheTime;
    if (generateIn < 0) generateIn = 0;
    nextGenerationCall = function() { queueStrums(sequenceN, blockStartTime, chordIndex, precacheTime); };
    setTimeout(nextGenerationCall, generateIn * 1000);
}
function startGuitarPlaying() {
    var startSequenceN = 0;
    var blockStartTime = audioCtx.currentTime;
    var startChordIndex = 0;
    var precacheTime = 0.0;
    queueStrums(startSequenceN, blockStartTime, startChordIndex, precacheTime);
}
