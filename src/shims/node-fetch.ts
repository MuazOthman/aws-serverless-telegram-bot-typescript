// Bundled in place of grammY's `node-fetch` v2 dependency (see the esbuild --alias flags in
// package.json), so the bot uses Node's built-in fetch and avoids node-fetch's deprecation
// warnings. Built-in fetch rejects Node stream bodies without `duplex: "half"`, so file uploads
// need `client: { baseFetchConfig: { duplex: "half" } }` in the bot config.
export default globalThis.fetch;
