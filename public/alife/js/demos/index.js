/** Lazy map: catalog demo ids → async factory loader (dynamic import on demand) */
export const DEMO_LOADERS = {
  life: () => import('./life.js').then((m) => m.createLife),
  boids: () => import('./boids.js').then((m) => m.createBoids),
  'langton-ant': () => import('./langton-ant.js').then((m) => m.createLangtonAnt),
  'grey-scott': () => import('./grey-scott.js').then((m) => m.createGreyScott),
  eca: () => import('./eca.js').then((m) => m.createECA),
  'lenia-lite': () => import('./lenia-lite.js').then((m) => m.createLeniaLite),
  'tierra-lite': () => import('./tierra-lite.js').then((m) => m.createTierraLite),
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
  return Boolean(demoId && DEMO_LOADERS[demoId]);
}

/** Resolve demo factory via dynamic import; caches after first load. */
const _factoryCache = Object.create(null);
export async function loadDemoFactory(demoId) {
  if (!isRunnableDemo(demoId)) return null;
  if (_factoryCache[demoId]) return _factoryCache[demoId];
  const factory = await DEMO_LOADERS[demoId]();
  _factoryCache[demoId] = factory;
  return factory;
}
