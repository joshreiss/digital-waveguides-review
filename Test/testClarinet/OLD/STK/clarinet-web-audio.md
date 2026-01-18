Claude Code 2025-03-12

⏺ I've created a complete Web Audio implementation of the STK Clarinet model:

  1. clarinet-web-audio.js - Contains three main classes:
    - ReedTable - Implements the non-linear reed function using a WaveShaperNode
    - Clarinet - The main instrument using digital waveguide model with delay line, filters, and control
    - SimpleReverb - A JCRev-inspired reverb effect
  2. clarinet-web-audio.html - HTML interface to load and play the clarinet

  Key features:
  - Digital waveguide model matching the STK architecture
  - Keyboard and mouse control
  - Adjustable parameters (reed stiffness, breath noise, vibrato)
  - Reverb effect
  - Clean UI with parameter controls

  The implementation supports:
  - Note on/off control
  - Continuous controllers (CC) similar to MIDI
  - Frequency/pitch control
  - Visual feedback when playing

  To use it:
  1. Load the HTML file in a browser
  2. Click "Start Clarinet" button
  3. Play notes with mouse or keyboard (A-K keys)
  4. Adjust parameters with sliders

  This is a complete translation of the STK Clarinet model to Web Audio, maintaining the core digital waveguide architecture while adapting to Web Audio's node-based approach.