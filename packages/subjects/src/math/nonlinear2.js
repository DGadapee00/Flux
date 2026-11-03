export function jacobian2(f,z,h=1e-5){const xp=f([z[0]+h,z[1]]),xm=f([z[0]-h,z[1]]),yp=f([z[0],z[1]+h]),ym=f([z[0],z[1]-h]);return [(xp[0]-xm[0])/(2*h),(yp[0]-ym[0])/(2*h),(xp[1]-xm[1])/(2*h),(yp[1]-ym[1])/(2*h)];}
export function localSystem(kind,z,p={}){const [x,y]=z;if(kind==='centre'){const q=(p.a??0)*(x*x+y*y);return [-y+q*x,x+q*y];}if(kind==='prey')return [(p.a??1)*x-(p.b??1)*x*y,-(p.c??1)*y+(p.d??1)*x*y];return [y,-x+x*x-(p.c??0)*y];}
export function localJacobian(kind,[x,y],p={}){if(kind==='centre'){const a=p.a??0;return [a*(3*x*x+y*y),-1+2*a*x*y,1+2*a*x*y,a*(x*x+3*y*y)];}if(kind==='prey')return [(p.a??1)-(p.b??1)*y,-(p.b??1)*x,(p.d??1)*y,-(p.c??1)+(p.d??1)*x];return [0,1,-1+2*x,-(p.c??0)];}
export function cycleField(mu,[x,y]){const q=mu-x*x-y*y;return [q*x-y,x+q*y];}
