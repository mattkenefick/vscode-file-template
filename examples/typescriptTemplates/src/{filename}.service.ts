/**
 * ${filename:pascalcase} Service
 * 
 * @description TypeScript service for ${filename:lowercase} operations
 * @author ${env:USER}
 * @created ${date:YYYY-MM-DD}
 */

import { injectable, inject } from 'inversify';
import { Logger } from '../utils/logger';
import { CONFIG } from '../config';
import { BaseError, NotFoundError, ValidationError } from '../errors';

/**
 * ${filename:pascalcase} item structure
 */
export interface ${filename:pascalcase}Item {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * Create ${filename:pascalcase} parameters
 */
export interface Create${filename:pascalcase}Params {
  name: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Update ${filename:pascalcase} parameters
 */
export interface Update${filename:pascalcase}Params {
  name?: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, any> | null;
}

/**
 * ${filename:pascalcase} filter parameters
 */
export interface ${filename:pascalcase}FilterParams {
  isActive?: boolean;
  searchTerm?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * ${filename:pascalcase} service result
 */
export interface ${filename:pascalcase}Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
  meta?: {
    totalCount?: number;
    filteredCount?: number;
  };
}

/**
 * ${filename:pascalcase} service implementation
 */
@injectable()
export class ${filename:pascalcase}Service {
  private readonly _collectionName = '${filename:lowercase}s';
  private readonly _cache = new Map<string, ${filename:pascalcase}Item>();
  private readonly _cacheTime = 60 * 1000; // 1 minute
  private _lastCacheUpdate = 0;
  
  constructor(
    @inject('Logger') private readonly _logger: Logger,
    @inject('Database') private readonly _db: any,
    @inject('EventBus') private readonly _eventBus: any
  ) {
    this._init();
  }
  
  /**
   * Initialize the service
   */
  private async _init(): Promise<void> {
    this._logger.info(`Initializing ${filename:pascalcase}Service`);
    
    // Subscribe to relevant events
    this._eventBus.subscribe('${filename:lowercase}.created', this._handleItemCreated.bind(this));
    this._eventBus.subscribe('${filename:lowercase}.updated', this._handleItemUpdated.bind(this));
    this._eventBus.subscribe('${filename:lowercase}.deleted', this._handleItemDeleted.bind(this));
    
    // Initial cache load
    await this._refreshCache();
  }
  
  /**
   * Get all ${filename:lowercase} items with optional filtering
   * 
   * @param params Filter parameters
   * @returns Result with ${filename:lowercase} items
   */
  public async getAll(params: ${filename:pascalcase}FilterParams = {}): Promise<${filename:pascalcase}Result<${filename:pascalcase}Item[]>> {
    try {
      this._logger.debug(`Getting all ${filename:lowercase}s with params`, params);
      
      // Update cache if needed
      await this._checkCacheValidity();
      
      let items = Array.from(this._cache.values());
      const totalCount = items.length;
      
      // Apply filters
      if (params.isActive !== undefined) {
        items = items.filter(item => item.isActive === params.isActive);
      }
      
      if (params.searchTerm) {
        const term = params.searchTerm.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(term) || 
          item.description?.toLowerCase().includes(term)
        );
      }
      
      // Apply sorting
      const sortBy = params.sortBy || 'createdAt';
      const sortDirection = params.sortDirection || 'desc';
      
      items.sort((a, b) => {
        if (sortBy === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortBy === 'updatedAt') {
          const aTime = a.updatedAt?.getTime() || a.createdAt.getTime();
          const bTime = b.updatedAt?.getTime() || b.createdAt.getTime();
          return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
        } else {
          // Default to createdAt
          return sortDirection === 'asc' 
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime();
        }
      });
      
      // Apply pagination
      const filteredCount = items.length;
      
      if (params.offset !== undefined || params.limit !== undefined) {
        const offset = params.offset || 0;
        const limit = params.limit || 20;
        items = items.slice(offset, offset + limit);
      }
      
      return {
        success: true,
        data: items,
        meta: {
          totalCount,
          filteredCount
        }
      };
    } catch (error) {
      this._logger.error(`Error getting ${filename:lowercase}s:`, error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(`Unknown error getting ${filename:lowercase}s`)
      };
    }
  }
  
  /**
   * Get a ${filename:lowercase} item by ID
   * 
   * @param id ${filename:pascalcase} ID
   * @returns Result with ${filename:lowercase} item
   */
  public async getById(id: string): Promise<${filename:pascalcase}Result<${filename:pascalcase}Item>> {
    try {
      this._logger.debug(`Getting ${filename:lowercase} by id: ${id}`);
      
      // Update cache if needed
      await this._checkCacheValidity();
      
      if (this._cache.has(id)) {
        return {
          success: true,
          data: this._cache.get(id)
        };
      }
      
      // If not in cache, try to fetch from database
      const item = await this._db.collection(this._collectionName).findOne({ id });
      
      if (!item) {
        throw new NotFoundError(`${filename:pascalcase} with id ${id} not found`);
      }
      
      // Add to cache
      this._cache.set(id, item);
      
      return {
        success: true,
        data: item
      };
    } catch (error) {
      this._logger.error(`Error getting ${filename:lowercase} by id ${id}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(`Unknown error getting ${filename:lowercase} ${id}`)
      };
    }
  }
  
  /**
   * Create a new ${filename:lowercase} item
   * 
   * @param params Creation parameters
   * @returns Result with created ${filename:lowercase} item
   */
  public async create(params: Create${filename:pascalcase}Params): Promise<${filename:pascalcase}Result<${filename:pascalcase}Item>> {
    try {
      this._logger.debug(`Creating ${filename:lowercase}:`, params);
      
      // Validate input
      this._validateCreateParams(params);
      
      const now = new Date();
      const id = this._generateId();
      
      const newItem: ${filename:pascalcase}Item = {
        id,
        name: params.name,
        description: params.description,
        isActive: params.isActive ?? true,
        createdAt: now,
        metadata: params.metadata
      };
      
      // Save to database
      await this._db.collection(this._collectionName).insertOne(newItem);
      
      // Add to cache
      this._cache.set(id, newItem);
      
      // Emit event
      this._eventBus.publish('${filename:lowercase}.created', { item: newItem });
      
      return {
        success: true,
        data: newItem
      };
    } catch (error) {
      this._logger.error(`Error creating ${filename:lowercase}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(`Unknown error creating ${filename:lowercase}`)
      };
    }
  }
  
  /**
   * Update a ${filename:lowercase} item
   * 
   * @param id ${filename:pascalcase} ID
   * @param params Update parameters
   * @returns Result with updated ${filename:lowercase} item
   */
  public async update(id: string, params: Update${filename:pascalcase}Params): Promise<${filename:pascalcase}Result<${filename:pascalcase}Item>> {
    try {
      this._logger.debug(`Updating ${filename:lowercase} ${id}:`, params);
      
      // Check if item exists
      const existingResult = await this.getById(id);
      
      if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError(`${filename:pascalcase} with id ${id} not found`);
      }
      
      const existingItem = existingResult.data;
      
      // Build update object
      const updates: Partial<${filename:pascalcase}Item> = {
        updatedAt: new Date()
      };
      
      if (params.name !== undefined) {
        updates.name = params.name;
      }
      
      if (params.description !== undefined) {
        updates.description = params.description;
      }
      
      if (params.isActive !== undefined) {
        updates.isActive = params.isActive;
      }
      
      if (params.metadata !== undefined) {
        updates.metadata = params.metadata === null ? undefined : params.metadata;
      }
      
      // Apply updates to database
      await this._db.collection(this._collectionName).updateOne(
        { id },
        { $set: updates }
      );
      
      // Update cache
      const updatedItem = {
        ...existingItem,
        ...updates
      };
      
      this._cache.set(id, updatedItem);
      
      // Emit event
      this._eventBus.publish('${filename:lowercase}.updated', { 
        item: updatedItem,
        changes: updates
      });
      
      return {
        success: true,
        data: updatedItem
      };
    } catch (error) {
      this._logger.error(`Error updating ${filename:lowercase} ${id}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(`Unknown error updating ${filename:lowercase} ${id}`)
      };
    }
  }
  
  /**
   * Delete a ${filename:lowercase} item
   * 
   * @param id ${filename:pascalcase} ID
   * @returns Result indicating success or failure
   */
  public async delete(id: string): Promise<${filename:pascalcase}Result<boolean>> {
    try {
      this._logger.debug(`Deleting ${filename:lowercase} ${id}`);
      
      // Check if item exists
      const existingResult = await this.getById(id);
      
      if (!existingResult.success || !existingResult.data) {
        throw new NotFoundError(`${filename:pascalcase} with id ${id} not found`);
      }
      
      // Delete from database
      await this._db.collection(this._collectionName).deleteOne({ id });
      
      // Remove from cache
      this._cache.delete(id);
      
      // Emit event
      this._eventBus.publish('${filename:lowercase}.deleted', { 
        item: existingResult.data
      });
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      this._logger.error(`Error deleting ${filename:lowercase} ${id}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(`Unknown error deleting ${filename:lowercase} ${id}`)
      };
    }
  }
  
  /**
   * Validate create parameters
   * 
   * @param params Parameters to validate
   * @throws ValidationError if validation fails
   */
  private _validateCreateParams(params: Create${filename:pascalcase}Params): void {
    if (!params.name) {
      throw new ValidationError('Name is required');
    }
    
    if (params.name.length < 3) {
      throw new ValidationError('Name must be at least 3 characters');
    }
    
    if (params.name.length > 100) {
      throw new ValidationError('Name must be at most 100 characters');
    }
    
    if (params.description && params.description.length > 1000) {
      throw new ValidationError('Description must be at most 1000 characters');
    }
  }
  
  /**
   * Generate a unique ID for a new ${filename:lowercase} item
   * 
   * @returns A unique ID
   */
  private _generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * Check if cache needs to be refreshed
   */
  private async _checkCacheValidity(): Promise<void> {
    const now = Date.now();
    
    if (now - this._lastCacheUpdate > this._cacheTime) {
      await this._refreshCache();
    }
  }
  
  /**
   * Refresh the cache with data from database
   */
  private async _refreshCache(): Promise<void> {
    try {
      this._logger.debug('Refreshing ${filename:lowercase} cache');
      
      const items = await this._db.collection(this._collectionName).find().toArray();
      
      // Clear and rebuild cache
      this._cache.clear();
      
      for (const item of items) {
        this._cache.set(item.id, item);
      }
      
      this._lastCacheUpdate = Date.now();
      
      this._logger.debug(`Cache refreshed with ${this._cache.size} ${filename:lowercase}s`);
    } catch (error) {
      this._logger.error('Error refreshing cache:', error);
      // Don't throw - just log the error and continue with stale cache
    }
  }
  
  /**
   * Handle ${filename:lowercase} created event
   */
  private _handleItemCreated(data: { item: ${filename:pascalcase}Item }): void {
    this._logger.debug('Handling ${filename:lowercase}.created event');
    this._cache.set(data.item.id, data.item);
  }
  
  /**
   * Handle ${filename:lowercase} updated event
   */
  private _handleItemUpdated(data: { item: ${filename:pascalcase}Item }): void {
    this._logger.debug('Handling ${filename:lowercase}.updated event');
    this._cache.set(data.item.id, data.item);
  }
  
  /**
   * Handle ${filename:lowercase} deleted event
   */
  private _handleItemDeleted(data: { item: ${filename:pascalcase}Item }): void {
    this._logger.debug('Handling ${filename:lowercase}.deleted event');
    this._cache.delete(data.item.id);
  }
}