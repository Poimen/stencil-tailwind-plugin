# stencil-tailwind-plugin

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/poimen/stencil-tailwind-plugin/main-build)
![npm](https://img.shields.io/npm/v/stencil-tailwind-plugin)

This package is used to integrate [tailwindcss](https://tailwindcss.com/) and [StencilJS](https://stenciljs.com/). This plugin for Stencil is specifically focused on the integration between tailwindcss in [JIT](https://tailwindcss.com/docs/just-in-time-mode#enabling-jit-mode) mode and the Stencil build. While tailwindcss can be integrated into a Stencil build, this plugin aims to ease the integration, while providing an optimised inclusion of styles across the shadow DOM.

This plugin also aims to allow users to make use of all the tailwindcss classes and postcss plugins like [@apply](https://tailwindcss.com/docs/functions-and-directives#apply). In such both styles of tailwindcss usage can be used in a single component. This plugin also aims to allow the use of object initialisers to conditionally set styles.

For an example of a basic Stencil integration, see the [example](https://github.com/Poimen/stencil-tailwind-plugin-example).

## Getting started

This guide assumes that a Stencil project has already been initialized and configured.

### Installation

Install the necessary dependencies:
```bash
npm install -D stencil-tailwind-plugin
```

Tailwind is provided by a peer dependency so tailwind can be installed separately as well, if required.

For lower versions of npm (below v7) and yarn, peer dependencies are not automatically installed, so install the dependencies:
```bash
npm install -D tailwindcss typescript
```

### Configuration

In the Stencil configuration, consume the plugin:
```ts
// stencil.config.ts
import { Config } from '@stencil/core'
import tailwind from 'proto-stencil-tailwind'

export const config: Config = {
  plugins: [
    tailwind()
  ],
  devServer: {
    reloadStrategy: 'pageReload'
  }
};
```

In some configurations, the `reloadStrategy` can be left as `hmr` but on occasions new styles are not applied as expected.

There are also a number of options that can be given to the plugin:

| Property          | Description                                               | Default      |
| ----------------- | --------------------------------------------------------- | ------------ |
| `tailwindCssPath` | Path to a css file to read for tailwind css configuration. When not specified a default layers of @base, @utilities and @components are used. | `undefined`  |
| `tailwindCssContents` | Instead of providing the file path, the plugin accepts string details. If both are supplied, the file contents will be taken as teh source of truth ignoring this configuration | `@tailwind base;@tailwind utilities;@tailwind components;`  |
| `tailwindConf` | Configuration object to be used for tailwind processing | The default set of tailwind options with `jit` enabled   |
| `stripComments` | Indicate if the comment headers should be stripped as well | `false`   |
| `minify` | Indicate if the css should be minified by using `cssnano` | `true`   |
| `enablePurge` | Indicate if the css should be purged using `purgecss`. In some cases the purging may introduce loss of class so the plugin add the ability to customise the purge process or disable it altogether | `true`   |
| `purgeSafeList` | Set the `purgecss` safelist of selectors to consider | Web component pseudo styles (`:root`/`:host`/etc.)    |
| `purgeExtractor` | Default extractor function to use. See `purgecss` documentation when using this | A default purge selector regex generator function    |
| `atImportConf` | Configuration object to be used for `postcss-import` when using import functions in css file passed to tailwind | An empty object |
| `autoprefixerOptions` | Configuration object to be used for `autoprefixer` postcss plugin | An empty object |

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

### Configuration with other plugins

It is important to note that when using `sass` files, that the `sass` Stencil plugin appears before the tailwind plugin. The `sass` plugin needs to process the `sass` files first before the raw `css` is pasted to the tailwind postcss processor. An example configuration could look like:
```ts
// stencil.config.ts
import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import { postcss } from '@stencil/postcss';
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
      tailwindConf: tailwindConfig
    }),
    postcss({
      plugins: [
        autoprefixer()
      ]
    })
  ]
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

## Caveat on Function Components

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
