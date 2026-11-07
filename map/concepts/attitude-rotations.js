export default {
  id: 'attitude-rotations',
  title: 'Rotations: matrices and quaternions',
  label: ['Rotations and', 'quaternions'],
  subject: 'linalg',
  courses: ['satellite'],
  eq: String.raw`\mathbf q = \left(\cos\tfrac{\theta}{2},\ \hat{\mathbf n}\sin\tfrac{\theta}{2}\right),\qquad R^{\mathsf T}R = I`,
  idea: 'An attitude is the rotation from a reference frame to the body. A rotation matrix does it with nine numbers whose columns stay unit length and perpendicular. Three angles in sequence are easier to read but can reach gimbal lock, where two axes line up and one freedom is lost. A quaternion stores the axis and half the angle in four numbers, never locks, and is what flight software usually carries.',
  requires: ['matrix-maps', 'vectors'],
  sources: [
    {
      title: 'MIT 16.07, Lecture 3: Vectors, matrices and coordinate transformations',
      url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/resources/mit16_07f09_lec03/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Transformation matrices between frames and why they are orthogonal.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Quaternions and spatial rotation',
      url: 'https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation',
      kind: 'Reference',
      level: 'Deeper',
      why: 'Axis and angle, the link to rotation matrices, and gimbal lock compared with Euler angles.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'satellite', lab: 'attitude', notes: ['s1', 's2', 's3'], note: 'Yaw, pitch and roll on a satellite model: near 90° of pitch the angle rates for a gentle turn grow as 1/cos θ, at 90° the turn is lost, and the quaternion still makes it.' },
  ],
};
