import { transform as transformTypescript } from '../../processors/typescript';
import { transformCssFromTsxFileFormat as transformStylesheet } from '../../processors/stylesheets';
import { loadTestComponent } from '../utils';
import { configurePluginOptions, PluginConfigDefaults } from '../../config/pluginConfiguration';
import { getAllExternalCssDependencies } from '../../store/store';

describe('functional-component', () => {
  it('given functional class component in imported file to component, should output tailwind styles from functional import and component', async () => {
    // Arrange
    const conf = configurePluginOptions(PluginConfigDefaults.DEFAULT);
    const component = loadTestComponent('functional-component', 'externally-included-functional-component.tsx');
    const fcComponents = loadTestComponent('functional-component', 'FunctionalComponent.tsx');
    const componentStyles = loadTestComponent('functional-component', 'basic-component.css');

    // Stencil loads components, then FCs, then styles. We add FC styles to final component styles as this is the last usable point to inject them without
    // inspecting imported files for tailwind classes
    await transformTypescript(conf)(component.text, component.path);
    await transformTypescript(conf)(fcComponents.text, fcComponents.path);
    // Act
    const result = await transformStylesheet(conf)(componentStyles.text, `${componentStyles.path}?tag=basic-component&encapsulation=shadow`);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given functional class component in imported file to component and stripped comment, should remove output comments', async () => {
    // Arrange
    const conf = configurePluginOptions(PluginConfigDefaults.DEFAULT);
    const component = loadTestComponent('functional-component', 'externally-included-functional-component.tsx');
    const fcComponents = loadTestComponent('functional-component', 'FunctionalComponent.tsx');
    const componentStyles = loadTestComponent('functional-component', 'basic-component.css');

    configurePluginOptions(Object.assign({}, PluginConfigDefaults.DEFAULT, { stripComments: true }));

    // Stencil loads components, then FCs, then styles. We add FC styles to final component styles as this is the last usable point to inject them without
    // inspecting imported files for tailwind classes
    await transformTypescript(conf)(component.text, component.path);
    await transformTypescript(conf)(fcComponents.text, fcComponents.path);
    // Act
    const result = await transformStylesheet(conf)(componentStyles.text, `${componentStyles.path}?tag=basic-component&encapsulation=shadow`);
    // Assert
    expect(result).toMatchSnapshot();
  });

  it('given style component, should store final css against file', async () => {
    // Arrange
    const conf = configurePluginOptions(PluginConfigDefaults.DEFAULT);
    const component = loadTestComponent('functional-component', 'externally-included-functional-component.tsx');
    const fcComponents = loadTestComponent('functional-component', 'FunctionalComponent.tsx');
    const componentStyles = loadTestComponent('functional-component', 'basic-component.css');

    configurePluginOptions(Object.assign({}, PluginConfigDefaults.DEFAULT, { stripComments: true }));

    // Stencil loads components, then FCs, then styles. We add FC styles to final component styles as this is the last usable point to inject them without
    // inspecting imported files for tailwind classes
    await transformTypescript(conf)(component.text, component.path);
    await transformTypescript(conf)(fcComponents.text, fcComponents.path);
    // Act
    await transformStylesheet(conf)(componentStyles.text, `${componentStyles.path}?tag=basic-component&encapsulation=shadow`);
    const result = getAllExternalCssDependencies(`${componentStyles.path}?tag=basic-component&encapsulation=shadow`);
    // Assert
    expect(result.css).toMatchSnapshot();
    expect(result.dependencies[0]).toContain('FunctionalComponent.tsx');
  });
});
