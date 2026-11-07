/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'two rails', lab: 'nodes', scenario: 'parallel', read: (c) => ({ v: [c.nodal.v[1], 5.6], 'source current': [c.sourceI, 2.2] }) }],
  s2: [{ tag: 'one loop', lab: 'nodes', scenario: 'series', read: (c) => ({ I: [c.mesh.I[0], 1.2], 'top node': [c.nodal.v[1], 10.8] }) }],
  s3: [{ tag: 'a bridge', lab: 'nodes', scenario: 'bridge', read: (c) => ({ 'across the bridge': [c.bridgeI, 0.309], 'source current': [c.sourceI, 3.28] }) }],
};
