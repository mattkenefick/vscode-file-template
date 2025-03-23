import React from 'react';
import { ${filename:pascalcase}Header } from './components/${filename:pascalcase}Header';
import { ${filename:pascalcase}Content } from './components/${filename:pascalcase}Content';
import { ${filename:pascalcase}Footer } from './components/${filename:pascalcase}Footer';
import { ${filename:pascalcase}Provider } from './context';
import { ${filename:pascalcase}Type } from './types';
import './styles/${filename:kebabcase}.css';

/**
 * Compound ${filename:pascalcase} Component
 *
 * This is an example of a more complex component that uses the compound component pattern.
 * It demonstrates how to create a folder structure for a single logical component.
 *
 * @created ${date:YYYY-MM-DD}
 * @author ${env:USER}
 * @id ${uuid}
 */
interface ${filename:pascalcase}Props {
  /** The title of the component */
  title?: string;
  /** Optional CSS class name */
  className?: string;
  /** The data to display */
  data?: ${filename:pascalcase}Type[];
  /** Called when an item is selected */
  onSelect?: (item: ${filename:pascalcase}Type) => void;
}

/**
 * Main ${filename:pascalcase} component that coordinates the sub-components
 */
const ${filename:pascalcase}: React.FC<${filename:pascalcase}Props> & {
  Header: typeof ${filename:pascalcase}Header;
  Content: typeof ${filename:pascalcase}Content;
  Footer: typeof ${filename:pascalcase}Footer;
} = ({
  title = '${filename:pascalcase} Component',
  className = '',
  data = [],
  onSelect
}) => {
  return (
    <${filename:pascalcase}Provider data={data} onSelect={onSelect}>
      <div className={`${filename:kebabcase}-container ${className}`}>
        <${filename:pascalcase}.Header title={title} />
        <${filename:pascalcase}.Content />
        <${filename:pascalcase}.Footer />
      </div>
    </${filename:pascalcase}Provider>
  );
};

// Attach sub-components
${filename:pascalcase}.Header = ${filename:pascalcase}Header;
${filename:pascalcase}.Content = ${filename:pascalcase}Content;
${filename:pascalcase}.Footer = ${filename:pascalcase}Footer;

export { ${filename:pascalcase} };
export default ${filename:pascalcase};
