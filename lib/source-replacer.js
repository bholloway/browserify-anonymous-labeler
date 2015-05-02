'use strict';

var interleave = require('./interleave'),
    getField   = require('./get-field');

/**
 * Make replacements to the given source code and return a set of methods to utilise it.
 * @param {string} source Source code text without source-map comment
 * @param {object} replacements A hash of replacements to make
 * @returns {{toStringBefore:function, toStringAfter:function, getColumnAfter:function}} A set of methods
 */
function sourceReplacer(source, replacements) {

  // shared
  var getBefore = getField('before');
  var getAfter  = getField('after');

  // split source code into lines, include the delimiter
  var lines = source.split(/(\r?\n)/g);

  // split each line further by the replacements
  for (var i = 0; i < lines.length; i += 2) {
    var split = lines[i] = [].concat(lines[i]); // initialise each line text into an array
    for (var before in replacements) {
      var after = replacements[before];
      split.forEach(splitByReplacement(before, after));
    }
  }

  // utility methods
  return {
    toStringBefore: toStringBefore,
    toStringAfter : toStringAfter,
    getColumnAfter: getColumnAfter
  };

  /**
   * String representation of text before replacement
   * @returns {string}
   */
  function toStringBefore() {
    return lines.map(getBefore).join('');
  }

  /**
   * String representation of text after replacement
   * @returns {string}
   */
  function toStringAfter() {
    return lines.map(getAfter).join('');
  }

  /**
   * Get a column position delta as at the given line and column that has occured as a result of replacement.
   * @param {number} lineIndex The line in the original source at which to evaluate the offset
   * @param {number} columnIndex The column in the original source at which to evaluate the offset
   * @returns {number} A column offset in characters
   */
  function getColumnAfter(lineIndex, columnIndex) {
    if (lineIndex in lines) {
      var line   = lines[lineIndex];
      var count  = 0;
      var offset = 0;
      for (var i = 0; i < line.length; i++) {
        var widthBefore = getBefore(line[i]).length;
        var widthAfter  = getAfter(line[i]).length;
        var nextCount   = count + widthBefore;
        if (nextCount > columnIndex) {
          break;
        } else {
          count   = nextCount;
          offset += widthAfter - widthBefore;
        }
      }
      return columnIndex + offset;
    } else {
      throw new Error('Line index is out of range');
    }
  }
}

module.exports = sourceReplacer;

/**
 * Get a reduce method for the given text replacement.
 * Every 2N element is unmatched, and 2N+1 element is a key. Keep splitting the 2N elements until all the keys are
 * processed. 2N+1 elements are replaced with an object <code>{before:string, after:string}</code>.
 * Replacements should be non-intersecting so long as we quote them. Consider either string terminator style.
 * @param {string} before The value to search for
 * @param {string} after The value after replacement with
 * @returns {function} A method that reduces the split array and returns the array
 */
function splitByReplacement(before, after) {
  return function eachElement(value, i, array) {
    ['\'', '"']
      .forEach(function eachStringTerminator(terminator) {
        var description = {
          before: 'require(' + terminator + before + terminator,
          after : 'require(' + terminator + after  + terminator
        };
        var interleaver = interleave(description);
        for (var i = 0; i < array.length; i += 2) {
          var split = array[i].split(description.before);
          if (split.length > 1) {
            var interleaved = split.reduce(interleaver, []);
            array.splice.apply(array, [i, 1].concat(interleaved));
            i += interleaved.length - 1;  // skip the newly added items
          }
        }
      });
  }
}