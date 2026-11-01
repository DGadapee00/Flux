const setup=(tag,lab,scenario,values,read)=>({tag,lab,scenario,setup:s=>Object.assign(s,values),read});
export default {
 s1:[setup('A square wave from rotating harmonics','fourier','square',{t:Math.PI/2},c=>({sum:[c.sum,1.0630539690963423]}))],
 s2:[setup('A corner is not a jump','fourier','triangle',{},c=>({sum:[c.sum,.40012540283325737]}))],
 s3:[setup('The third harmonic matters','fourier','periodic',{},c=>({x:[c.output,.05257070845783931]}))],
 s4:[setup('The mass does not teleport','laplace','impulse',{m:2,F:3,t:1},c=>({x:[c.x,0],v:[c.v,1.5]}))],
 s5:[setup('A step response takes time','laplace','step',{},c=>({x:[c.x,.267661137729866],v:[c.v,.2925001067983418]}))],
 s6:[setup('A capacitor remembers an earlier pulse','convolution','pulse',{},c=>({V:[c.y,.9542771184107353]}))],
 s7:[setup('A transformed RC step','convolution','step',{},c=>({V:[c.y,2.8506387948964083]}))],
 s8:[setup('Two poles with opposite residues','laplace','moving',{m:1,c:4,k:3,x0:0,v0:1,F:0,t:1},c=>({x:[c.x,.15904618640178922]}))],
 s9:[setup('Delayed input does not delay existing motion','laplace','moving',{},c=>({x:[c.x,.6070548491670358],v:[c.v,-1.3253831760161683]}))],
 s10:[setup('A critically damped pulse','laplace','pulse',{},c=>({x:[c.x,.3519705891978756]}))],
 s11:[setup('Narrow tuning has a transient cost','radio-tuner','tuned',{},c=>({Q:[c.Q,20],time:[c.tau,.00010610329539459691]}))],
};
