import React, { createContext, useContext, useState, useMemo } from 'react';
import { ${filename:pascalcase}Type } from './types';

interface ${filename:pascalcase}ContextType {
  data: ${filename:pascalcase}Type[];
  selectedItem: ${filename:pascalcase}Type | null;
  setSelectedItem: (item: ${filename:pascalcase}Type | null) => void;
  handleSelect: (item: ${filename:pascalcase}Type) => void;
}

const ${filename:pascalcase}Context = createContext<${filename:pascalcase}ContextType | undefined>(undefined);

interface ${filename:pascalcase}ProviderProps {
  children: React.ReactNode;
  data: ${filename:pascalcase}Type[];
  onSelect?: (item: ${filename:pascalcase}Type) => void;
}

/**
 * Provider for ${filename:pascalcase} component state
 */
export const ${filename:pascalcase}Provider: React.FC<${filename:pascalcase}ProviderProps> = ({
  children,
  data,
  onSelect
}) => {
  const [selectedItem, setSelectedItem] = useState<${filename:pascalcase}Type | null>(null);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    const handleSelect = (item: ${filename:pascalcase}Type) => {
      setSelectedItem(item);
      if (onSelect) {
        onSelect(item);
      }
    };

    return {
      data,
      selectedItem,
      setSelectedItem,
      handleSelect
    };
  }, [data, selectedItem, onSelect]);

  return (
    <${filename:pascalcase}Context.Provider value={contextValue}>
      {children}
    </${filename:pascalcase}Context.Provider>
  );
};

/**
 * Hook to use the ${filename:pascalcase} context
 */
export const use${filename:pascalcase} = (): ${filename:pascalcase}ContextType => {
  const context = useContext(${filename:pascalcase}Context);
  if (context === undefined) {
    throw new Error('use${filename:pascalcase} must be used within a ${filename:pascalcase}Provider');
  }
  return context;
};