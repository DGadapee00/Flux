const setup=(tag,lab,scenario,values,read)=>({tag,lab,scenario,setup:s=>Object.assign(s,values),read});
export default {
 s1:[setup('One equation, two coordinates','phase-portrait','sink',{A:[0,1,-2,-2],x0:1,y0:0,t:1},c=>({x:[c.x,.5083259859995252],v:[c.y,-.6191197513062244]}))],
 s2:[setup('Match the direction to the rate','phase-portrait','saddle',{A:[2,-4,1,-3],x0:4,y0:1,t:1},c=>({x:[c.x,4*Math.E],y:[c.y,Math.E]}))],
 s3:[setup('One displaced mass excites two modes','normal-modes','mixed',{},c=>({x1:[c.x1,-.1301015708908841],x2:[c.x2,.2860452656562584],E:[c.energy,1.5]})),setup('Unequal masses need unequal mode vectors','normal-modes','unequal',{},c=>({x1:[c.x1,.35749770624296884],x2:[c.x2,4.69132820260441]}))],
 s4:[setup('Same roots, different geometry','phase-portrait','defective',{},c=>({x:[c.x,Math.exp(-1)],y:[c.y,Math.exp(-1)]}))],
 s5:[setup('Growth and rotation together','phase-portrait','spiral',{A:[1,1,-4,1],x0:1,y0:2,t:1},c=>({x:[c.x,1.3405222882480052],y:[c.y,-7.205862111523265]}))],
 s6:[setup('Coexistence and its nearby orbit','linearize','prey',{},c=>({x:[c.x,.7501858524361653],y:[c.y,.9944276973931762]}))],
 s7:[setup('The omitted term leaves a measurable difference','linearize','potential',{},c=>({x:[c.x,-.1411501712158172],linear:[c.linearX,-.183280796172209],error:[c.error,.057692209664490346]}))],
 s8:[setup('The same centre can conceal repulsion','linearize','source',{},c=>({r:[c.radius,.35112344158809483],x:[c.x,-.34760957255265007]}))],
 s9:[setup('Different starts approach one orbit','limit-cycle','inside',{},c=>({r:[c.r,.9997705571230825]}))],
 s10:[setup('A driven pendulum has an extra state','clock-pendulum','driven',{},(c,s)=>({drive:[s.drive,.05],rate:[s.w,Math.PI/2]}))],
 s11:[setup('Large amplitude delays the teaching pendulum','clock-pendulum','large',{},c=>({T:[c.period,4.392840195784646],theta:[c.theta,.17352337274344384],omega:[c.v,-1.7528634433089412]})),setup('Damping requires a sustaining input','clock-pendulum','damped',{},c=>({initial:[c.initial,.30205292148421525],E:[c.energy,.08996412220795319]}))],
};
