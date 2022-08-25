import { transform as transformTsx } from '../../processors/typescript';
import { transform as transformStyle } from '../../processors/stylesheets';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';

describe('styles-url-component', () => {
  it('given component that uses style urls, should output tailwind styles for each mode', async () => {
    // Arrange
    const conf = configurePluginOptions(PluginConfigDefaults.DEFAULT);
    const tsxFile = loadTestComponent('styles-url-component', 'mode-component.tsx');
    const iosFile = loadTestComponent('styles-url-component', 'mode-component.ios.css');
    const mdFile = loadTestComponent('styles-url-component', 'mode-component.md.scss');
    // Act
    await transformTsx(conf)(tsxFile.text, tsxFile.path);
    const iosStyleResult = await transformStyle(conf)(iosFile.text, `${iosFile.path}?tag=mode-component&mode=ios&encapsulation=shadow`);
    const mdStyleResult = await transformStyle(conf)(mdFile.text, `${mdFile.path}?tag=mode-component&mode=md&encapsulation=shadow`);
    // Assert
    expect(iosStyleResult).toMatchSnapshot();
    expect(mdStyleResult).toMatchSnapshot();
  });
});
