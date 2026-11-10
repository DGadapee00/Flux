import { defineCourse } from '@flux/core';
import { EXAMS } from './data/catalog.js';
export const course=defineCourse({id:'dome',code:'DOME',title:'Tank dome',subject:'mechanics',track:'projects',order:4,term:'',text:'NASA tank dome manufacturing reports and structural, welding and inspection standards, linked in the notes',units:EXAMS.map(e=>({id:e.id,title:e.title,chapters:[e.chapters],date:e.date,labs:e.labs})),chapters:{},standard:false,labs:()=>import('./labs/load.js'),problems:()=>import('./problems/index.js'),notes:()=>import('./notes/index.js'),prereqs:[]});
