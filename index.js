'use strict';

var through = require('through2'),
    convert = require('convert-source-map');

var processDeps     = require('./lib/process-dep-key'),
    sourceReplacer  = require('./lib/source-replacer'),
    adjustSourceMap = require('./lib/adjust-source-map');

/**
 * A browserify plugin that anonymises filename labels in the browser-pack.
 * Presumes well formed source maps with a separate source-map mapping for each require() operand.
 * @param {object} bundler The browserify bundler instance
 */
function browserifyAnonymousLabeler(bundler) {
  var isValid = bundler && (typeof bundler === 'object') &&
    (typeof bundler.on === 'function') && (typeof bundler.pipeline === 'object');
  if (isValid) {
    bundler.pipeline
      .get('label')
      .push(anonymousLabeler());
  }
  else {
    throw new Error('Expected a browserify bundler instance');
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

    // check for an existing source map
    var converter   = convert.fromSource(row.source);
    var originalMap = converter && converter.toObject();

    // make replacements
    var changes  = processDeps(row.deps);
    var replacer = sourceReplacer(convert.removeComments(row.source), changes);

    // adjust the original source map
    var finalMap   = adjustSourceMap(originalMap, replacer.getColumnAfter);
    var mapComment = finalMap ? convert.fromObject(finalMap).toComment() : '';

    // set the replaced string and its source map comment
    row.source = replacer.toStringAfter() + mapComment;

    // complete
    this.push(row);
    done();
  }

  return through.obj(transform);
}