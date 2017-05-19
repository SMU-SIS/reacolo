var pegjs = require('pegjs');

module.exports = {
  process(src, filename, config, options) {
    var source = pegjs.generate(src, Object.assign({}, options, { output: 'source' }));
    return 'module.exports=' + source;
  },
};
