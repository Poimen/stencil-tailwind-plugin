import { PluginCtx, PluginTransformResults } from '@stencil/core/internal';
import { PluginConfigDefaults } from '../../config/pluginConfiguration';
import { tailwindHMR } from '../../index';
import { loadTestComponent } from '../utils';

describe('hmr', () => {
  it('given style css should process @apply rules', async () => {
    // Arrange
    let convertedCss: string | undefined;
    const style = loadTestComponent('hmr-processing', 'style.css');
    const filePath = style.path.replace(/\\/g, '/');

    const plugin = tailwindHMR(PluginConfigDefaults.DEFAULT);
    // Act
    if (plugin.transform) {
      const transform = (await plugin.transform(style.text, filePath, { } as PluginCtx)) as PluginTransformResults;
      convertedCss = transform.code;
      console.log(transform);
    }
    // Assert
    expect(convertedCss).toMatchSnapshot();
  });
});
