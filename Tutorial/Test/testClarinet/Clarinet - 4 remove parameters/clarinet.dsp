//Nonlinear WaveGuide Clarinet based on Smith (1986), McIntyre, Schumacher, Woodhouse (1983); Romain Michon rmichon@ccrma.stanford.edu, https://ccrma.stanford.edu/~jos/pasp/Woodwinds.html
import("instruments.lib");
freq = 440;
gate = button("h:/gate [tooltip:noteOn = 1, noteOff = 0]");
//physical parameters, removed noise since noiseGain=0
reedStiffness = 0.5;
pressure = 1; //breath pressure
//nonlinear filter parameters
typeModulation = 0;//theta is modulated by the incoming signal
nonLinearity = 0;
frequencyMod = 220;//Frequency of the sine wave for the modulation of theta (if Modulation Type=3)
nonLinAttack = 0.1;
//vibrato parameters
vibratoFreq = 5;
vibratoGain = 0.1;
vibratoAttack = 0.5;
vibratoRelease = 0.01;
 //envelope parameters
envelopeAttack = 0.01;
envelopeDecay = 0.05;
envelopeRelease = 0.1;

//==================== SIGNAL PROCESSING ======================

//----------------------- Nonlinear filter ----------------------------
//nonlinearities created by the nonlinear passive allpass ladder filter declared in miscfilter.lib
nlfOrder = 6; //nonlinear filter order

//attack - sustain - release envelope for nonlinearity (declared in instruments.lib)
envelopeMod = en.asr(nonLinAttack,1,envelopeRelease,gate);

//nonLinearModultor is declared in instruments.lib, it adapts allpassnn from miscfilter.lib for use with waveguide instruments
NLFM =  nonLinearModulator((nonLinearity : si.smoo),envelopeMod,freq,typeModulation,(frequencyMod : si.smoo),nlfOrder);

//----------------------- Synthesis parameters computing and functions declaration ----------------------------

//reed table parameters
reedTableOffset = 0.7;
reedTableSlope = -0.44 + (0.26*reedStiffness);

reedTable = reed(reedTableOffset,reedTableSlope);//reed function declared in instruments.lib

//delay line with a length adapted in function of the order of nonlinear filter
delayLength = ma.SR/freq*0.5 - 1.5 - (nlfOrder*nonLinearity)*(typeModulation < 2);
delayLine = de.fdelay(4096,delayLength);

filter = oneZero0(0.5,0.5);//one zero filter used as a allpass: pole is set to -1

//----------------------- Algorithm implementation ----------------------------
//Breath pressure + vibrato + breath envelope (Attack / Decay / Sustain / Release)
breath = en.adsr(envelopeAttack,envelopeDecay,1,envelopeRelease,gate)*pressure*0.9;
vibrato = os.osc(vibratoFreq)*vibratoGain*envVibrato(0.1*2*vibratoAttack,0.9*2*vibratoAttack,100,vibratoRelease,gate);
breathPressure = breath + breath*vibrato;
process =
	//Commuted Loss Filtering
	(_,(breathPressure <: _,_) : (filter*-0.95 - _ <: 	
	//Nonlinear Scattering
	*(reedTable)) + _) ~ 	
	//Delay with Feedback
	(delayLine : NLFM) ;