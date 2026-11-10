import '@flux/shells/project/page.css';
import '@flux/shells/project/build.css';
import { mountProjectHeader } from '@flux/shells/project/page.js';
import { TRACKS, trackSiblings } from '@flux/tracks';
import { mountTraveler } from './view.js';

/**
 * A traveler: one part followed through the shop, station by station. This course is one page.
 */
const ID = 'dome';
const card = TRACKS.flatMap((track) => track.courses).find((course) => course.id === ID);

mountProjectHeader({ id: ID, code: card.code, title: card.title, siblings: trackSiblings(ID) });
mountTraveler();
