/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(),
    require('postcss-sort-media-queries'),
    require('postcss-combine-duplicated-selectors'),
    require('cssnano'),
  ],
};
