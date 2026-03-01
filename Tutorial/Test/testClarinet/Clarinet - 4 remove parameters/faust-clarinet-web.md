Web Audio implementation of the Faust clarinet model
  1. ClarinetModel class implements digital waveguide clarinet following Faust structure
  2. Parameter Organization:
    - Basic Parameters (freq, gain)
    - Physical Parameters (reed stiffness, noise gain, pressure)
      - NoiseGain removed
    - Nonlinear Filter Parameters
    - Vibrato Parameters
    - Envelope Parameters
  3. To use:
    - Click 'Start' to initialize Web Audio
    - Play notes using the piano keyboard or computer keys (Z-M row and above)