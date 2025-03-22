/**
 * ${filename:pascalcase} Class
 * 
 * @description TypeScript class for ${filename:lowercase} functionality
 * @author ${env:USER}
 * @created ${date:YYYY-MM-DD}
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

/**
 * Possible states for a ${filename:pascalcase} instance
 */
export enum ${filename:pascalcase}State {
  INITIALIZED = 'initialized',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
  DESTROYED = 'destroyed'
}

/**
 * Configuration options for ${filename:pascalcase}
 */
export interface ${filename:pascalcase}Options {
  /** Optional ID (auto-generated if not provided) */
  id?: string;
  
  /** Optional name */
  name?: string;
  
  /** Whether to enable debug logging */
  debug?: boolean;
  
  /** Initial state */
  initialState?: ${filename:pascalcase}State;
  
  /** Custom event handlers */
  handlers?: {
    [key: string]: (...args: any[]) => void;
  };
  
  /** Maximum number of retry attempts */
  maxRetries?: number;
  
  /** Custom timeout in milliseconds */
  timeout?: number;
}

/**
 * ${filename:pascalcase} event names
 */
export enum ${filename:pascalcase}Event {
  STATE_CHANGED = 'stateChanged',
  ERROR = 'error',
  READY = 'ready',
  DESTROYED = 'destroyed',
  UPDATED = 'updated'
}

/**
 * @class ${filename:pascalcase}
 * @description A flexible and reusable ${filename:lowercase} implementation
 */
export class ${filename:pascalcase} extends EventEmitter {
  /** Unique identifier */
  private _id: string;
  
  /** Display name */
  private _name: string;
  
  /** Current state */
  private _state: ${filename:pascalcase}State;
  
  /** Whether debug mode is enabled */
  private _debug: boolean;
  
  /** Creation timestamp */
  private readonly _createdAt: Date;
  
  /** Last updated timestamp */
  private _updatedAt: Date;
  
  /** Configuration options */
  private _options: ${filename:pascalcase}Options;
  
  /** Retry attempt counter */
  private _retryCount: number = 0;
  
  /** Internal data storage */
  private _data: Map<string, any> = new Map();
  
  /** Active timeout IDs */
  private _timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Creates a new ${filename:pascalcase} instance
   * 
   * @param options Configuration options
   */
  constructor(options: ${filename:pascalcase}Options = {}) {
    super();
    
    // Initialize properties
    this._id = options.id || uuidv4();
    this._name = options.name || `${filename:pascalcase}_${Date.now()}`;
    this._debug = options.debug || false;
    this._state = options.initialState || ${filename:pascalcase}State.INITIALIZED;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._options = {
      ...options,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000
    };
    
    // Bind event handlers
    if (options.handlers) {
      Object.entries(options.handlers).forEach(([event, handler]) => {
        this.on(event, handler);
      });
    }
    
    // Log initialization
    this._log(`${filename:pascalcase} initialized with ID: ${this._id}`);
    
    // Set up initial state
    this._setState(this._state);
  }
  
  /**
   * The unique identifier
   */
  get id(): string {
    return this._id;
  }
  
  /**
   * The display name
   */
  get name(): string {
    return this._name;
  }
  
  /**
   * Set a new name
   */
  set name(value: string) {
    this._name = value;
    this._markUpdated();
    this.emit(${filename:pascalcase}Event.UPDATED, { property: 'name', value });
  }
  
  /**
   * The current state
   */
  get state(): ${filename:pascalcase}State {
    return this._state;
  }
  
  /**
   * Creation timestamp
   */
  get createdAt(): Date {
    return this._createdAt;
  }
  
  /**
   * Last update timestamp
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }
  
  /**
   * Whether debug mode is enabled
   */
  get debug(): boolean {
    return this._debug;
  }
  
  /**
   * Set debug mode
   */
  set debug(value: boolean) {
    this._debug = value;
    this._log(`Debug mode ${value ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Activates the ${filename:lowercase}
   * 
   * @returns The current instance for chaining
   */
  public activate(): ${filename:pascalcase} {
    if (this._state !== ${filename:pascalcase}State.ACTIVE) {
      this._setState(${filename:pascalcase}State.ACTIVE);
      this._log('Activated');
    }
    return this;
  }
  
  /**
   * Pauses the ${filename:lowercase}
   * 
   * @returns The current instance for chaining
   */
  public pause(): ${filename:pascalcase} {
    if (this._state === ${filename:pascalcase}State.ACTIVE) {
      this._setState(${filename:pascalcase}State.PAUSED);
      this._log('Paused');
    }
    return this;
  }
  
  /**
   * Resumes the ${filename:lowercase} from a paused state
   * 
   * @returns The current instance for chaining
   */
  public resume(): ${filename:pascalcase} {
    if (this._state === ${filename:pascalcase}State.PAUSED) {
      this._setState(${filename:pascalcase}State.ACTIVE);
      this._log('Resumed');
    }
    return this;
  }
  
  /**
   * Resets the ${filename:lowercase} to its initial state
   * 
   * @returns The current instance for chaining
   */
  public reset(): ${filename:pascalcase} {
    this._retryCount = 0;
    this._data.clear();
    this._clearAllTimeouts();
    this._setState(${filename:pascalcase}State.INITIALIZED);
    this._log('Reset to initial state');
    return this;
  }
  
  /**
   * Destroys the ${filename:lowercase}, clearing all resources
   */
  public destroy(): void {
    this._clearAllTimeouts();
    this._setState(${filename:pascalcase}State.DESTROYED);
    this._log('Destroyed');
    this.emit(${filename:pascalcase}Event.DESTROYED);
    this.removeAllListeners();
  }
  
  /**
   * Sets a data value
   * 
   * @param key The data key
   * @param value The value to store
   * @returns The current instance for chaining
   */
  public setData<T>(key: string, value: T): ${filename:pascalcase} {
    this._data.set(key, value);
    this._markUpdated();
    return this;
  }
  
  /**
   * Gets a data value
   * 
   * @param key The data key
   * @param defaultValue Optional default value if the key doesn't exist
   * @returns The stored value or default value
   */
  public getData<T>(key: string, defaultValue?: T): T | undefined {
    return this._data.has(key) 
      ? (this._data.get(key) as T) 
      : defaultValue;
  }
  
  /**
   * Checks if a data key exists
   * 
   * @param key The data key
   * @returns True if the key exists
   */
  public hasData(key: string): boolean {
    return this._data.has(key);
  }
  
  /**
   * Deletes a data key
   * 
   * @param key The data key to delete
   * @returns True if the key was deleted
   */
  public deleteData(key: string): boolean {
    const result = this._data.delete(key);
    if (result) {
      this._markUpdated();
    }
    return result;
  }
  
  /**
   * Gets all data as an object
   * 
   * @returns An object with all data
   */
  public getAllData(): Record<string, any> {
    return Object.fromEntries(this._data.entries());
  }
  
  /**
   * Creates a timeout that will be automatically cleared when the instance is destroyed
   * 
   * @param callback The function to execute
   * @param delay The delay in milliseconds
   * @param id Optional identifier for the timeout
   * @returns The timeout ID
   */
  public setTimeout(callback: () => void, delay: number, id?: string): string {
    const timeoutId = id || uuidv4();
    const timeout = setTimeout(() => {
      this._timeouts.delete(timeoutId);
      callback();
    }, delay);
    
    this._timeouts.set(timeoutId, timeout);
    return timeoutId;
  }
  
  /**
   * Clears a specific timeout
   * 
   * @param id The timeout ID
   * @returns True if the timeout was cleared
   */
  public clearTimeout(id: string): boolean {
    if (this._timeouts.has(id)) {
      clearTimeout(this._timeouts.get(id)!);
      this._timeouts.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Gets a JSON representation of the ${filename:lowercase}
   * 
   * @returns A JSON-serializable object
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      name: this._name,
      state: this._state,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      data: this.getAllData()
    };
  }
  
  /**
   * Updates the internal state
   * 
   * @param state The new state
   * @private
   */
  private _setState(state: ${filename:pascalcase}State): void {
    const previousState = this._state;
    this._state = state;
    
    if (previousState !== state) {
      this._markUpdated();
      this.emit(${filename:pascalcase}Event.STATE_CHANGED, { 
        previous: previousState, 
        current: state 
      });
      
      // Emit ready event when activated for the first time
      if (state === ${filename:pascalcase}State.ACTIVE && 
          (previousState === ${filename:pascalcase}State.INITIALIZED)) {
        this.emit(${filename:pascalcase}Event.READY);
      }
    }
  }
  
  /**
   * Handles errors
   * 
   * @param error The error object
   * @param fatal Whether the error is fatal
   * @private
   */
  private _handleError(error: Error, fatal: boolean = false): void {
    this._log(`Error: ${error.message}`, 'error');
    
    if (fatal || this._retryCount >= (this._options.maxRetries || 3)) {
      this._setState(${filename:pascalcase}State.ERROR);
      this.emit(${filename:pascalcase}Event.ERROR, error);
    } else {
      this._retryCount++;
      this._log(`Retrying (${this._retryCount}/${this._options.maxRetries})...`);
      // Implement retry logic here if needed
    }
  }
  
  /**
   * Marks the instance as updated
   * 
   * @private
   */
  private _markUpdated(): void {
    this._updatedAt = new Date();
  }
  
  /**
   * Clears all active timeouts
   * 
   * @private
   */
  private _clearAllTimeouts(): void {
    this._timeouts.forEach((timeout) => clearTimeout(timeout));
    this._timeouts.clear();
  }
  
  /**
   * Logs a message if debug mode is enabled
   * 
   * @param message The message to log
   * @param level The log level
   * @private
   */
  private _log(message: string, level: 'log' | 'info' | 'warn' | 'error' = 'log'): void {
    if (this._debug) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${this._name}:${this._id}] `;
      console[level](`${prefix}${message}`);
    }
  }
  
  /**
   * Creates a ${filename:pascalcase} instance with default configuration
   * 
   * @returns A new ${filename:pascalcase} instance
   * @static
   */
  public static create(options?: ${filename:pascalcase}Options): ${filename:pascalcase} {
    return new ${filename:pascalcase}(options).activate();
  }
}

export default ${filename:pascalcase};