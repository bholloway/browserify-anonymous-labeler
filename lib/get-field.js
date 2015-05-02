'use strict';

/**
 * Get the string representation of the element from the given field where present, else the value itself.
 * @param {string} field The field of the element to consider
 * @returns {function} A method that performs the action on a given element
 */
function getField(field) {
  return function map(element) {
    if (element) {
      if (Array.isArray(element)) {
        return element.map(map).join('');
      }
      else if (typeof element === 'string') {
        return element;
      }
      else if (typeof element === 'object') {
        return element[field];
      }
    }
    return '';
  };
}

module.exports = getField;