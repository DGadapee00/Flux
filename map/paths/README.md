# Course paths

A course is a path through the map. One file per course, named for its id in `map/courses.js`:

```js
// map/paths/phy2049.js
export default {
  course: 'phy2049',
  units: [
    { title: 'Exam 2: Field and flux', concepts: ['vector-fields', 'surface-flux', 'gauss-law'] },
    { title: 'Exam 5: Induction', concepts: ['faraday'] },
  ],
};
```

- `units` are in teaching order. `title` is optional; leave it out for a course with no units.
- Every concept on the path lists the course in its own `courses`, and every concept that lists the
  course is on its path.
- A prerequisite that is on the same path comes before the concept that needs it.

Write a path only once the course's concepts exist on the map. `map/check.mjs` checks all of this.
