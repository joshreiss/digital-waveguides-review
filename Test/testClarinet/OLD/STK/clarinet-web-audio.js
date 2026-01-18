// Demo page setup
window.addEventListener('load', () => {
  // Create UI elements
  const startButton = document.createElement('button');
  startButton.textContent = 'Start Clarinet';
  document.body.appendChild(startButton);
  
  const keyboardDiv = document.createElement('div');
  keyboardDiv.style.display = 'flex';
  keyboardDiv.style.margin = '20px';
  document.body.appendChild(keyboardDiv);
  
  // Create control sliders
  const controlsDiv = document.createElement('div');
  controlsDiv.style.margin = '20px';
  document.body.appendChild(controlsDiv);
  
  const createSlider = (name, min, max, value, ccNumber) => {
    const div = document.createElement('div');
    div.style.margin = '10px 0';
    
    const label = document.createElement('label');
    label.textContent = name;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.style.width = '200px';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = value;
    valueDisplay.style.marginLeft = '10px';
    
    div.appendChild(label);
    div.appendChild(slider);
    div.appendChild(valueDisplay);
    controlsDiv.appendChild(div);
    
    return {slider, valueDisplay};
  };
  
  // Create piano keyboard
  const notes = [
    {name: 'C4', freq: 261.63, key: 'a'},
    {name: 'D4', freq: 293.66, key: 's'},
    {name: 'E4', freq: 329.63, key: 'd'},
    {name: 'F4', freq: 349.23, key: 'f'},
    {name: 'G4', freq: 392.00, key: 'g'},
    {name: 'A4', freq: 440.00, key: 'h'},
    {name: 'B4', freq: 493.88, key: 'j'},
    {name: 'C5', freq: 523.25, key: 'k'}
  ];
  
  // Initialize audio on button click (to handle autoplay restrictions)
  let clarinet, audioContext;  
  startButton.addEventListener('click', async () => {
    audioContext = new AudioContext    
    clarinet = new Clarinet(audioContext)       // Create clarinet
    clarinet.connectTo(audioContext.destination)// Connect clarinet to output  
    // Create keyboard
    notes.forEach(note => {
      const key = document.createElement('div');
      key.textContent = `${note.name}\n(${note.key})`;
      key.style.width = '60px';
      key.style.height = '120px';
      key.style.backgroundColor = note.name.includes('#') ? 'black' : 'white';
      key.style.color = note.name.includes('#') ? 'white' : 'black';
      key.style.border = '1px solid black';
      key.style.textAlign = 'center';
      key.style.lineHeight = '180px';
      key.style.userSelect = 'none';
      key.style.cursor = 'pointer';      
      // Mouse events
      key.addEventListener('mousedown', () => {
        clarinet.noteOn(note.freq, 100);
        key.style.backgroundColor = note.name.includes('#') ? '#333' : '#ddd';
      });      
      key.addEventListener('mouseup', () => {
        clarinet.noteOff(64);
        key.style.backgroundColor = note.name.includes('#') ? 'black' : 'white';
      });      
      key.addEventListener('mouseleave', () => {
        clarinet.noteOff(64);
        key.style.backgroundColor = note.name.includes('#') ? 'black' : 'white';
      });      
      keyboardDiv.appendChild(key);
    });    
    // Create control sliders
    const controls = [
      {name: 'Reed Stiffness', min: 0, max: 127, value: 64, cc: 2},
      {name: 'Breath Noise', min: 0, max: 127, value: 25, cc: 4},
      {name: 'Vibrato Rate', min: 0, max: 127, value: 50, cc: 11},
      {name: 'Vibrato Depth', min: 0, max: 127, value: 0, cc: 1}
    ];    
    controls.forEach(control => {
      const {slider, valueDisplay} = createSlider(control.name, control.min, control.max, control.value);
      slider.addEventListener('input', () => {
        valueDisplay.textContent = slider.value;        
        clarinet.controlChange(control.cc, parseInt(slider.value));
      });
    });    
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      const note = notes.find(n => n.key === event.key);
      if (note && !event.repeat) {
        clarinet.noteOn(note.freq, 100);
        // Highlight the key
        const keyIndex = notes.indexOf(note);
        keyboardDiv.children[keyIndex].style.backgroundColor = note.name.includes('#') ? '#333' : '#ddd';
      }
    });    
    document.addEventListener('keyup', (event) => {
      const note = notes.find(n => n.key === event.key);
      if (note) {
        clarinet.noteOff(64);
        // Reset the key color
        const keyIndex = notes.indexOf(note);
        keyboardDiv.children[keyIndex].style.backgroundColor = note.name.includes('#') ? 'black' : 'white';
      }
    });    
    startButton.disabled = true;
    startButton.textContent = 'Clarinet is running';
  });
});