import { transform } from '../../processors/stylesheets';
import { loadTestComponent } from '../utils';
import * as conf from '../../config/pluginConfiguration';

describe('style-component', () => {
  beforeEach(() => {
    conf.configurePluginOptions(conf.PluginConfigDefaults.DEFAULT);
  });

  it('given style component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('style-component', 'style-component.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given style component with no tailwindcss styles, should output unaltered styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('style-component', 'style-component-tailwind.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
