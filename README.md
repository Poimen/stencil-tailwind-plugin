# stencil-tailwind-plugin

This package is used to integrate [tailwindcss](https://tailwindcss.com/) and [StencilJS](https://stenciljs.com/). This plugin for Stencil is specifically focused on the integration between tailwindcss in [JIT](https://tailwindcss.com/docs/just-in-time-mode#enabling-jit-mode) mode and the Stencil build. While tailwindcss can be integrated into a Stencil build, this plugin aims to ease the integration, while providing an optimised inclusion of styles across the shadow DOM.

This plugin also aims to allow users to make use of all the tailwindcss classes and postcss plugins like [@apply](https://tailwindcss.com/docs/functions-and-directives#apply). In such both styles of tailwindcss usage can be used in a single component. This plugin also aims to allow the use of object initialisers to conditionally set styles.

## Getting started

This guide assumes that a Stencil project has already been initialized and configured.

### Installation

Install the necessary dependencies:
```bash
npm install -D stencil-tailwind-plugin
```

Tailwind is provided by a peer dependency so Tailwind can be installed separately as well:
```bash
npm install -D tailwindcss
```

### Configuration

In the Stencil configuration, consume the plugin:
```ts
import { Config } from '@stencil/core'
import tailwind from 'proto-stencil-tailwind'

export const config: Config = {
  plugins: [
    tailwind()
  ],
  devServer: {
    reloadStrategy: 'pageReload'
  }
}
```

In some configurations, the `reloadStrategy` can be left as `hmr` but on occasions new styles are not applied as expected.

There are also a number of options that can be given to the plugin:
```ts
plugins: [
    tailwind({
      debug: false,         // Enable debug logging
      tailwindConf: ...,    // A tailwind configuration object that should be used
                            // It is expected that mode: 'jit' is set
      tailwindCssPath: ...  // A custom path to provide tailwind jit css configuration to use
    })
  ],
```

## Usage

This plugin hooks into the build process for Stencil. The Tailwind JIT process run as a secondary build set and as such the css classes are applied after the component has been transpiled.

### Using @apply is css/sass files

The Tailwind `@apply` directive can be used in any css/sass file as per Tailwind spec:
```css
.apply-styles {
  @apply text-red-100;
}
```

The `@apply` directive will be applied as expected:
```css
.apply-styles {
  --tw-text-opacity: 1;
  color:rgba(254, 226, 226, var(--tw-text-opacity));
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
    'text-red-200: someCondition
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

In this case, all Tailwind styles will be added to both `md` and `ios` style definitions.

## Caveat on Function Components

There are some issues around functional components when they are located in external files to a component. The plugin attempts to insert the Function Component styles into the host component and in so doing, the Stencil HMR does not detect the changes correctly and *will* require a rebuild when this happens.

## Development

Clone the repo and install the dependencies:
```bash
npm install
```

Run tests:
```bash
npm run tests
```

##

## Honourable mentions

A lot of inspiration for this plugin was taken from the similarly named plugin, [stencil-tailwind](https://github.com/jrowlingson/stencil-tailwind) by *Jack Rowlingson*.

Inspiration also taken from [proto-stencil-tailwind](https://github.com/eswat2/proto-stencil-tailwind) that moves `stencil-tailwind` forward by *Richard Hess*.

Special thanks to the above.
