/** UNF supplement for Unit 3: Laplace transform rules. Original questions. Each worked case
 * reproduces a worked example derived by hand in the Unit 3 notes; second() evaluates the defining
 * integral by quadrature. */
import { problem,range,choice,kase,num } from '../kit.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { transformRules } from '@flux/subjects/math/ode-methods.js';
import { citation } from '../../data/textbook.js';
const N=`Flux notes, Unit 3 §12 worked example (derived by hand, checked by quadrature)`;
const base={exam:'u3',ch:'3'};
const nc=spec=>problem({...base,kind:'numeric',...spec,src:citation(spec.topics[0])});
const cc=spec=>problem({...base,kind:'conceptual',...spec,src:citation(spec.topics[0])});
const part=(id,get,label,traps)=>num(id,get,'',{label,tol:.003,abs:1e-9,traps});
const pick=(id,label,opts,correct)=>({id,kind:'choice',label,multi:false,options:opts.map(([value,label,why])=>({value,label,why})),correct});
const cs=(v,want)=>kase(N,v,want,{note:'The case is the notes worked example; its numbers were derived there and checked by quadrature.'});
/** ∫₀^∞ e^(−st) f(t) dt, split at the given breaks and stopped where e^(−(s−σ)t) is negligible. */
const laplace=(f,s,abscissa=0,breaks=[])=>{const end=60/(s-abscissa),cuts=[0,...breaks.filter(x=>x>0&&x<end),end];let sum=0;for(let i=1;i<cuts.length;i++)sum+=simpson(t=>Math.exp(-s*t)*f(t),cuts[i-1],cuts[i],1e-11);return sum;};
const fact=n=>n<2?1:n*fact(n-1);
export default [
 nc({id:'u3.t-rule',title:'Multiplying by t differentiates in s',topics:['laplace-rules'],lab:'laplace-rules',level:2,
  vars:{b:range(1,3,1),s:range(1,3,1),kind:choice(['sin','t sin(bt)'],['cos','t cos(bt)'])},
  text:T=>`Use L{tf}=−F′(s) to find the transform of ${T.kind} with b=${T.b}, evaluated at s=${T.s}.`,
  parts:[part('F',$=>$.kind==='sin'?2*$.b*$.s/($.s**2+$.b**2)**2:($.s**2-$.b**2)/($.s**2+$.b**2)**2,'F(s)',[[ $=>$.kind==='sin'?$.b/($.s**2+$.b**2)/$.s:$.s/($.s**2+$.b**2)/$.s,'F(s)/s is the rule for integrating in t, not for multiplying by t.'],[$=>$.kind==='sin'?-2*$.b*$.s/($.s**2+$.b**2)**2:-($.s**2-$.b**2)/($.s**2+$.b**2)**2,'Sign: L{tf}=−F′(s), and F′ is negative here, so the answer is positive.']])],
  valid:$=>$.kind==='sin'||$.s!==$.b,
  hints:['Start from L{sin bt}=b/(s²+b²) or L{cos bt}=s/(s²+b²).','Differentiate in s and change the sign.'],
  steps:($,f)=>[$.kind==='sin'?String.raw`$-\frac{d}{ds}\frac{b}{s^2+b^2}=\frac{2bs}{(s^2+b^2)^2}$.`:String.raw`$-\frac{d}{ds}\frac{s}{s^2+b^2}=\frac{s^2-b^2}{(s^2+b^2)^2}$.`,`At s=${f($.s)}: ${f($.kind==='sin'?2*$.b*$.s/($.s**2+$.b**2)**2:($.s**2-$.b**2)/($.s**2+$.b**2)**2)}.`],
  second:$=>({F:laplace(t=>t*($.kind==='sin'?Math.sin($.b*t):Math.cos($.b*t)),$.s)}),
  sim:{scenario:'tsin',setup(s,$){Object.assign(s,{p:{b:$.b},s:$.s});},read:(c,s,$)=>$.kind==='sin'?{F:c.F}:{}},
  cases:[cs({b:2,s:1.5,kind:'sin'},{F:.1536})]}),
 nc({id:'u3.power-shift',title:'Powers of t with an exponential factor',topics:['laplace-rules'],lab:'laplace-rules',level:2,
  vars:{n:range(1,3,1),a:range(-2,-1,1),s:range(3,5,1),form:choice(['prod','tⁿe^(at)'],['shift','the s-shift of n!/s^(n+1)'])},
  text:(T,$)=>`Find the transform of t^${T.n}e^(${$.a}t) at s=${T.s}, using ${T.form}.`,
  parts:[part('F',$=>fact($.n)/($.s-$.a)**($.n+1),'F(s)',[[ $=>fact($.n)/$.s**($.n+1),'The exponential shifts s to s−a; the shift is missing.'],[$=>fact($.n)/($.s+$.a)**($.n+1),'Shift direction: e^(at) replaces s by s−a, not s+a.']])],
  valid:$=>$.a!==0,
  hints:['L{tⁿ}=n!/s^(n+1).','Multiplying by e^(at) replaces s by s−a.'],
  steps:($,f)=>[`F=${fact($.n)}/(s−(${$.a}))^${$.n+1}=${f(fact($.n)/($.s-$.a)**($.n+1))}.`],
  second:$=>({F:laplace(t=>t**$.n*Math.exp($.a*t),$.s,$.a)}),
  sim:{scenario:'tnexp',setup(s,$){Object.assign(s,{p:{n:$.n,a:$.a},s:$.s});},read:c=>({F:c.F})},
  cases:[kase('Flux check value: the closed form, checked by quadrature',{n:3,a:-1,s:3,form:'prod'},{F:6/256},{note:'Not from a source. The notes example uses a=−1/2; this one uses a=−1.'})]}),
 nc({id:'u3.delay-rule',title:'A delayed function needs rewriting in t−c',topics:['laplace-rules'],lab:'laplace-rules',level:3,
  vars:{c:range(1,2,1),s:range(1,3,1),form:choice(['shifted','u(t−c)(t−c)²'],['raw','u(t−c)t²'])},
  text:T=>`Find the transform of ${T.form} with c=${T.c}, at s=${T.s}.`,
  parts:[part('F',$=>$.form==='shifted'?2*Math.exp(-$.c*$.s)/$.s**3:Math.exp(-$.c*$.s)*(2/$.s**3+2*$.c/$.s**2+$.c*$.c/$.s),'F(s)',[[ $=>$.form==='shifted'?2/$.s**3:2*Math.exp(-$.c*$.s)/$.s**3,$=>$.form==='shifted'?'The delay multiplies by e^(−cs); it is missing.':'Rewrite t² as (t−c)²+2c(t−c)+c² before shifting.'],[$=>$.form==='shifted'?2*Math.exp($.c*$.s)/$.s**3:2*Math.exp(-$.c*$.s)/($.s-$.c)**3,$=>$.form==='shifted'?'Sign: a delay gives e^(−cs), which shrinks F.':'A t-shift multiplies by e^(−cs); it does not shift s.']])],
  valid:$=>$.s!==$.c,
  hints:['L{u(t−c)g(t−c)}=e^(−cs)G(s).','If the function is not written in t−c, expand it in powers of t−c first.'],
  steps:($,f)=>[$.form==='shifted'?String.raw`$g=t^2$, so $F=2e^{-cs}/s^3$.`:String.raw`$t^2=(t-c)^2+2c(t-c)+c^2$, so $F=e^{-cs}(2/s^3+2c/s^2+c^2/s)$.`,`F=${f($.form==='shifted'?2*Math.exp(-$.c*$.s)/$.s**3:Math.exp(-$.c*$.s)*(2/$.s**3+2*$.c/$.s**2+$.c*$.c/$.s))}.`],
  second:$=>({F:laplace(t=>t<$.c?0:$.form==='shifted'?(t-$.c)**2:t*t,$.s,0,[$.c])}),
  sim:{scenario:'delayed',setup(s,$){Object.assign(s,{p:{c:$.c},s:$.s});},read:(c,s,$)=>$.form==='shifted'?{F:c.F}:{}},
  cases:[cs({c:1,s:2,form:'shifted'},{F:.0338338})]}),
 nc({id:'u3.periodic',title:'A periodic input sums its periods',topics:['laplace-rules'],lab:'laplace-rules',level:2,
  vars:{T:range(1,3,1),s:range(.5,2,.5),ask:choice(['F','the transform F(s)'],['first','the one-period integral ∫₀ᵀe^(−st)f dt'])},
  text:T=>`A square wave is 1 for the first half of each period T=${T.T} and 0 for the second. At s=${T.s}, find ${T.ask}.`,
  parts:[part('r',$=>$.ask==='F'?1/($.s*(1+Math.exp(-$.s*$.T/2))):(1-Math.exp(-$.s*$.T/2))/$.s,'requested value',[[ $=>$.ask==='F'?(1-Math.exp(-$.s*$.T/2))/$.s:1/$.s,$=>$.ask==='F'?'One period alone misses the geometric factor 1/(1−e^(−sT)).':'The wave is 1 only on the first half period.'],[$=>$.ask==='F'?1/$.s:(1-Math.exp(-$.s*$.T))/$.s,$=>$.ask==='F'?'1/s is the transform of a constant 1; the wave is off half the time.':'Integrate to T/2, where the wave switches off, not to T.']])],
  hints:['One period: ∫₀^(T/2) e^(−st)dt.','Divide by 1−e^(−sT) and factor it as (1−e^(−sT/2))(1+e^(−sT/2)).'],
  steps:($,f)=>[`One period gives ${f((1-Math.exp(-$.s*$.T/2))/$.s)}.`,`F=1/(s(1+e^(−sT/2)))=${f(1/($.s*(1+Math.exp(-$.s*$.T/2))))}.`],
  second:$=>{const sq=transformRules.square,p={T:$.T};if($.ask==='first')return {r:simpson(t=>Math.exp(-$.s*t),0,$.T/2,1e-12)};const end=60/$.s;return {r:laplace(t=>sq.f(t,p),$.s,0,sq.breaks(p,end))};},
  sim:{scenario:'square',setup(s,$){Object.assign(s,{p:{T:$.T},s:$.s});},read:(c,s,$)=>$.ask==='F'?{r:c.F}:{}},
  cases:[cs({T:2,s:1,ask:'F'},{r:.731059})]}),
 cc({id:'u3.rule-match',title:'Name the rule that produced the transform',topics:['laplace-rules'],
  vars:{op:choice(['t','t f(t)'],['exp','e^(at)f(t)'],['delay','u(t−c)f(t−c)'],['int','∫₀ᵗ f(τ)dτ'])},
  text:T=>`If L{f}=F(s), what is the transform of ${T.op}?`,
  parts:[pick('rule','transform',[
   ['dF','−F′(s)','Differentiating under the integral brings down −t.'],
   ['shift','F(s−a)','e^(at)e^(−st)=e^(−(s−a)t), so s moves to s−a.'],
   ['delay','e^(−cs)F(s)','Substitute τ=t−c; the factor e^(−cs) comes out of the integral.'],
   ['div','F(s)/s','Integrating in t divides by s, since the integral has derivative f and starts at 0.'],
  ],$=>({t:'dF',exp:'shift',delay:'delay',int:'div'})[$.op])],
  hints:['Write the defining integral with the new function inside.','Look for a substitution or a derivative in s that turns it back into F.'],
  steps:$=>[({t:'d/ds∫e^(−st)f dt=∫(−t)e^(−st)f dt.',exp:'∫e^(−(s−a)t)f dt=F(s−a).',delay:'∫_c^∞e^(−st)f(t−c)dt=e^(−cs)F(s).',int:'L{g′}=sG−g(0) with g=∫₀ᵗf gives F=sG.'})[$.op]],
  second:$=>({rule:({t:'dF',exp:'shift',delay:'delay',int:'div'})[$.op]}),
  cases:[cs({op:'t'},{rule:'dF'})]}),
];
