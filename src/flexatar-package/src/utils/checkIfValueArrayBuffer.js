
/**
 * Check if the provided value is an ArrayBuffer.
 * @param {any} value - The value to check.
 * @returns {boolean} True if the value is an ArrayBuffer, false otherwise.
 */
export function checkIfValueArrayBuffer(value) {
  return value instanceof ArrayBuffer;
}
