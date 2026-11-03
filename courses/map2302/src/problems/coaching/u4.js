export default {
  "u4.companion": {
    "hints": [
      "Introduce v=x′ before writing a matrix.",
      "Solve the original equation for v′ and read its two coefficients."
    ]
  },
  "u4.roots": {
    "hints": [
      "Form λ²−tr(A)λ+det(A)=0.",
      "Separate the real part from the imaginary magnitude when the discriminant is negative."
    ]
  },
  "u4.eigenline": {
    "hints": [
      "Substitute the stated eigenvalue into A−λI.",
      "One row fixes the missing coordinate; eigenvector length is arbitrary."
    ]
  },
  "u4.matrix-ivp": {
    "hints": [
      "Use e^(At) times the ordered initial vector.",
      "For repeated roots retain the nilpotent t term; for a complex pair retain rotation."
    ]
  },
  "u4.jordan": {
    "hints": [
      "Split A into rI+N with N²=0.",
      "Then exp(Nt)=I+tN; differentiate the product if rate is requested."
    ]
  },
  "u4.exponential-entry": {
    "hints": [
      "The matrix exponential is the fundamental matrix whose value at zero is I.",
      "Normalize independent solutions by their initial matrix before reading an entry."
    ]
  },
  "u4.mode-weights": {
    "hints": [
      "Write the initial vector as a linear combination of the two mode vectors.",
      "Add the coordinate equations to eliminate the second weight."
    ]
  },
  "u4.mode-frequencies": {
    "hints": [
      "Use det(K−ω²M)=0.",
      "Solve the quadratic for ω² and take positive square roots in the requested order."
    ]
  },
  "u4.coupled-state": {
    "hints": [
      "Project both positions and velocities onto the mass-weighted mode basis.",
      "Each modal coordinate has cosine and sine terms before transforming back."
    ]
  },
  "u4.jacobian": {
    "hints": [
      "Differentiate the vector field component by component.",
      "Evaluate at the named equilibrium only after taking derivatives."
    ]
  },
  "u4.prey-equilibrium": {
    "hints": [
      "Set both derivatives equal to zero and factor populations.",
      "For coexistence take positive x,y, then set the other two factors to zero."
    ]
  },
  "u4.cubic-radius": {
    "hints": [
      "Differentiate r²=x²+y².",
      "The rotational terms cancel, leaving a separable radial equation."
    ]
  },
  "u4.cycle-radius": {
    "hints": [
      "Set radial growth to zero to find a positive periodic radius.",
      "For the transient use s=r², which satisfies a logistic equation."
    ]
  },
  "u4.clock-length": {
    "hints": [
      "Convert beats to a complete period first.",
      "Solve T=2π√(L/g) for effective length; do not substitute an overall hardware dimension."
    ]
  },
  "u4.pendulum-period": {
    "hints": [
      "Use the conservative energy integral rather than the linearised equation.",
      "Substitute sin(θ/2)=sin(A/2)sin φ to remove the turning-point singularity."
    ]
  },
  "u4.saddle-rate": {
    "hints": [
      "Form the characteristic equation λ²+cλ−1=0.",
      "Use the positive root, then convert an exponential growth rate to doubling time if requested."
    ]
  },
  "u4.repeated-basis": {
    "hints": [
      "Compute the nullspace of A−λI.",
      "Distinguish algebraic root multiplicity from eigenspace dimension."
    ]
  },
  "u4.trace-det": {
    "hints": [
      "Use the sum and product of the eigenvalues.",
      "If roots are complex conjugates, their common real part is half the trace."
    ]
  },
  "u4.zero-roots": {
    "hints": [
      "Compute I+tA when A²=0.",
      "The zero matrix and a nonzero nilpotent matrix share eigenvalues but not flow."
    ]
  },
  "u4.fundamental": {
    "hints": [
      "Check the desired initial value of exp(At).",
      "A constant right factor preserves the fundamental-matrix equation."
    ]
  },
  "u4.mode-mixture": {
    "hints": [
      "Expand the initial displacement in the two mode directions.",
      "A pure mode has a fixed displacement ratio throughout motion."
    ]
  },
  "u4.hyperbolic": {
    "hints": [
      "Check whether any eigenvalue lies on the imaginary axis.",
      "Hyperbolicity supports local conclusions; a centre requires nonlinear information."
    ]
  },
  "u4.cycle-vs-centre": {
    "hints": [
      "Test whether the periodic orbit is isolated.",
      "Compare how nearby trajectories behave, not only whether one curve closes."
    ]
  },
  "u4.chaos-scope": {
    "hints": [
      "Count autonomous state dimensions, including a drive phase.",
      "Separate “can occur” from “must occur”."
    ]
  },
  "u4.clock-model": {
    "hints": [
      "Distinguish a beat from an oscillation.",
      "A physical pendulum’s inertia and centre of mass determine its effective length."
    ]
  }
};
