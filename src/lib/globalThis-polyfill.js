// Polyfill for define-globalThis-property
// This is a minimal implementation to satisfy the missing core-js module

export default function defineGlobalThisProperty(globalObject, property, options) {
  // Simple implementation - just set the property if it doesn't exist
  if (!(property in globalObject)) {
    globalObject[property] = options.value;
  }
  return globalObject[property];
}

// CommonJS export for compatibility
module.exports = defineGlobalThisProperty;
module.exports.default = defineGlobalThisProperty;
