/** Every application on the hub. Each one is a set of recipes that name concepts on the map. */
import { SATELLITE } from './satellite.js';

export const APPLICATIONS = [SATELLITE];

/** Every recipe in an application, the integration step last. */
export const recipesOf = (app) => [...app.components, app.integration];
