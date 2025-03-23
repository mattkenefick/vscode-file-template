/**
 * TypeScript type definitions for ${filename:pascalcase} component
 */

/**
 * Base ${filename:pascalcase} item type
 */
export interface ${filename:pascalcase}Type {
  id: string | number;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Sort options for ${filename:pascalcase} items
 */
export enum ${filename:pascalcase}SortOption {
  TITLE_ASC = 'title_asc',
  TITLE_DESC = 'title_desc',
  CREATED_ASC = 'created_asc',
  CREATED_DESC = 'created_desc',
}

/**
 * Filter options for ${filename:pascalcase} items
 */
export interface ${filename:pascalcase}FilterOptions {
  searchTerm?: string;
  sortBy?: ${filename:pascalcase}SortOption;
  limit?: number;
  offset?: number;
}

/**
 * Theme options for ${filename:pascalcase} component
 */
export enum ${filename:pascalcase}Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
