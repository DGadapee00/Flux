const set={"exam":"u3","title":"Repair and disposition","chapters":"3","file":"u3-notes.html","sections":[{"id":"nonconformance","n":1,"title":"Nonconformance","lab":"repairs","ch":["3"],"topics":["dome"],"home":true}]};
set.load=()=>import('../content/u3-notes.html?raw').then(m=>m.default);
export default set;
