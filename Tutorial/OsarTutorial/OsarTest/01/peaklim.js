function peaklim(attack, release, threshold) {
  /* if below -100dB, set to -100dB to prevent taking log of zero */
  dB(x) = 20 * (x> 0.00001 ? log10(x) : log10(0.00001))
  dB2lin(x) = pow(10,x/20)
    level = 0
    
    float db_gain = 0,gain = 0

    beta_a = 1 - exp( -1 / ( attack * sampleRate ))
    beta_r = 1 - exp( -1 / ( release * sampleRate ))

    if ( abs(in) > level) level += beta_a * (abs(in) - level)
    else level += beta_r * ( abs(in) - level)
    
    db_gain = min(0, dB(dB2lin(threshold)/level))
    gain = pow(10,db_gain/20)
    out = in * gain
}