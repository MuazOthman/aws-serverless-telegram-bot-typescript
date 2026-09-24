// Bundled in place of grammY's `abort-controller` dependency (see node-fetch.ts): built-in fetch
// only accepts signals from the built-in AbortController.
export const AbortController = globalThis.AbortController;
