'use strict';

/**
 * Replace each key in the <code>row.deps</code> with the value index and return a hash of replacements
 * @param {object} deps A deps hash from a row
 * @returns {object} A hash of replacements that were made
 */
function processDepKey(deps) {
  return Object.keys(deps)
    .reduce(reduceKeyToChanges, {});

  function reduceKeyToChanges(reduced, oldKey) {

    // replace in the row
    var value = deps[oldKey];   // value will be an index
    var newKey = String(value);   // use this index as the new key
    deps[newKey] = value;
    delete deps[oldKey];

    // record the replacement in the hash that is reduced
    reduced[oldKey] = newKey;
    return reduced;
  }
}

module.exports = processDepKey;