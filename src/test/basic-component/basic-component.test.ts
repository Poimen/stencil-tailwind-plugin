import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';

describe('basic-component', () => {
  it('given basic component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given basic component with tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('basic-component', 'basic-component-tailwind.tsx');
    // Act
    const result = await transform(configurePluginOptions(PluginConfigDefaults.DEFAULT))(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
