var context = new AudioContext
//Create parameters
let i,maxVoices = 7
const ringbuffer = new Array(maxVoices)
const noiseInput = new Array(maxVoices)
const envelop = new Array(maxVoices)
const envelopGain = new Array(maxVoices)
const dynamicLevelFilter = new Array(maxVoices)
let currentNote = 0
let buffersize = 110
let freq = 440.0//, note = 69
let phaseDelay = 0
let fractionalDelay = 0
let state = false //State of the button
let lowNote = 48,highNote = 65,octave=0
context.audioWorklet.addModule('Worklets.js').then(() => {
   for(i=0;i<maxVoices;i++) {
    noiseInput[i] = new AudioWorkletNode(context,'white-noise-generator')
    ringbuffer[i]  = new AudioWorkletNode(context,'ks-ring-buffer',{parameterData:{pitch_:440,buffersize_:110,pickdirection_:0,pickposition_:0,decay_:2.5,brightness_:0.1,fractionalDelay_:0.5, feedback_:0}})
    envelopGain[i] = new GainNode(context,{gain:0})
    //envelop[i] = new linASREnvelop(envelopGain[i],envelopGain[i].gain,0,0.04,0.01,1,1,1,0)
    noiseInput[i].connect(envelopGain[i])
    envelopGain[i].connect(ringbuffer[i])
    ringbuffer[i].connect(context.destination)
  }
  //Binding Parameters to audio worklet parameters
  pickPosition.oninput = () => { for(i=0;i<maxVoices;i++) ringbuffer[i].parameters.get('pickposition_').value = pickPositionParameter.value }
  pickDirection.oninput = () => { for(i=0;i<maxVoices;i++) ringbuffer[i].parameters.get('pickdirection_').value= pickDirectionParameter.value }
  decay.oninput = () => { for(i=0;i<maxVoices;i++) ringbuffer[i].parameters.get('decay_').value= decayParameter.value }
  dynamicLevel.oninput = () => { for(i=0;i<maxVoices;i++) ringbuffer[i].parameters.get('level_').value= dynamicLevelParameter.value }
  brightness.oninput = () => { for(i=0;i<maxVoices;i++) ringbuffer[i].parameters.get('brightness_').value= brightnessParameter.value }
  feedback.oninput = () => { for(i=0;i<maxVoices;i++) ringbuffer[i].parameters.get('feedback_').value= feedBackParameter.value }
  //calculate the phase delay and required BufferSize
  function calcPhaseDelay()
  {
    let w = 2*Math.PI*freq/ context.sampleRate//omega
    let dampDelay = (brightnessParameter.value* Math.sin(w*decayParameter.value))/((w*decayParameter.value)*(1-brightnessParameter.value)+brightnessParameter.value*(w*decayParameter.value)*Math.cos(w*decayParameter.value))
    phaseDelay = dampDelay + 0.5
    fractionalDelay = (context.sampleRate /freq) - Math.floor((context.sampleRate /freq) - phaseDelay) + phaseDelay
    buffersize = (Math.floor((context.sampleRate /freq)) - phaseDelay)
  }
  //NoteOn and NoteOff functions
  function NoteOn()
  {
    currentNote = (currentNote+1)%maxVoices
    let now = context.currentTime
    envelop[currentNote].trigger(now)
    calcPhaseDelay()
    ringbuffer[currentNote].parameters.get('buffersize_').value = buffersize
    ringbuffer[currentNote].parameters.get('pitch_').value = freq
  }
  function NoteOff() { if(currentNote != 0) currentNote = ((currentNote-1)%maxVoices) }
  //send note on message and note frequency to audio worklet, 440Hz is midi 69, A4, between the second and third of 3 black keys ('h'), 4th octave
  // 4th octave begins at 60, 3rd at 48, 2nd at 36, 1st at 24
  const keyMapper = { a: 0,w: 1,s: 2,e: 3,d: 4,f: 5,t: 6,g: 7,y: 8,h: 9,u: 10,j: 11,k: 12,o: 13,l: 14,p: 15 }
  let state = new Array(16).fill(false)
  octave = 4
  document.addEventListener('keydown', (event) => {
    console.log(event.keya,event.key.charCodeAt(0),event.code.charCodeAt(3))
    const keyIndex = keyMapper[event.key]
    if (keyIndex !== undefined && state[keyIndex]==false) {
      freq = 440 * Math.pow (2, (keyIndex+12*(octave+1) - 69) / 12)
      NoteOn()
      state[keyIndex]=true
    } 
    if (event.key === ',' && octave>1) octave--
    if (event.key === '.' && octave<7) octave++
  })//change the octave
  document.addEventListener('keyup', (event) => {
    const keyIndex = keyMapper[event.key]
    if (keyIndex !== undefined && state[keyIndex]==true) {
      freq = 440 * Math.pow (2, (keyIndex+12*(octave+1) - 69) / 12)
      NoteOff()
      state[keyIndex]=false
    } 
  })
})
