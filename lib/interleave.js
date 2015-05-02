'use strict';

/**
 * Get a reduce method that interleaves the given additional value between each existing element in an array.
 * @param {*} additional The value to interleave
 * @returns {function} A method that reduces an array a returns an interleaved array
 */
function interleave(additional) {
  return function reduce(reduced, value, i) {
    if (i === 0) {
      reduced.push(value);
    } else {
      reduced.push(additional, value);
    }
    return reduced;
  }
}

module.exports = interleave;