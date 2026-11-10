const set={"exam":"u4","title":"Proof and acceptance","chapters":"4","file":"u4-notes.html","sections":[{"id":"proof","n":1,"title":"Proof and leak test","lab":"proof","ch":["4"],"topics":["dome"],"home":true},{"id":"acceptance","n":2,"title":"Acceptance","lab":"proof","ch":["4"],"topics":["dome"],"home":false}]};
set.load=()=>import('../content/u4-notes.html?raw').then(m=>m.default);
export default set;
