import("instruments.lib");
freq = 440;
gate = button("h:/gate [tooltip:noteOn = 1, noteOff = 0]");
reedStiffness = 0.5;

//----------------------- Nonlinear filter ----------------------------
//nonLinearModulator in instruments.lib, adapts nonlinear passive allpass ladder filter allpassnn from miscfilter.lib to use with waveguide instruments
NLFM =  nonLinearModulator(0,gate,freq,0,0,6);

//----------------------- Synthesis parameters computing and functions declaration ----------------------------

//reed table parameters
reedTableOffset = 0.7;
reedTableSlope = -0.44 + (0.26*reedStiffness);
reedTable = reed(reedTableOffset,reedTableSlope);//reed function declared in instruments.lib

//delay line with length adapted in function of the order of nonlinear filter
delayLength = ma.SR/freq*0.5 - 1.5;
delayLine = de.fdelay(4096,delayLength);

filter = oneZero0(0.5,0.5);//one zero filter used as a allpass: pole is set to -1

//----------------------- Algorithm implementation ----------------------------
process =
	(_,(gate*0.9 <: _,_) : (filter*-0.95 - _ <: //Commuted Loss Filtering
	*(reedTable)) + _) ~ //Nonlinear Scattering	
	(delayLine : NLFM) ;//Delay with Feedback

