// Polyfill for globalThis-this
// This is a minimal implementation to satisfy the missing core-js module

export default globalThis;

// CommonJS export for compatibility
module.exports = globalThis;
module.exports.default = globalThis;
