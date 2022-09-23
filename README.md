# stencil-tailwind-plugin

#
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/poimen/stencil-tailwind-plugin/main-build)
![npm](https://img.shields.io/npm/v/stencil-tailwind-plugin)

This package is used to integrate [tailwindcss](https://tailwindcss.com/) and [StencilJS](https://stenciljs.com/). This plugin for Stencil is specifically focused on the integration between tailwindcss v3.x and the Stencil build. While tailwindcss can be integrated into a Stencil build, this plugin aims to ease the integration, while providing an optimised inclusion of styles across the shadow DOM. For tailwind v2 support, please see the v0.6+ versions and branch.

This plugin also aims to allow users to make use of all the tailwindcss classes and postcss plugins like [@apply](https://tailwindcss.com/docs/functions-and-directives#apply). In such both styles of tailwindcss usage can be used in a single component. This plugin also aims to allow the use of object initialisers to conditionally set styles.

For an example of a basic Stencil integration, see the [example](https://github.com/Poimen/stencil-tailwind-plugin-example).

## Getting started

This guide assumes that a Stencil project has already been initialized and configured.

### Installation

Install the necessary dependencies:
```bash
npm install -D stencil-tailwind-plugin tailwindcss
```

### Configuration

In the Stencil configuration, consume the plugin:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';
import tailwind from 'stencil-tailwind-plugin';

export const config: Config = {
  plugins: [
    tailwind()
  ],
  devServer: {
    reloadStrategy: 'pageReload'
  }
};
```

In some configurations, the `reloadStrategy` can be left as `hmr` but on occasions new styles are not applied as expected. For more on HMR, see below.

There are also a number of options that can be given to the plugin:

| Property          | Description                                               | Default      |
| ----------------- | --------------------------------------------------------- | ------------ |
| `tailwindCssPath` | Path to a css file to read for tailwind css configuration. When not specified a default layers of @base, @utilities and @components are used. | `undefined`  |
| `tailwindCssContents` | Instead of providing the file path, the plugin accepts string details. If both are supplied, the file contents will be taken as the source of truth ignoring this configuration | `@tailwind base;@tailwind utilities;@tailwind components;`  |
| `tailwindConf` | Configuration object to be used for tailwind processing | The default set of tailwind options with `jit` enabled   |
| `stripComments` | Indicate if the comment headers should be stripped as well | `false`   |
| `minify` | Indicate if the css should be minified by using `cssnano` | `true`   |
| `useAutoPrefixer` | Indicate if the auto-prefixer should be used used `autoprefixer` | `true`   |
| `postcss` | Path to postcss configuration object or an object that contains the postcss configuration. If a `postcss` configuration is found in the default paths, it will be used. | `process.cwd()` |

The default options can be referenced from the plugin as well:
```ts
// stencil.config.ts
import tailwind, { PluginOpts } from 'stencil-tailwind-plugin';

const opts = Object.assign({}, PluginOpts.DEFAULT, { debug: false, stripComments: true });

export const config: Config = {
  // ...
  plugins: [
    tailwind(opts)
  ],
  // ...
};
```

### Postcss custom configuration

There are a number of `postcss` plugins that might be wanted when processing the tailwind output specifically. The nature of the stencil build makes it difficult to pass the custom css directly back into the css pipeline building. Hence, the `postcss` configuration can be completely overridden by specifying the `postcss` configuration path, or by creating a `postcss` configuration file.

The plugin uses the default `postcss-load-config` [package](https://github.com/postcss/postcss-load-config). Hence, any the configuration options can be used as a file. If a `postcss` configuration file exists in the `process.cwd()`, then that `postcss` configuration will be used over the built-in `postcss` configuration.

The `postcss` config option can be used to specify the path. If the configuration file is not found in that path, the plugin will quietly fall over to use the built-in configuration. If there are modules not found, these will be reported to the user.

As an example of a `postcss` configuration that could be used:
```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-sort-media-queries'),
    require('postcss-combine-duplicated-selectors'),
    require('cssnano')
  ]
};
```

or as a Stencil configuration:
```ts
// stencil.config.ts
import tailwind from 'stencil-tailwind-plugin';

export const config: Config = {
  // ...
  plugins: [
    tailwind({
      postcss: {
        plugins: [
          require('postcss-import'),
          require('tailwindcss'),
          require('autoprefixer'),
        ]
      }
    })
  ],
  // ...
};
```

If the `tailwindcss` plugin is not specified, it is assumed that the plugins should be run _before_ the default tailwind options. The `tailwindcss` plugin options will be overwritten by the tailwind configuration provided by the plugin, hence, the postcss `tailwindcss` is used as a marker for where `tailwindcss` should be used in the `postcss` chain of plugins.

### Configuration with other plugins

It is important to note that when using `sass` files, that the `sass` Stencil plugin appears before the tailwind plugin. The `sass` plugin needs to process the `sass` files first before the raw `css` is pasted to the tailwind postcss processor. An example configuration could look like:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import autoprefixer from 'autoprefixer';
import tailwind from 'stencil-tailwind-plugin';
import { inlineSvg } from 'stencil-inline-svg';
import tailwindConfig from './tailwind.config';

export const config: Config = {
  outputTargets: [ /* ... */],
  plugins: [
    inlineSvg(),
    sass({
      includePaths: [
        /* ... */
      ]
    }),
    tailwind({
      tailwindCssPath: './src/styles/tailwind.pcss',
      tailwindConf: tailwindConfig,
      postcss: {
        plugins: [
          autoprefixer()
        ]
      }
    }),
  ]
```

### HMR considerations

Stencil's compiler does support HMR, however, for inline styles produced by tailwind, another plugin is required in order for the correct dependencies to be mapped to the file watcher. The HMR plugin can be included by:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';
import tailwind, { tailwindHMR } from 'stencil-tailwind-plugin';

export const config: Config = {
  // ...
  plugins: [
    sass(),
    tailwind({
      tailwindConf,
      tailwindCssPath: './src/styles/tailwind.css'
    }),
    tailwindHMR()
  ]
};
```

The `tailwindHMR` plugin will register all the `tsx` files against the `css` files. This allows Stencil to watch for changes on those `tsx` files and update the `css` accordingly.

Unfortunately, as of `v2.12.0` of the compiler, this cannot be done as a single plugin and two plugins are required.

## Global styles with `@apply`

If you use a global style sheet, but want to use Tailwind styles in that sheet, there is another plugin that facilitates this. The global stylesheet plugin takes the same configuration options as the main plugin, but can be tailored with different options as desired. The global plugin can be used as:
```ts
import tailwind, { tailwindHMR, tailwindGlobal } from 'stencil-tailwind-plugin';

// ... other config
export const config: Config = {
  globalStyle: 'src/styles/global.scss',
  outputTargets: [
    // targets
  ],
  plugins: [
    sass(),
    // This takes the same configuration options as the main plugin. You can use different configurations if you want
    tailwindGlobal({
      tailwindCssPath: './src/styles/tailwind.pcss',
      tailwindConf: tailwindConfig,
      postcss: {
        plugins: [
          atImport(),
          tailwindcss(),
          autoprefixer()
        ]
      }
    }),
    tailwind({
      tailwindCssPath: './src/styles/tailwind.pcss',
      tailwindConf: tailwindConfig,
      postcss: {
        plugins: [
          atImport(),
          tailwindcss(),
          autoprefixer()
        ]
      }
    }),
    tailwindHMR()
  ]
};
```

## Usage

This plugin hooks into the build process for Stencil. The tailwind JIT process run as a secondary build set and as such the `css` classes are applied after the component has been transpiled.

For an example of a basic Stencil integration, see the [example](https://github.com/Poimen/stencil-tailwind-plugin-example).

### Using @apply is `css`/`sass` files

The tailwind `@apply` directive can be used in any css/sass file as per tailwind spec:
```css
.apply-styles {
  @apply text-red-100;
}
```

The `@apply` directive will be applied as expected:
```css
.apply-styles {
  --tw-text-opacity: 1;
  color: rgba(254, 226, 226, var(--tw-text-opacity));
}
```

### Using inline classes

Assuming a component declares a `render` function of:
```tsx
render() {
  return (
    <div class="text-red-100">
      This is a test
    </div>
  );
}
```

Inline classes will be added to the component style definition.

### Using conditional styles

Assuming a component declares a `render` function of:
```tsx
render() {
  const styles = {
    'text-red-100': true,
    'text-red-200': this.someCondition
  };
  return (
    <div class={styles}>
      This is a test
    </div>
  );
}
```

In this case, both `text-red-100` and `text-red-200` styles will be added to the components style definition.

### Using style urls

Assuming the component has declared:
```tsx
@Component({
  tag: 'component',
  styleUrls: {
    md: 'component.md.scss',
    ios: 'component.ios.css',
  },
  shadow: true,
})
```

In this case, all tailwind styles will be added to both `md` and `ios` style definitions.

## Caveat on Function Components (1)

There are some issues around functional components when they are located in external files to a component. The plugin attempts to insert the Function Component styles into the host component and in so doing, the Stencil HMR does not detect the changes correctly and *will* require a rebuild when this happens.

As an example, given:
```tsx
// component-A.tsx
import { FuncComp } from '../common/UtilsFunctionalComponents'

// rest of the normal component that uses <FuncComp />
```
And:
```tsx
// component-B.tsx
import { FuncComp } from '../common/UtilsFunctionalComponents'

// rest of the normal component that uses <FuncComp />
```
And:
```tsx
// common/UtilsFunctionalComponents.tsx
export const FuncComp: FunctionalComponent<FunctionalCompProps> = ({ name }) => (
  <h1 class="text-indigo-700">This is a functional one - Hello, {name}!</h1>
);
```

In this example, `component-A` and `component-B` will both contain the style definition for `text-indigo-700` because they both import `FuncComp`.

If `common/UtilsFunctionalComponents.tsx` is updated, neither `component-A.tsx` or `component-B.tsx` will be build by Stencil's HMR, hence the style class change from `FuncComp` will not reflect.

## Caveat on Function Components (2)

Functional components can be composed of other functional components. However, there is a known issue where the subsequent functional component (the component that is being used inside the functional component) will not generate any styles. The styles are only generated for the first level of functional components. This is due to the way the Stencil compiler handles stylesheets and functional component building.

## Caveat on base reset styles

This plugin does not include base tailwind reset styles as this would bloat all the components with base styles. If based reset styles are required, the best is to place them in the `:host` selector. The plugin keeps the `:host` selector for being purged.

## Peer Dependencies

This plugin requires the following peer dependencies:
  - tailwindcss
  - typescript

These are provided as peer dependencies so consumers can override the versions.

## Development

Clone the repo and install the dependencies:
```bash
npm install
```

Run tests:
```bash
npm run tests
```

## Honourable mentions

A lot of inspiration for this plugin was taken from the similarly named plugin, [stencil-tailwind](https://github.com/jrowlingson/stencil-tailwind) by *Jack Rowlingson*.

Inspiration also taken from [proto-stencil-tailwind](https://github.com/eswat2/proto-stencil-tailwind) that moves `stencil-tailwind` forward by *Richard Hess*.

Special thanks to the above.

## Other options

For other ways of integrating Tailwind into your project, [Anthony Giuliano](https://twitter.com/a__giuliano) wrote a blog post:

https://ionicframework.com/blog/how-to-integrate-tailwind-css-into-your-stencil-project/
