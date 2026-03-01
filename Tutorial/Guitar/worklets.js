registerProcessor('white-noise-generator',class extends AudioWorkletProcessor {
  constructor() { super(); }
  process(inputs, outputs) {
  let output = outputs[0];
  for (let channel=0;channel<output.length;++channel) {
    let outputChannel = output[channel];
    for (let i=0;i<outputChannel.length;++i)  outputChannel[i]=2*Math.random()-1;
  }
  return true;
  }
})

// Karplus–Strong string synthesis processor, used for guitar model
registerProcessor('ks-ring-buffer', class extends AudioWorkletProcessor {
  static get parameterDescriptors() {return [
    { name: 'buffersize_', defaultValue: 100}, 
    { name: 'pickdirection_', defaultValue: 0}, 
    { name: 'pickposition_', defaultValue: 0}, 
    { name: 'pitch_', defaultValue: 440},
    { name: 'decay_', defaultValue: 4}, 
    { name: 'brightness_', defaultValue: 0.1}, 
    { name: 'level_', defaultValue: 1}, 
    { name: 'feedback_', defaultValue: 0}];
  }
  constructor() {
    super();
    this.RingBuffer = new Array(256);
    this.RingBuffer.fill(0);
    this.writePointer = new Array(2);
    this.writePointer.fill(0);
    this.twopointavg = 0;
    this.prevIn = new Array(2);
    this.prevIn.fill(0);
    this.lastOut = new Array(2);
    this.lastOut.fill(0);
    this.pickDirectionOut = 0;
    this.pickPositionOut = 0;
    this.dampOut = 0;
    this.dampPrevIn = new Array(2);
    this.dampPrevIn.fill(0);
    this.prevLevelIn = new Array(2);
    this.prevLevelIn.fill(0);
    this.DynamicLevelInput = 0;
    this.prevLevelOut = new Array(2);
    this.prevLevelOut.fill(0);
  }
  process(inputs, outputs, parameters) {
    let buffersize = parseInt(parameters.buffersize_[0]);
    let pickDirection = parameters.pickdirection_[0];
    let pickPosition = parameters.pickposition_[0];
    let pitch = parameters.pitch_[0];
    let feedback = 0.01 * parameters.feedback_[0];
    if (isNaN(pitch)) pitch = 440;
    let decay = parameters.decay_[0];
    let brightness = parameters.brightness_[0];
    let level = parameters.level_[0];
    let pickPositionDelay = Math.floor(pickPosition * buffersize);
    if (isNaN(pickPositionDelay) || isNaN(pickDirection) || isNaN(decay) || isNaN(brightness) || isNaN(level) || isNaN(feedback)) {
      pickPositionDelay = 10;
      pickDirection = 0;
      decay = 4;
      brightness = 0;
      level = 1;
      feedback = 0;
    }
    let Lw = Math.PI * (pitch / sampleRate);
    let Lgain = Lw / (1 + Lw);
    let Lpole2 = (1 - Lw) / (1 + Lw);
    let Lo = Math.pow(level, 1 / 3);
    let rho = Math.pow(0.001, 1.0 / (pitch * decay));
    const input = inputs[0], output = outputs[0];
    let nChannels = input.length;
    for (let channel = 0; channel < nChannels; ++channel) {
      const inputChannel = input[channel], outputChannel = output[channel];
      for (let n = 0; n < outputChannel.length; ++n) {
        if (inputChannel[n] != 0) {
          this.RingBuffer[this.writePointer[channel]] = inputChannel[n];
          this.writePointer[channel] = this.writePointer[channel] + 1;
          if (this.writePointer[channel] > buffersize) this.writePointer[channel] = 0;
        }
        if (inputChannel[n] === 0) {
          //PickDirection FIlter
          this.pickDirectionOut = (1 - pickDirection) * this.RingBuffer[this.writePointer[channel]] + pickDirection * this.lastOut[channel];
          this.lastOut[channel] = this.pickDirectionOut;
          this.RingBuffer[this.writePointer[channel]] = this.pickDirectionOut;
          //PickPosition Filter
          this.pickPositionOut = this.RingBuffer[this.writePointer[channel]] - feedback * this.RingBuffer[(((this.writePointer[channel] - pickPositionDelay) % buffersize) + buffersize) % buffersize];
          this.RingBuffer[this.writePointer[channel]] = this.pickPositionOut;
          //Two Point Averaging Filter
          this.twopointavg = (this.RingBuffer[this.writePointer[channel]] + this.prevIn[channel]) / 2;
          this.RingBuffer[this.writePointer[channel]] = this.twopointavg;
          this.prevIn[channel] = this.RingBuffer[this.writePointer[channel]];
          //DampingFilter
          this.DampOut = rho * ((1 - (brightness * 0.5)) * this.RingBuffer[this.writePointer[channel]] + (brightness * 0.5) * this.dampPrevIn[channel]);
          this.dampPrevIn[channel] = this.RingBuffer[this.writePointer[channel]];
          this.RingBuffer[this.writePointer[channel]] = this.DampOut;
          //DynamicLevel Filter
          this.DynamicLevelInput = Lgain * this.RingBuffer[this.writePointer[channel]] + Lgain * this.prevLevelIn[channel] + Lpole2 * this.prevLevelOut[channel];
          this.prevLevelOut[channel] = this.DynamicLevelInput;
          this.prevLevelIn[channel] = this.RingBuffer[this.writePointer[channel]];
          outputChannel[n] = level * Lo * this.RingBuffer[this.writePointer[channel]] + (1 - level) * this.DynamicLevelInput;
          this.writePointer[channel] = this.writePointer[channel] + 1;
          if (this.writePointer[channel] > buffersize) this.writePointer[channel] = 0;
        }
      }
    }
    return true;
  }
})