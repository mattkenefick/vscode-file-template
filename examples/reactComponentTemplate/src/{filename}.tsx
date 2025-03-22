import React, { useState, useEffect } from 'react';
import './{filename}.css';

/**
 * ${filename:pascalcase} Component
 * 
 * @description A component for displaying and interacting with ${filename:lowercase} data.
 * @created ${date:YYYY-MM-DD}
 * @author ${env:USER}
 */
interface ${filename:pascalcase}Props {
  /** Unique identifier for this component */
  id?: string;
  /** Optional CSS class name */
  className?: string;
  /** Initial data to display */
  initialData?: any;
  /** Called when data changes */
  onChange?: (data: any) => void;
}

/**
 * ${filename:pascalcase} React component
 */
export const ${filename:pascalcase}: React.FC<${filename:pascalcase}Props> = ({
  id = '${filename:lowercase}-${uuid:short}',
  className = '',
  initialData = null,
  onChange
}) => {
  // State hooks
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Effect hook for data initialization
  useEffect(() => {
    // Example effect to load data
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call or data loading logic
        const result = await new Promise(resolve => 
          setTimeout(() => resolve(initialData || { defaultValue: true }), 500)
        );
        setData(result);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        setIsLoading(false);
      }
    };

    loadData();
    
    // Cleanup function
    return () => {
      // Any cleanup code here
    };
  }, [initialData]);

  // Handle data updates
  const handleDataChange = (newData: any) => {
    setData(newData);
    if (onChange) {
      onChange(newData);
    }
  };

  {{{ 
    // This logic will be evaluated during template generation
    // but won't be included in the final file
    variables.componentHasError = true;
    variables.componentHasLoading = true;
  }}}

  return (
    <div 
      id={id} 
      className={`${filename:kebabcase}-container ${className}`}
      data-testid="${filename:kebabcase}-component"
    >
      <h2 className="${filename:kebabcase}-title">
        ${filename:pascalcase} Component
      </h2>
      
      {${{ variables.componentHasLoading ? 'isLoading && <div className="loading-state">Loading...</div>' : '' }}}
      
      {${{ variables.componentHasError ? 'error && <div className="error-state">Error: {error.message}</div>' : '' }}}
      
      {!isLoading && !error && data && (
        <div className="${filename:kebabcase}-content">
          <pre>{JSON.stringify(data, null, 2)}</pre>
          
          <button 
            className="${filename:kebabcase}-button"
            onClick={() => handleDataChange({ ...data, lastUpdated: new Date().toISOString() })}
          >
            Update Data
          </button>
        </div>
      )}
    </div>
  );
};

export default ${filename:pascalcase};