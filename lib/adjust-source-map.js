'use strict';

var sourceMap = require('source-map');

/**
 * Create a new source map based on adjusted (split) source code.
 * @param {object|null} map A source-map object
 * @param {function} getColumnAfter A method that will return an amended column for a given line and column
 * @returns {object|null} A new source-map object or null on degenerate map given
 */
function adjustSourceMap(map, getColumnAfter) {
  if (map) {
    var consumer  = new sourceMap.SourceMapConsumer(map);
    var generator = new sourceMap.SourceMapGenerator({
      file      : consumer.file,
      sourceRoot: consumer.sourceRoot
    });
    consumer.eachMapping(copyAndOffsetMapping);
    consumer.sources.forEach(copySourceContent);
    return generator.toJSON();
  } else {
    return null;
  }

  /**
   * Set the generator <code>sourceContent</code> for the given filename.
   * @param {string} filename The name of the file to set content for
   */
  function copySourceContent(filename) {
    var content = consumer.sourceContentFor(filename);
    if (content) {
      generator.setSourceContent(filename, content);
    }
  }

  /**
   * Copy the given mapping but offset as indicated by the split source code.
   * @param {object} existingMapping An existing source-map mapping from a source-map consumer
   */
  function copyAndOffsetMapping(existingMapping) {
    var column     = getColumnAfter(existingMapping.generatedLine - 1, existingMapping.generatedColumn);
    var newMapping = {
      generated: {
        line  : existingMapping.generatedLine,
        column: column
      }
    };
    if (existingMapping.source) {
      newMapping.source   = existingMapping.source;
      newMapping.original = {
        line  : existingMapping.originalLine,
        column: existingMapping.originalColumn
      };
      if (existingMapping.name) {
        newMapping.name = existingMapping.name;
      }
    }
    generator.addMapping(newMapping);
  }
}

module.exports = adjustSourceMap;