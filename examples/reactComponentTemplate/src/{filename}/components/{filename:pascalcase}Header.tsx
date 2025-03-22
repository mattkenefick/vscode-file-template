import React from 'react';
import { use${filename:pascalcase} } from '../context';
import { ${filename:pascalcase}SortOption } from '../types';

interface ${filename:pascalcase}HeaderProps {
  title?: string;
}

/**
 * Header component for ${filename:pascalcase}
 */
export const ${filename:pascalcase}Header: React.FC<${filename:pascalcase}HeaderProps> = ({ 
  title = '${filename:pascalcase} Component' 
}) => {
  const { data } = use${filename:pascalcase}();
  const [sortOption, setSortOption] = React.useState<${filename:pascalcase}SortOption>(
    ${filename:pascalcase}SortOption.TITLE_ASC
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value as ${filename:pascalcase}SortOption);
  };

  return (
    <header className="${filename:kebabcase}-header">
      <div className="${filename:kebabcase}-header-top">
        <h2 className="${filename:kebabcase}-title">{title}</h2>
        <span className="${filename:kebabcase}-count">{data.length} items</span>
      </div>
      
      <div className="${filename:kebabcase}-controls">
        <div className="${filename:kebabcase}-search">
          <input 
            type="text" 
            placeholder="Search..." 
            className="${filename:kebabcase}-search-input"
            aria-label="Search ${filename:lowercase} items"
          />
        </div>
        
        <div className="${filename:kebabcase}-sort">
          <label htmlFor="${filename:kebabcase}-sort-select">Sort by:</label>
          <select 
            id="${filename:kebabcase}-sort-select"
            value={sortOption}
            onChange={handleSortChange}
            className="${filename:kebabcase}-sort-select"
          >
            <option value={${filename:pascalcase}SortOption.TITLE_ASC}>Title (A-Z)</option>
            <option value={${filename:pascalcase}SortOption.TITLE_DESC}>Title (Z-A)</option>
            <option value={${filename:pascalcase}SortOption.CREATED_ASC}>Oldest first</option>
            <option value={${filename:pascalcase}SortOption.CREATED_DESC}>Newest first</option>
          </select>
        </div>
      </div>
    </header>
  );
};