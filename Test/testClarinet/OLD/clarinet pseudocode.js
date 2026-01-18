//adapted from https://www.acoustics.ed.ac.uk/wp-content/uploads/AMT_MSc_FinalProjects/2012__Carpenter_AMT_MSc_FinalProject_AudioUnitWaveguides.pdf
delay = ((Fs/f)-0.7)/4 -1 // calculation of the exact delay length (samples)
// intialise vectors and additional variables
let d1 = [], d2 = [], // these are length delay
d1ptr = 1, d2ptr = 1,
delayedend = 0
for i= 1:N // N is length of envelope
    intermediate= d1(d1ptr) 
    output= d2(d2ptr)   // set output vector at i    
    deltaP= input[i]]- output[i] // calculate pressure difference
    // calculate reflection coefficient (bound -1<r<1)
    r= 1.1*deltaP - 0.1
    if (r <-1) r = -1
    elseif (r>1) r=1
    d1(d1ptr)= input[i]-(r*deltaP)// update delay line at mouthpiece    
    output[i] += d1(d1ptr)// sum in the two travelling waves to form the output
    // apply filter
    delayendnext= intermediate
    d2(d2ptr)= -0.48*(intermediate+delayedend)
    delayedend = delayendnext// update values
    // increment pointers
    d1ptr++
    d2ptr++
    if (d1ptr>delay+1) d1ptr= 1
    if (d2ptr>delay+1) d2ptr= 1
end
soundsc(output,Fs)// play the output
