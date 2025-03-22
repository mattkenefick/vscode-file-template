import React from 'react';
import { use${filename:pascalcase} } from '../context';
import { ${filename:pascalcase}Type } from '../types';

interface ${filename:pascalcase}ContentProps {}

/**
 * Main content component for ${filename:pascalcase}
 */
export const ${filename:pascalcase}Content: React.FC<${filename:pascalcase}ContentProps> = () => {
  const { data, selectedItem, handleSelect } = use${filename:pascalcase}();

  if (data.length === 0) {
    return (
      <div className="${filename:kebabcase}-content ${filename:kebabcase}-content-empty">
        <p>No ${filename:lowercase} items available.</p>
        <button className="${filename:kebabcase}-button">
          Add ${filename:pascalcase} Item
        </button>
      </div>
    );
  }

  return (
    <div className="${filename:kebabcase}-content">
      <ul className="${filename:kebabcase}-list">
        {data.map((item: ${filename:pascalcase}Type) => (
          <li 
            key={item.id} 
            className={`${filename:kebabcase}-item ${selectedItem?.id === item.id ? '${filename:kebabcase}-item-selected' : ''}`}
            onClick={() => handleSelect(item)}
          >
            <div className="${filename:kebabcase}-item-header">
              <h3 className="${filename:kebabcase}-item-title">{item.title}</h3>
              <span className="${filename:kebabcase}-item-id">#{item.id}</span>
            </div>
            
            {item.description && (
              <p className="${filename:kebabcase}-item-description">{item.description}</p>
            )}
            
            {item.createdAt && (
              <div className="${filename:kebabcase}-item-meta">
                Created: {new Date(item.createdAt).toLocaleDateString()}
              </div>
            )}
          </li>
        ))}
      </ul>
      
      {selectedItem && (
        <div className="${filename:kebabcase}-detail">
          <h3>Selected: {selectedItem.title}</h3>
          <pre>{JSON.stringify(selectedItem, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};