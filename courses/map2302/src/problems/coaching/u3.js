export default {
  "u3.coefficient": {
    "hints": [
      "Use orthogonality and parity before integrating.",
      "For a ramp integrate by parts; for the even triangle combine the two equal halves."
    ]
  },
  "u3.mean": {
    "hints": [
      "Integrate over one complete period.",
      "Only the constant term has a nonzero average; keep the a0/2 convention."
    ]
  },
  "u3.period": {
    "hints": [
      "One fundamental cycle occupies 2L seconds.",
      "The nth harmonic makes n cycles per fundamental period."
    ]
  },
  "u3.inverse-poles": {
    "hints": [
      "Factor before applying inverse-transform pairs.",
      "For a repeated factor include both 1/(s+a) and 1/(s+a)²."
    ]
  },
  "u3.transform": {
    "hints": [
      "Start from the transform of sine or cosine.",
      "Multiplication by exp(−at) shifts every s in that pair to s+a."
    ]
  },
  "u3.delay-transform": {
    "hints": [
      "Write the input as u(t−d) times a function of t−d.",
      "If the exponential still uses t, extract its extra exp(−ad) factor."
    ]
  },
  "u3.first-ivp": {
    "hints": [
      "Use L{y′}=sY−y0.",
      "Solve for Y, then separate its constant-input and initial-state terms."
    ]
  },
  "u3.impulse-response": {
    "hints": [
      "Build the zero-state response from the transfer function.",
      "Use elapsed time after the input. An impulse changes v by F/m; a step supplies a constant force."
    ]
  },
  "u3.step-response": {
    "hints": [
      "Build the zero-state response from the transfer function.",
      "Use elapsed time after the input. An impulse changes v by F/m; a step supplies a constant force."
    ]
  },
  "u3.rc-history": {
    "hints": [
      "Represent a pulse as two steps with opposite signs.",
      "Convolve the RC impulse response with the part of the input that has already arrived."
    ]
  },
  "u3.sin-convolution": {
    "hints": [
      "Write the integral from 0 to t.",
      "Use a product-to-sum identity before integrating the shifted trigonometric factors."
    ]
  },
  "u3.integration-convolution": {
    "hints": [
      "Apply the causal convolution definition.",
      "The constant factor leaves an ordinary integral of the power."
    ]
  },
  "u3.residue": {
    "hints": [
      "Multiply by the pole factor before evaluating.",
      "At s=−a, the remaining denominator is b−a."
    ]
  },
  "u3.transfer": {
    "hints": [
      "Transform each derivative with zero initial data.",
      "Collect the coefficient multiplying X(s), then solve for X/U."
    ]
  },
  "u3.delta-weight": {
    "hints": [
      "Use the delta sampling rule.",
      "Evaluate the smooth multiplier at the impulse arrival time before multiplying its weight."
    ]
  },
  "u3.radio-tuning": {
    "hints": [
      "Use the LC natural-frequency condition.",
      "Convert the source frequency to SI before solving for C or converting the period."
    ]
  },
  "u3.initial-pulse": {
    "hints": [
      "Transform the full IVP, including both initial-data terms.",
      "Represent the force as two shifted steps; invert each term on its own clock."
    ]
  },
  "u3.parity": {
    "hints": [
      "Inspect the parity of the basis product.",
      "An odd integrand has zero integral across a symmetric interval."
    ]
  },
  "u3.jump-value": {
    "hints": [
      "Distinguish the function’s assigned value from its side limits.",
      "Use the piecewise-smooth convergence theorem."
    ]
  },
  "u3.gibbs": {
    "hints": [
      "Check whether the function itself jumps.",
      "Separate the width of a ringing region from its maximum height."
    ]
  },
  "u3.series-operation": {
    "hints": [
      "Check what differentiation does to high harmonics.",
      "Treat the mean separately when integrating, and jumps separately when differentiating."
    ]
  },
  "u3.step-vs-impulse": {
    "hints": [
      "Integrate the equation over a shrinking interval around the input change.",
      "Compare a finite-height step’s area with an impulse’s finite area."
    ]
  },
  "u3.transfer-state": {
    "hints": [
      "Write the derivative-transform rules before solving.",
      "Check whether the initial-data terms vanish."
    ]
  },
  "u3.convolution-unit": {
    "hints": [
      "Use the convolution definition.",
      "For δ apply the sampling rule; for 1 retain the full integral."
    ]
  },
  "u3.poles": {
    "hints": [
      "Apply cover-up at the pole.",
      "A zero numerator at a simple pole cancels its residue."
    ]
  },
  "u3.periodic-resonance": {
    "hints": [
      "Compare every nonzero forcing harmonic with the natural frequency.",
      "A resonant term has a growing time factor that free motion cannot remove."
    ]
  }
};
