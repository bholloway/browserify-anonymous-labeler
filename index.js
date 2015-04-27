'use strict';

var through = require('through2');

var processSourceCode = require('./lib/process-source-code');

/**
 * A browserify plugin that anonymises filename labels in the browser-pack.
 * Presumes well formed source maps with a separate source-map mapping for each require() operand.
 * @param {object} bundler The browserify bundler instance
 * @param {object} opt An options hash
 */
function browserifyAnonymousLabeler(bundler, opt) {
  var isValid = bundler && (typeof bundler === 'object') &&
    (typeof bundler.on === 'function') && (typeof bundler.pipeline === 'object');
  if (isValid) {
    bundler.pipeline
      .get('label')
      .push(anonymousLabeler());
  }
  else {
    throw new Error('Expected a browserify bundler instance')
  }
}

module.exports = browserifyAnonymousLabeler;

/**
 * A pipeline labeler that ensures that final file names are anonymous in the final output
 * @returns {stream.Through} A through stream for the labelling stage
 */
function anonymousLabeler() {
  function transform(row, encoding, done) {
    /* jshint validthis:true */
    var replacements = Object.keys(row.deps).reduce(eachDepKey, {});
    row.source = processSourceCode(row.source, replacements);
    this.push(row);
    done();

    /**
     * Process each filename key in the <code>row.deps</code> hash and replace it with the value index.
     * @param {object} replacements A cumulative hash of replacements
     * @param {string} filename A key in the row.deps hash
     */
    function eachDepKey(replacements, filename) {
      var value  = row.deps[filename];  // value will be an index
      var newKey = String(value);       // use this index as the new key
      row.deps[newKey] = value;
      delete row.deps[filename];
      replacements[filename] = newKey;
      return replacements;
    }
  }

  return through.obj(transform);
}