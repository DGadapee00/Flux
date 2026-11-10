import '@flux/shells/project/page.css';
import '@flux/shells/project/build.css';
import { mountProjectHeader } from '@flux/shells/project/page.js';
import { TRACKS, trackSiblings } from '@flux/tracks';
import { mountGuide } from './view.js';

/**
 * The satellite's guide: the project as a how-to, one subsystem at a time. It is this course's
 * front page on the hub. The labs are the course app beside it (index.html).
 */
const ID = 'satellite';
const card = TRACKS.flatMap((track) => track.courses).find((course) => course.id === ID);

mountProjectHeader({
  id: ID,
  code: card.code,
  title: card.title,
  siblings: trackSiblings(ID),
  actions: [{ label: 'Labs', href: './' }],
});
mountGuide();
