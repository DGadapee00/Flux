export const SETUPS={};
export const setupsFor=()=>[];
export const matchExamples=(exam,section,tags)=>tags.map(()=>-1);
export function applyExample(lab,state,ex){ex.setup?.(state);state.dirty=true;}
