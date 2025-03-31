struct _DelayLine {
  short *data, *pointer, *end;
  int length; }

DelayLine *initDelayLine(int len) {
  dl->length = len;
  dl->pointer = dl->data;
  dl->end = dl->data + len - 1;
  return dl;
}

void setDelayLine(DelayLine *dl, double *values, double scale) {
  for (i=0;i<dl->length;i++) dl->data[i] = (int)(scale * values[i] * 32768);
}

/*Places "nut-reflected" sample from upper delay-line into lower delay-line pointer location (which represents x = 0 position). Pointer incremented (wave travels one sample to left), turning previous position into "effective" x=L position for next iteration. */
lowerDelayLineUpdate(DelayLine *dl, short insamp) {
  short *ptr = dl->pointer;
  *ptr = insamp;
  ptr++;
  if (ptr > dl->end) ptr = dl->data;
  dl->pointer = ptr;
}

* Decrement current upper delay-line pointer position (wave travels one sample to right), moving it to "effective" x=0 position for next iteration. bridge-reflected sample from lower delay-line then placed into this position. */
upperDelayLineUpdate(DelayLine *dl, short insamp) {
  short *ptr = dl->pointer;
  ptr--;
  if (ptr < dl->data) ptr = dl->end;
  *ptr = insamp;
  dl->pointer = ptr;
}

/* Return spatial sample at position, where Position 0 points to most recently inserted sample, i.e., current delay-line pointer position (x = 0). In upper, right-going delay-line, position increases to right, delay increases to right, left = past, right = future. In lower, left-going delay-line, position increases to right, delay decreases to right, left = future, right = past */
short delayLineAccess(DelayLine *dl, int position) {
  short *outloc = dl->pointer + position;
  while (outloc < dl->data) outloc += dl->length;
  while (outloc > dl->end) outloc -= dl->length;
  return *outloc;
}

DelayLine *upperRail,*lowerRail;
int initString(double amplitude, double pitch,double pick, double pickup) {
  int i, railLength = sampleRate/pitch/2 + 1;
  /* Round pick position to nearest spatial sample. Pick position at x = 0 not allowed */
  int pickSample = MAX(railLength * pick, 1);
  double upslope = amplitude/pickSample;
  double downslope = amplitude/(railLength - pickSample - 1);
  double initialShape[railLength];
  upperRail = initDelayLine(railLength), lowerRail = initDelayLine(railLength);
  for (i = 0; i < pickSample; i++) initialShape[pickSample] = upslope * i;
  for (i=pickSample;i<railLength;i++) initialShape[i] = downslope*(railLength-1-i);
/* Init conditions for plucked string. Past history measured backward from end of array*/
  setDelayLine(lowerRail, initialShape, 0.5);
  setDelayLine(upperRail, initialShape, 0.5);
  return pickup * railLength;
}

short bridgeReflection(int insamp) { //One-pole lowpass with feedback coefficient = 0.5
  short state = 0; /* filter memory */
  outsamp = 0.5 * state + 0.5 * insamp
  state = outsamp;
  return outsamp;
}

short nextStringSample(int pickupLocation) {
  short yp0,ym0,ypM,ymM;
  short outsamp, outsamp1;
  /* Output at pickup location */
  outsamp = delayLineAccess(upperRail, pickupLocation);
  outsamp1 = delayLineAccess(lowerRail, pickupLocation);
  outsamp += outsamp1;
  ym0 = delayLineAccess(lowerRail, 1); // Sample traveling into bridge
  ypM = delayLineAccess(upperRail, upperRail->length - 2); // Sample to "nut" 
  ymM = -ypM; /* Inverting reflection at rigid nut */
  yp0 = -bridgeReflection(ym0); /* Reflection at yielding bridge */
  /* String state update */
  upperDelayLineUpdate(upperRail, yp0); /* Decrement pointer and then update */
  lowerDelayLineUpdate(lowerRail, ymM); /* Update and then increment pointer */
  return outsamp;
}

void main {
  int pickupSample;
  short *data;
  double amp, duration, pitch, pick, pickup
// amp(<1.0) pitch(Hz) pickPosition(<1.0) pickupPosition(<1.0) duration(sec) 
// example: .5 100 .1 .2 1
  pickupSample = initString(amp, pitch, pick, pickup);
  for (i=0;i<duration*sampleRate;i++) outputSound[i] = nextStringSample(pickupSample);
}
