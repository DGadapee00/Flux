/** Keep worked-case attribution visible in the student's solution, including generated variants. */
export function citeCases(template) {
  const sources=[...new Set((template.cases||[]).map(c=>c.src).filter(Boolean))];
  if(!sources.length)return template;
  return {...template,src:template.src||'Open-source worked cases; references in the solution',
    steps:(...args)=>[...template.steps(...args),`Sources for this family: ${sources.join('; ')}.`]};
}
