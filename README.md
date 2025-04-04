# stencil-tailwind-plugin

#
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/poimen/stencil-tailwind-plugin/main-build)
![npm](https://img.shields.io/npm/v/stencil-tailwind-plugin)

This package is used to integrate [tailwindcss](https://tailwindcss.com/) and [StencilJS](https://stenciljs.com/). The versions this package supports:
| Tailwind CSS Version | Package Version |
| -------------------- | --------------- |
| v4                   |   v2.x (main)   |
| v3                   |   v1.x          |
| v2                   |   v0.x          |

This plugin is aimed at using the CSS-based tailwind configuration. The setup of the plugin assumes the CSS configuration system is being used. Please refer to the Tailwind documentation on configuration options of Tailwind from CSS. See the [upgrade guide for details](#upgrade-guide-from-v1-to-v2).

For an example of a basic Stencil integration, see the [example](https://github.com/Poimen/stencil-tailwind-plugin-example).

## Getting started

This guide assumes that a Stencil project has already been initialized and configured.

### Installation

Install the necessary dependencies:
```bash
npm install -D stencil-tailwind-plugin tailwindcss @tailwindcss/postcss
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
| enableDebug       | Enables debugging                                         | `false`        |
| `tailwindCssPath` | Path to a css file to read for tailwind css configuration. When not specified a default `@import "tailwindcss";` is used | `undefined`  |
| `injectTailwindConfiguration` | Configuration object to be used for tailwind processing | `undefined`   |
| `stripComments` | Indicate if the comment headers should be stripped as well | `false`   |
| `minify` | Indicate if the css should be minified by Tailwind | `true`   |
| `optimise` | Indicate if the css should be optimised by Tailwind (css is not minified) *Note* if `optimise` and `minify` are set, configuration defaults to `minify` | `false`   |
| `postcssPath` | Path to postcss configuration object or an object that contains the postcss configuration. | `undefined` |

The default options can be referenced from the plugin as well:
```ts
// stencil.config.ts
import tailwind, { PluginOptions } from 'stencil-tailwind-plugin';

const options = {
  ...PluginOptions.DEFAULT,
  stripComments: true
};

export const config: Config = {
  // ...
  plugins: [
    tailwind(options)
  ],
  // ...
};
```

### Available Plugins

There are 3 plugin's available:
 - `tailwind` - the base tailwind style processor
 - `tailwindHMR` - the tailwind Hot Module Reloader
 - `tailwindGlobal` - handling global tailwind styles

### Default configuration

The plugin has a global option setter, which means configuration can be set globally instead of locally for each plugin type.

The configuration of the options can be done as such:
```ts
// stencil.config.ts
import tailwind, { setPluginConfigurationDefaults, tailwindGlobal, tailwindHMR } from 'stencil-tailwind-plugin';

const options = {
  stripComments: true
};

setPluginConfigurationDefaults(options);

export const config: Config = {
  // ...
  plugins: [
    tailwindGlobal(),
    tailwind(),
    tailwindHMR()
  ],
  // ...
};
```

All the plugins that are not provided configuration will receive the configuration from `setPluginConfigurationDefaults`. This does not preclude setting different options per plugin:
```ts
// stencil.config.ts
import tailwind, { setPluginConfigurationDefaults, tailwindGlobal, tailwindHMR } from 'stencil-tailwind-plugin';

const opts = {
  stripComments: true,
  minify: true
};

setPluginConfigurationDefaults(opts);

export const config: Config = {
  // ...
  plugins: [
    tailwindGlobal(),
    tailwind(),
    tailwindHMR({
      ...opts,
      minify: false
    })
  ],
  // ...
};
```

### Configuration per file

There can be situations whereby a Tailwind configuration needs to be applied to a specific file/component. This can be accomplished by providing a configuration function rather than a configuration object. In the examples above and object is used, but in this scenario we will configure the plugin with a function:
```ts
// stencil.config.ts
import tailwind, { TailwindConfig } from 'stencil-tailwind-plugin';

const twConfigurationFn = (filename: string) => {
  if (filename.includes('the-chosen-one.tsx')) {
    return '@import "friendly-font-face"; @import "taiwindcss";';
  }
  return '@import "tailwindcss"';
};

const opts = {
  injectTailwindConfiguration: twConfigurationFn
};

export const config: Config = {
  // ...
  plugins: [
    tailwind(opts)
  ],
  // ...
};
```

In the above code `injectTailwindConfiguration` is given a callback function to be able to return the Tailwind configuration CSS that'll be used for the file. The argument `filename` is the full path to the component that will be processed by Tailwind processor.

### Note on callback from plugin

The file being processed will be the raw file for StencilJS compiler. This means the `filename` will contain query parameters as well:
```
some-component.scss?tag=some-component
```

The example about merely checks the `includes` option as this negates the use of tags by StencilJS.

If there are multiple distributions enabled in the StencilJS configuration, then the configuration function will be called multiple times. StencilJS handles each distribution output separately so each time a file is processed per distribution the configuration is required for that distribution. Presently there is no indication of which distribution Stencil is processing so configuration per file per distribution output is not possible.

### Postcss custom configuration

There are a number of `postcss` plugins that might be wanted when processing the tailwind output specifically. The nature of the stencil build makes it difficult to pass the custom css directly back into the css pipeline building. Hence, the `postcss` configuration can be completely overridden by specifying the `postcss` configuration path, or by creating a `postcss` configuration file.

The plugin uses the default `postcss-load-config` [package](https://github.com/postcss/postcss-load-config). Hence, any the configuration options can be used as a file.

The `postcssPath` config option can be used to specify the path. If the configuration file is not found in that path, the plugin will quietly fall over to use the built-in configuration. If there are modules not found, these will be reported to the user.

As an example of a `postcss` configuration that could be used:
```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('postcss-sort-media-queries'),
    require('postcss-combine-duplicated-selectors'),
    require('cssnano')
  ]
};
```

If the `tailwindcss` plugin is not specified, it is assumed that the plugins should be run _before_ the default tailwind options. The `tailwindcss` plugin options will be overwritten by the tailwind configuration provided by the plugin, hence, the postcss `tailwindcss` is used as a marker for where `tailwindcss` should be used in the `postcss` chain of plugins.

### Configuration with other plugins

It is important to note that when using `sass` files, that the `sass` Stencil plugin appears before the tailwind plugin. The `sass` plugin needs to process the `sass` files first before the raw `css` is pasted to the tailwind postcss processor. An example configuration could look like:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import tailwind from 'stencil-tailwind-plugin';
import { inlineSvg } from 'stencil-inline-svg';

export const config: Config = {
  outputTargets: [ /* ... */],
  plugins: [
    inlineSvg(),
    sass({
      includePaths: [
        /* ... */
      ]
    }),
    tailwind(),
  ]
```

### HMR considerations

Stencil's compiler does support HMR, however, for inline styles produced by tailwind, another plugin is required in order for the correct dependencies to be mapped to the file watcher. The HMR plugin can be included by:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';
import tailwind, { tailwindHMR } from 'stencil-tailwind-plugin';
import tailwindConfig from './tailwind.config';

export const config: Config = {
  // ...
  plugins: [
    sass(),
    tailwind(),
    tailwindHMR(),
  ],
};
```

The `tailwindHMR` plugin will register all the `tsx` files against the `css` files. This allows Stencil to watch for changes on those `tsx` files and update the `css` accordingly.

The HMR ability of Stencil and Web Components makes changes difficult, and generally a page reload is required.

Unfortunately, as of `v2.12.0` of the Stencil compiler, this cannot be done as a single plugin and two plugins are required.

## Global styles with `@apply`

With the new CSS based configuration, usage of `@apply` is discouraged by the Tailwind community.

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

## Peer Dependencies

This plugin requires the following peer dependencies:
  - @tailwindcss/postcss
  - tailwindcss
  - typescript

These are provided as peer dependencies so consumers can override the versions.

## Development

Clone the repo and install the dependencies:
```bash
pnpm install
```

Run tests:
```bash
pnpm tests
```

## Honourable mentions

A lot of inspiration for this plugin was taken from the similarly named plugin, [stencil-tailwind](https://github.com/jrowlingson/stencil-tailwind) by *Jack Rowlingson*.

Inspiration also taken from [proto-stencil-tailwind](https://github.com/eswat2/proto-stencil-tailwind) that moves `stencil-tailwind` forward by *Richard Hess*.

Special thanks to the above.

## Other options

For other ways of integrating Tailwind into your project, [Anthony Giuliano](https://twitter.com/a__giuliano) wrote a blog post:

https://ionicframework.com/blog/how-to-integrate-tailwind-css-into-your-stencil-project/


## Upgrade Guide from v1 to v2

### Package installs

`v2` uses the postcss plugin for tailwind more directly than `v1`. Install the `@tailwindcss/postcss`:
```
npm install -D @tailwindcss/postcss
```

### Configuration changes

The configuration structure has changed for the new Tailwind v4 configuration in CSS.

#### Deprecated options
 - `tailwindCssContents` (see injectTailwindConfiguration)
 - `tailwindConf` (see injectTailwindConfiguration)
 - `useAutoPrefixer` (default Tailwind uses autoprefixer internally)
 - `postcss` (see postcssPath)

#### New options
 - `injectTailwindConfiguration` - returns the configuration CSS for tailwind
 - `postcssPath` - set to the path of the `postcssrc` file
 - `optimise` - passed to Tailwind to optimise the output without minification. See Tailwind documentation.

### Type changes

There are numerous type renames. The generally exposed versions are:
 - `PluginConfigOptsDefaults` renamed to `PluginConfigOptionsDefaults`
 - `PluginConfigOpts` renamed to `PluginConfigurationOptions`

### Option Default Updates
 - `PluginOpts` renamed to `PluginOptions`
