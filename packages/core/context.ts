import { AsyncLocalStorage } from 'node:async_hooks';

const purgeContext = new AsyncLocalStorage<{ tags: Set<string> }>();

export function cacheTags(...tags: string[]): void {
  const store = purgeContext.getStore();
  if (store) {
    tags.forEach(tag => store.tags.add(tag));
  }
}

export function createPurgeContext(callback: () => void): void {
  const store = { tags: new Set<string>() };
  return purgeContext.run(store, callback);
}

export function getCurrentPurgeContext(): Set<string> {
  const store = purgeContext.getStore();
  if (!store) {
    throw new Error("No purge context found. Ensure you are running within a purge context.");
  }
  return store.tags;
}

