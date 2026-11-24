import { createLabLoader } from '@flux/core';
const labs=createLabLoader({lands:()=>import('./lands.js'),inspection:()=>import('./inspection.js'),repairs:()=>import('./repairs.js'),proof:()=>import('./proof.js')});
export const hasLab=labs.hasLab;
export const loadLab=labs.loadLab;
export const loadExamLabs=labs.loadExamLabs;
export const registerLabLoader=labs.registerLabLoader;
