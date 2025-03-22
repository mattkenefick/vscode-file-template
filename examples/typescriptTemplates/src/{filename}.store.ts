/**
 * ${filename:pascalcase} Store
 * 
 * @description TypeScript state management for ${filename:lowercase}
 * @author ${env:USER}
 * @created ${date:YYYY-MM-DD}
 */

// Generic types for the store
export type Listener<T> = (state: T) => void;
export type Unsubscribe = () => void;
export type Action<T> = (state: T) => Partial<T> | Promise<Partial<T>>;
export type AsyncAction<T, R = any> = (state: T, dispatch: Dispatch<T>) => Promise<R>;
export type Dispatch<T> = (action: Action<T> | AsyncAction<T>) => Promise<void>;
export type Selector<T, R> = (state: T) => R;

/**
 * ${filename:pascalcase} state interface
 */
export interface ${filename:pascalcase}State {
  // Status flags
  isLoading: boolean;
  isError: boolean;
  lastUpdated: number | null;
  
  // Data
  items: Record<string, ${filename:pascalcase}Item>;
  selectedId: string | null;
  
  // UI state
  filter: ${filename:pascalcase}Filter;
  pagination: ${filename:pascalcase}Pagination;
  
  // Error state
  error: string | null;
}

/**
 * ${filename:pascalcase} item interface
 */
export interface ${filename:pascalcase}Item {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status: ${filename:pascalcase}Status;
  data?: Record<string, any>;
}

/**
 * ${filename:pascalcase} status enum
 */
export enum ${filename:pascalcase}Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived'
}

/**
 * ${filename:pascalcase} filter interface
 */
export interface ${filename:pascalcase}Filter {
  searchTerm: string;
  status: ${filename:pascalcase}Status | 'all';
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

/**
 * ${filename:pascalcase} pagination interface
 */
export interface ${filename:pascalcase}Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Initial state
 */
export const initial${filename:pascalcase}State: ${filename:pascalcase}State = {
  isLoading: false,
  isError: false,
  lastUpdated: null,
  items: {},
  selectedId: null,
  filter: {
    searchTerm: '',
    status: 'all',
    sortBy: 'createdAt',
    sortDirection: 'desc'
  },
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0
  },
  error: null
};

/**
 * ${filename:pascalcase} Store class
 */
export class ${filename:pascalcase}Store {
  private state: ${filename:pascalcase}State;
  private listeners: Set<Listener<${filename:pascalcase}State>>;
  private asyncQueue: Promise<any>;
  
  constructor(initialState: Partial<${filename:pascalcase}State> = {}) {
    this.state = { ...initial${filename:pascalcase}State, ...initialState };
    this.listeners = new Set();
    this.asyncQueue = Promise.resolve();
  }
  
  /**
   * Get the current state
   */
  getState(): ${filename:pascalcase}State {
    return { ...this.state };
  }
  
  /**
   * Subscribe to state changes
   * 
   * @param listener Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: Listener<${filename:pascalcase}State>): Unsubscribe {
    this.listeners.add(listener);
    
    // Call listener immediately with current state
    listener(this.getState());
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Select a specific slice of state
   * 
   * @param selector Function to extract the desired state
   * @returns The selected state and a subscription function
   */
  select<R>(selector: Selector<${filename:pascalcase}State, R>): [R, (listener: (selected: R) => void) => Unsubscribe] {
    const currentSelection = selector(this.getState());
    
    const subscribeToSelector = (listener: (selected: R) => void): Unsubscribe => {
      let previousSelection = currentSelection;
      
      // Call listener immediately
      listener(previousSelection);
      
      // Subscribe to state changes, but only call listener if selection changes
      return this.subscribe((state) => {
        const newSelection = selector(state);
        
        // Compare selections
        if (!this.isEqual(previousSelection, newSelection)) {
          previousSelection = newSelection;
          listener(newSelection);
        }
      });
    };
    
    return [currentSelection, subscribeToSelector];
  }
  
  /**
   * Dispatch an action to update the state
   * 
   * @param action The action to dispatch
   */
  async dispatch(action: Action<${filename:pascalcase}State> | AsyncAction<${filename:pascalcase}State>): Promise<void> {
    // Queue the action to prevent race conditions
    this.asyncQueue = this.asyncQueue.then(async () => {
      try {
        let stateUpdate: Partial<${filename:pascalcase}State>;
        
        if (action.constructor.name === 'AsyncFunction' || action.toString().includes('__awaiter')) {
          // Handle async action
          stateUpdate = await (action as AsyncAction<${filename:pascalcase}State>)(this.state, this.dispatch.bind(this));
        } else {
          // Handle synchronous action
          stateUpdate = await (action as Action<${filename:pascalcase}State>)(this.state);
        }
        
        // Only update state if action returned something
        if (stateUpdate) {
          this.updateState(stateUpdate);
        }
      } catch (error) {
        // Update state with error
        this.updateState({
          isError: true,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false
        });
        
        // Re-throw for caller to handle if needed
        throw error;
      }
    });
    
    // Wait for action to complete
    await this.asyncQueue;
  }
  
  /**
   * Update state and notify listeners
   * 
   * @param update Partial state update
   */
  private updateState(update: Partial<${filename:pascalcase}State>): void {
    // Apply update
    this.state = {
      ...this.state,
      ...update,
      // Always update lastUpdated when state changes
      lastUpdated: Date.now()
    };
    
    // Notify all listeners
    this.notifyListeners();
  }
  
  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach(listener => listener(currentState));
  }
  
  /**
   * Deep equality check for state selection
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      a === null ||
      b === null
    ) {
      return false;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => this.isEqual(a[key], b[key]));
  }
  
  /**
   * Reset the store to initial state
   */
  reset(): void {
    this.updateState(initial${filename:pascalcase}State);
  }
}

// Create a singleton store instance
export const ${filename:camelcase}Store = new ${filename:pascalcase}Store();

/**
 * Common Actions
 */

/**
 * Load ${filename:lowercase} items
 */
export const load${filename:pascalcase}Items = (): AsyncAction<${filename:pascalcase}State> => 
  async (state, dispatch) => {
    // Set loading state
    dispatch(state => ({ isLoading: true, error: null, isError: false }));
    
    try {
      // API call would go here
      const response = await fetch('/api/${filename:lowercase}s');
      const data = await response.json();
      
      // Transform array to record with ID as key
      const items = data.reduce((acc: Record<string, ${filename:pascalcase}Item>, item: ${filename:pascalcase}Item) => {
        acc[item.id] = item;
        return acc;
      }, {});
      
      // Update pagination
      const totalItems = data.length;
      const totalPages = Math.ceil(totalItems / state.pagination.pageSize);
      
      return {
        items,
        isLoading: false,
        pagination: {
          ...state.pagination,
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      return {
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error.message : 'Failed to load items'
      };
    }
  };

/**
 * Select a ${filename:lowercase} item
 */
export const select${filename:pascalcase}Item = (id: string | null): Action<${filename:pascalcase}State> => 
  state => ({
    selectedId: id
  });

/**
 * Add a ${filename:lowercase} item
 */
export const add${filename:pascalcase}Item = (item: ${filename:pascalcase}Item): Action<${filename:pascalcase}State> => 
  state => ({
    items: {
      ...state.items,
      [item.id]: item
    }
  });

/**
 * Update a ${filename:lowercase} item
 */
export const update${filename:pascalcase}Item = (id: string, updates: Partial<${filename:pascalcase}Item>): Action<${filename:pascalcase}State> => 
  state => {
    if (!state.items[id]) {
      return {};
    }
    
    return {
      items: {
        ...state.items,
        [id]: {
          ...state.items[id],
          ...updates,
          updatedAt: new Date().toISOString()
        }
      }
    };
  };

/**
 * Remove a ${filename:lowercase} item
 */
export const remove${filename:pascalcase}Item = (id: string): Action<${filename:pascalcase}State> => 
  state => {
    const { [id]: removed, ...items } = state.items;
    
    return {
      items,
      // If the deleted item was selected, clear selection
      selectedId: state.selectedId === id ? null : state.selectedId
    };
  };

/**
 * Update filter settings
 */
export const update${filename:pascalcase}Filter = (filter: Partial<${filename:pascalcase}Filter>): Action<${filename:pascalcase}State> => 
  state => ({
    filter: {
      ...state.filter,
      ...filter
    },
    // Reset to first page when filter changes
    pagination: {
      ...state.pagination,
      page: 1
    }
  });

/**
 * Update pagination
 */
export const update${filename:pascalcase}Pagination = (pagination: Partial<${filename:pascalcase}Pagination>): Action<${filename:pascalcase}State> => 
  state => ({
    pagination: {
      ...state.pagination,
      ...pagination
    }
  });

/**
 * Common Selectors
 */

/**
 * Get all ${filename:lowercase} items as an array
 */
export const select${filename:pascalcase}Items = (state: ${filename:pascalcase}State): ${filename:pascalcase}Item[] => 
  Object.values(state.items);

/**
 * Get filtered ${filename:lowercase} items
 */
export const selectFiltered${filename:pascalcase}Items = (state: ${filename:pascalcase}State): ${filename:pascalcase}Item[] => {
  let items = Object.values(state.items);
  const { filter } = state;
  
  // Apply status filter
  if (filter.status !== 'all') {
    items = items.filter(item => item.status === filter.status);
  }
  
  // Apply search term filter
  if (filter.searchTerm) {
    const searchLower = filter.searchTerm.toLowerCase();
    items = items.filter(item => 
      item.name.toLowerCase().includes(searchLower) || 
      item.description?.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply sorting
  items.sort((a, b) => {
    let comparison = 0;
    
    if (filter.sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (filter.sortBy === 'updatedAt') {
      const aTime = a.updatedAt || a.createdAt;
      const bTime = b.updatedAt || b.createdAt;
      comparison = new Date(aTime).getTime() - new Date(bTime).getTime();
    } else {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    return filter.sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return items;
};

/**
 * Get paginated ${filename:lowercase} items
 */
export const selectPaginated${filename:pascalcase}Items = (state: ${filename:pascalcase}State): ${filename:pascalcase}Item[] => {
  const filtered = selectFiltered${filename:pascalcase}Items(state);
  const { page, pageSize } = state.pagination;
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return filtered.slice(start, end);
};

/**
 * Get the currently selected ${filename:lowercase} item
 */
export const selectCurrent${filename:pascalcase}Item = (state: ${filename:pascalcase}State): ${filename:pascalcase}Item | null => 
  state.selectedId ? state.items[state.selectedId] || null : null;

/**
 * Get loading state
 */
export const select${filename:pascalcase}Loading = (state: ${filename:pascalcase}State): boolean => 
  state.isLoading;

/**
 * Get error state
 */
export const select${filename:pascalcase}Error = (state: ${filename:pascalcase}State): { isError: boolean; message: string | null } => ({
  isError: state.isError,
  message: state.error
});