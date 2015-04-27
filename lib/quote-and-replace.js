/**
 * Create a method that makes replacements in text as determined by a hash.
 * @param {object} replacements A hash of replacement text keyed by original text
 * @returns {function} A method that makes the replacement and returns amended text
 */
function quoteAndReplace(replacements) {
  var keys       = Object.keys(replacements);
  var beforeList = keys
    .map(quote);
  var afterList  = keys
    .map(function resolveAndQuoteKey(key) {
      return replacements[key];
    })
    .map(quote);
  return function replace(candidate) {
    var index  = beforeList.indexOf(candidate);
    return (index in afterList) ? afterList[index] : null;
  };
}

module.exports = quoteAndReplace;

/**
 * Return the given text surrounded by double quotation.
 * @param {string} candidate The text to quote
 * @returns {string} Quoted text
 */
function quote(candidate) {
  return '"' + candidate + '"';
}