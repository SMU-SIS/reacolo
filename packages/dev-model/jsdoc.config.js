module.exports = {
  plugins: ['plugins/markdown'],
  recurseDepth: 10,
  source: {
    include: ['src', 'package.json', 'README.md'],
  },
  templates: {
    cleverLinks: true,
  },
  opts: {
    destination: './docs/',
    template: '../../node_modules/minami',
    encoding: 'utf8',
    recurse: true,
    private: false,
  },
};
