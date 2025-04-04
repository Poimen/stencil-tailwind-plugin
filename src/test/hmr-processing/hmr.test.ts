import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';
import { tailwindHMR } from '../../index';
import { transform } from '../../processors/typescript';
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
      const transform = (await plugin.transform(style.text, filePath));
      convertedCss = transform.code;
    }
    // Assert
    expect(convertedCss).toMatchSnapshot();
  });

  it('given style css with dependents should process @apply rules with dependents css attached', async () => {
    // Arrange
    let convertedCss: string | undefined;
    let deps: (string | undefined)[];
    const styleForHMR = loadTestComponent('hmr-processing', 'style.css');
    const depLoadedFile = loadTestComponent('hmr-processing', 'css-hmr-component-tailwind.tsx');

    await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(depLoadedFile.text, depLoadedFile.path);

    const filePath = styleForHMR.path.replace(/\\/g, '/');

    const plugin = tailwindHMR({ ...PluginConfigDefaults.DEFAULT, tailwindCssPath: 'src/test/configuration/tailwind.css' });

    // Act
    if (plugin.transform) {
      const transform = (await plugin.transform(styleForHMR.text, filePath));
      convertedCss = transform.code;
      deps = transform.dependencies ?? [];

      // Assert
      expect(convertedCss).toMatchSnapshot();
      expect(deps.length).toBe(2);
      expect(deps[0]).toContain('css-hmr-component-tailwind.tsx');
      expect(deps[1]).toContain('src/test/configuration/tailwind.css');
    } else {
      fail('should have a transform function');
    }
  });
});
