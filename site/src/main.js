import { COURSES, courseLines } from './courses.js';

const list = document.querySelector('#courses');

for (const course of COURSES) {
  const lines = courseLines(course);
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'card';
  link.href = course.href;
  link.dataset.course = course.id;

  const body = document.createElement('span');
  body.className = 'card-body';

  const code = document.createElement('span');
  code.className = 'code';
  code.textContent = lines.code;

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = lines.title;

  const detail = document.createElement('span');
  detail.className = 'detail';
  detail.textContent = lines.detail;

  const open = document.createElement('span');
  open.className = 'open';
  open.textContent = 'Open';

  body.append(code, title, detail);
  link.append(body, open);
  item.append(link);
  list.append(item);
}

if (typeof __BUILD__ !== 'undefined' && __BUILD__.commit) {
  console.log(`FLUX ${__BUILD__.commit}`);
}
