import { tailwindGlobal } from '../../index';
import { loadTestComponent } from '../utils';
import { PluginConfigDefaults } from '../../config/pluginConfiguration';
import { PluginCtx, PluginTransformResults } from '@stencil/core/internal';

describe('global-style', () => {
  it('given global style url should process tailwind styles', async () => {
    // Arrange
    let convertedCss: string | undefined;
    const style = loadTestComponent('global-style', 'global.css');
    const filePath = style.path.replace(/\\/g, '/');

    const plugin = tailwindGlobal(PluginConfigDefaults.DEFAULT);
    // Act
    if (plugin.transform) {
      const transform = (await plugin.transform(style.text, filePath, { config: { globalStyle: filePath } } as PluginCtx)) as PluginTransformResults;
      convertedCss = transform.code;
    }
    // Assert
    expect(convertedCss).toMatchSnapshot();
  });

  it('given no global styles, should ignore styles', async () => {
    // Arrange
    let convertedCss: string | undefined;
    const style = loadTestComponent('global-style', 'global.css');
    const filePath = style.path.replace(/\\/g, '/');

    const plugin = tailwindGlobal(PluginConfigDefaults.DEFAULT);
    // Act
    if (plugin.transform) {
      const transform = (await plugin.transform(style.text, filePath, { config: { } } as PluginCtx)) as PluginTransformResults;
      convertedCss = transform.code;
    }
    // Assert
    expect(convertedCss).toMatchSnapshot();
  });

  it('given sass global style should process tailwind styles', async () => {
    // Arrange
    let convertedCss: string | undefined;
    const style = loadTestComponent('global-style', 'global.css');
    const filePath = style.path.replace(/\\/g, '/');

    const plugin = tailwindGlobal(PluginConfigDefaults.DEFAULT);
    // Act
    if (plugin.transform) {
      const transform = (await plugin.transform(style.text, filePath, { config: { globalStyle: filePath.replace('.css', '.sass') } } as PluginCtx)) as PluginTransformResults;
      convertedCss = transform.code;
    }
    // Assert
    expect(convertedCss).toMatchSnapshot();
  });

  it('given scss global style should process tailwind styles', async () => {
    // Arrange
    let convertedCss: string | undefined;
    const style = loadTestComponent('global-style', 'global.css');
    const filePath = style.path.replace(/\\/g, '/');

    const plugin = tailwindGlobal(PluginConfigDefaults.DEFAULT);
    // Act
    if (plugin.transform) {
      const transform = (await plugin.transform(style.text, filePath, { config: { globalStyle: filePath.replace('.css', '.scss') } } as PluginCtx)) as PluginTransformResults;
      convertedCss = transform.code;
    }
    // Assert
    expect(convertedCss).toMatchSnapshot();
  });
});
