/**
 * ${filename:pascalcase} Interface
 * 
 * @description TypeScript interface for ${filename:lowercase} objects
 * @author ${env:USER}
 * @created ${date:YYYY-MM-DD}
 */

/**
 * Base properties for ${filename:pascalcase} objects
 */
export interface I${filename:pascalcase} {
  /** Unique identifier */
  id: string | number;
  
  /** Display name */
  name: string;
  
  /** Creation timestamp */
  createdAt: Date | string;
  
  /** Last update timestamp */
  updatedAt?: Date | string;
  
  /** Optional description */
  description?: string;
}

/**
 * Extended properties for detailed ${filename:pascalcase} objects
 */
export interface I${filename:pascalcase}Detailed extends I${filename:pascalcase} {
  /** Owner or creator reference */
  ownerId: string;
  
  /** Associated metadata */
  metadata?: Record<string, any>;
  
  /** Status indicator */
  status: ${filename:pascalcase}Status;
  
  /** Version information */
  version?: string;
  
  /** Associated tags */
  tags?: string[];
}

/**
 * ${filename:pascalcase} object status options
 */
export enum ${filename:pascalcase}Status {
  /** Item is in draft state */
  DRAFT = 'draft',
  
  /** Item is active and available */
  ACTIVE = 'active',
  
  /** Item is archived */
  ARCHIVED = 'archived',
  
  /** Item is pending review */
  PENDING = 'pending',
  
  /** Item is rejected */
  REJECTED = 'rejected'
}

/**
 * Configuration options for ${filename:pascalcase} operations
 */
export interface I${filename:pascalcase}Config {
  /** Default values when creating new ${filename:lowercase} objects */
  defaults?: Partial<I${filename:pascalcase}>;
  
  /** Validation rules */
  validation?: {
    /** Minimum name length */
    minNameLength: number;
    
    /** Maximum name length */
    maxNameLength: number;
    
    /** Required fields beyond the base required fields */
    requiredFields?: Array<keyof I${filename:pascalcase}Detailed>;
    
    /** Custom validation function */
    customValidator?: (${filename:camelcase}: I${filename:pascalcase}) => boolean;
  };
  
  /** Behavior options */
  options?: {
    /** Whether to automatically generate IDs */
    autoGenerateId: boolean;
    
    /** Whether to track update times */
    trackUpdates: boolean;
    
    /** Whether to enforce unique names */
    enforceUniqueNames: boolean;
  };
}

/**
 * Search parameters for finding ${filename:lowercase} objects
 */
export interface I${filename:pascalcase}SearchParams {
  /** Text to search for in name and description */
  query?: string;
  
  /** Filter by status */
  status?: ${filename:pascalcase}Status | ${filename:pascalcase}Status[];
  
  /** Filter by tags (matches any of the provided tags) */
  tags?: string[];
  
  /** Filter by owner */
  ownerId?: string;
  
  /** Sort field */
  sortBy?: keyof I${filename:pascalcase};
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  
  /** Pagination: number of items to skip */
  offset?: number;
  
  /** Pagination: maximum number of items to return */
  limit?: number;
  
  /** Filter by creation date range */
  createdBetween?: {
    start: Date | string;
    end: Date | string;
  };
}

/**
 * Result of a search operation
 */
export interface I${filename:pascalcase}SearchResult {
  /** Found items */
  items: I${filename:pascalcase}[];
  
  /** Total count of items matching the search criteria */
  totalCount: number;
  
  /** Search parameters used */
  params: I${filename:pascalcase}SearchParams;
}

/**
 * Type guard to check if an object is a valid ${filename:pascalcase}
 * 
 * @param obj The object to check
 * @returns True if the object is a valid ${filename:pascalcase}
 */
export function is${filename:pascalcase}(obj: any): obj is I${filename:pascalcase} {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'createdAt' in obj
  );
}

/**
 * Type guard to check if an object is a detailed ${filename:pascalcase}
 * 
 * @param obj The object to check
 * @returns True if the object is a valid detailed ${filename:pascalcase}
 */
export function is${filename:pascalcase}Detailed(obj: any): obj is I${filename:pascalcase}Detailed {
  return (
    is${filename:pascalcase}(obj) &&
    'ownerId' in obj &&
    'status' in obj
  );
}