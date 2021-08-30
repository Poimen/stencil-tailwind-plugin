const path = require('path');

const confPath = path.resolve(path.join('src', 'test', 'configuration', 'tailwind.config.js'));
// const confPath = './src/test/configuration/tailwind.config.js';

module.exports = {
  plugins: [
    require('postcss-import')({ path: path.join('src', 'test', 'configuration') }),
    require('tailwindcss')({ config: confPath }),
    require('autoprefixer'),
    require('postcss-sort-media-queries'),
    require('postcss-combine-duplicated-selectors'),
    require('cssnano')
  ]
};
