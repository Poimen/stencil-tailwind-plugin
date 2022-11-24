import { transform as transformTsx } from '../../processors/typescript';
import { transformCssFromTsxFileFormat as transformStyle } from '../../processors/stylesheets';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';

describe('conditional-styles-component', () => {
  it('given basic component with conditional tailwindcss styles, should output tailwind styles', async () => {
    // Arrange
    const conf = configurePluginOptions(PluginConfigDefaults.DEFAULT);
    const tsxFile = loadTestComponent('conditional-styles', 'conditional.tsx');
    const styleFile = loadTestComponent('conditional-styles', 'basic-component.css');
    // Act
    await transformTsx(conf)(tsxFile.text, tsxFile.path);
    const result = await transformStyle(conf)(styleFile.text, `${styleFile.path}?tag=basic-component&encapsulation=shadow`);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given class component with conditional tailwindcss styles, should output tailwind styles', async () => {
    // Arrange
    const conf = configurePluginOptions(PluginConfigDefaults.DEFAULT);
    const tsxFile = loadTestComponent('conditional-styles', 'conditional-class.tsx');
    const styleFile = loadTestComponent('conditional-styles', 'basic-component.css');
    // Act
    await transformTsx(conf)(tsxFile.text, tsxFile.path);
    const result = await transformStyle(conf)(styleFile.text, `${styleFile.path}?tag=basic-component&encapsulation=shadow`);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
