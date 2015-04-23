'use strict';

var through = require('through2');

/**
 * A browserify plugin that anonymises filename labels in the browser-pack.
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
    Object.keys(row.deps)
      .forEach(function eachDep(key) {
        var value = row.deps[key];
        row.deps[String(value)] = value;
        row.source = row.source
          .split(key)
          .join(value);
        delete row.deps[key];
      });
    this.push(row);
    done();
  }

  return through.obj(transform);
}