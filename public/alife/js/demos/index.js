import { createLife } from './life.js';
import { createBoids } from './boids.js';
import { createLangtonAnt } from './langton-ant.js';
import { createGreyScott } from './grey-scott.js';
import { createECA } from './eca.js';
import { createLeniaLite } from './lenia-lite.js';
import { createTierraLite } from './tierra-lite.js';

/** Map catalog demo ids → factory */
export const DEMO_FACTORIES = {
  life: createLife,
  boids: createBoids,
  'langton-ant': createLangtonAnt,
  'grey-scott': createGreyScott,
  eca: createECA,
  'lenia-lite': createLeniaLite,
  'tierra-lite': createTierraLite,
};

export const DEMO_LABELS = {
  life: 'Game of Life',
  boids: 'Boids',
  'langton-ant': "Langton's Ant",
  'grey-scott': 'Grey-Scott',
  eca: 'Elementary CA',
  'lenia-lite': 'Lenia-lite',
  'tierra-lite': 'Tierra-lite',
};

export function isRunnableDemo(demoId) {
  return Boolean(demoId && DEMO_FACTORIES[demoId]);
}
