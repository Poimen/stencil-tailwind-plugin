import { transform } from '../../processors/typescript';
import { loadTestComponent } from '../utils';
import * as conf from '../../config/pluginConfiguration';

describe('conditional-styles-component', () => {
  beforeEach(() => {
    conf.configurePluginOptions(conf.PluginConfigOpts.DEFAULT);
  });

  it('given basic component with conditional tailwindcss styles, should output tailwind styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('conditional-styles', 'conditional.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given class component with conditional tailwindcss styles, should output tailwind styles', async () => {
    // Arrange
    const loadedFile = loadTestComponent('conditional-styles', 'conditional-class.tsx');
    // Act
    const result = await transform(loadedFile.text, loadedFile.path);
    // Assert
    expect(result).toMatchSnapshot();
  });
});
