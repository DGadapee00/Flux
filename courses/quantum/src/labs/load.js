import {createLabLoader} from '@flux/core';
import {LESSONS} from '../data/lessons.js';
const loader=createLabLoader(Object.fromEntries(LESSONS.map(s=>[s.id,()=>import('./labs.js').then(m=>({default:m.LABS[s.id]}))])));
export const hasLab=loader.hasLab,loadLab=loader.loadLab,loadExamLabs=loader.loadExamLabs,registerLabLoader=loader.registerLabLoader;
