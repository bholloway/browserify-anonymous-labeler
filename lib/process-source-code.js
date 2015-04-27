var sourceMap = require('source-map'),
    convert   = require('convert-source-map');

var quoteAndReplace = require('./quote-and-replace');

/**
 * Make the given replacements in the source code, with source-map safety.
 * @param {string} source The source code to consider
 * @param {object} replacements A hash of replacement text
 * @returns {string} Source code with amended text and amended source-map comment
 */
function processSourceCode(source, replacements) {

  // collate the replacement items
  var replacer = quoteAndReplace(replacements);

  // copy the source map, ensuring the replacements are made
  var lines       = convert.removeComments(source).split(/(\r?\n)/);
  var offsets     = [];
  var existingMap = convert.fromComment(source).toObject();
  var consumer    = new sourceMap.SourceMapConsumer(existingMap);
  var generator   = new sourceMap.SourceMapGenerator({
    file      : consumer.file,
    sourceRoot: consumer.sourceRoot
  });
  consumer.eachMapping(copyAndAmendMapping);
  consumer.sources.forEach(copySourceContent);

  // recombine lines and add comment
  return lines.join('') + convert.fromObject(generator.toJSON()).toComment();

  /**
   * Set the generator <code>sourceContent</code> for the given filename.
   * @param {string} filename The name of the file to set content for
   */
  function copySourceContent(filename) {
    var content = consumer.sourceContentFor(filename);
    if (content != null) {
      generator.setSourceContent(filename, content);
    }
  }

  /**
   * Copy the given mapping but amend both the source code and the mapping for the given replacements.
   * @param {object} mapping An existing source-map mapping from a source-map consumer
   * @param {number} i The index of the mapping in the given mappings array
   * @param {Array} array The array that the mapping is taken from
   */
  function copyAndAmendMapping(mapping, i, array) {

    // find the start line and column
    var lineIndex  = (mapping.generatedLine - 1) * 2;
    var colOffset  = offsets[lineIndex] || 0;
    var sourceCode = lines[lineIndex];

    // the start column will note be valid where there have been replacements in the same line
    //  so we need to apply the cumulative offset (for this line)
    var colStart = mapping.generatedColumn + colOffset;

    // add the source-map entry with cumulative column offset
    //  do this before we increment the offset below
    var newMapping = {
      generated: {
        line  : mapping.generatedLine,
        column: colStart
      }
    };
    if (mapping.source != null) {
      newMapping.source   = mapping.source;
      newMapping.original = {
        line  : mapping.originalLine,
        column: mapping.originalColumn
      };
      if (mapping.name != null) {
        newMapping.name = mapping.name;
      }
    }
    generator.addMapping(newMapping);

    // end comes from the next mapping
    //  we need the require() statement to be completely
    var next = array[i + 1];
    if (next && (next.generatedLine && mapping.generatedLine)) {

      // look for a require statement
      var colEnd    = next.generatedColumn + colOffset;
      var operands  = sourceCode.slice(colStart, colEnd).split(',');
      var isRequire =
            (sourceCode.slice(colStart - 8, colStart) === 'require(') &&
            (sourceCode.slice(colEnd, colEnd + 1) === ')') &&
            (operands.length === 1);
      if (isRequire) {

        // make any replacement, adjusting the column offset accordingly
        var before = operands[0];
        var after  = replacer(before);
        if (after) {
          offsets[lineIndex] = colOffset + after.length - before.length;
          lines[lineIndex]   = sourceCode.slice(0, colStart) + after + sourceCode.slice(colEnd);
        }
      }
    }
  }
}

module.exports = processSourceCode;