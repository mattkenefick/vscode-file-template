/**
 * ${filename:pascalcase} Decorators
 * 
 * @description TypeScript decorators for ${filename:lowercase} functionality
 * @author ${env:USER}
 * @created ${date:YYYY-MM-DD}
 */

/**
 * Options for the Log decorator
 */
export interface LogOptions {
  /** Whether to log the method arguments */
  logArgs?: boolean;
  
  /** Whether to log the return value */
  logReturn?: boolean;
  
  /** Whether to log the execution time */
  logTime?: boolean;
  
  /** Custom logger function */
  logger?: (message: string, ...args: any[]) => void;
}

/**
 * Default log options
 */
const DEFAULT_LOG_OPTIONS: LogOptions = {
  logArgs: true,
  logReturn: true,
  logTime: true,
  logger: console.log
};

/**
 * Method decorator that logs method calls, arguments, return values, and execution time
 *
 * @example
 * class MyClass {
 *   @Log()
 *   myMethod(arg1: string, arg2: number): string {
 *     return `${arg1}: ${arg2}`;
 *   }
 * }
 *
 * @param options Configuration options
 */
export function Log(options: LogOptions = {}): MethodDecorator {
  const opts = { ...DEFAULT_LOG_OPTIONS, ...options };
  
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const className = target.constructor.name;
      const methodName = propertyKey.toString();
      const logger = opts.logger || console.log;
      
      logger(`[${filename:pascalcase}] ${className}.${methodName} called`);
      
      if (opts.logArgs && args.length > 0) {
        logger(`[${filename:pascalcase}] Arguments:`, args);
      }
      
      const start = opts.logTime ? performance.now() : 0;
      let result;
      
      try {
        result = originalMethod.apply(this, args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result
            .then(value => {
              if (opts.logReturn) {
                logger(`[${filename:pascalcase}] ${className}.${methodName} returned:`, value);
              }
              
              if (opts.logTime) {
                const end = performance.now();
                logger(`[${filename:pascalcase}] ${className}.${methodName} execution time: ${end - start}ms`);
              }
              
              return value;
            })
            .catch(error => {
              logger(`[${filename:pascalcase}] ${className}.${methodName} threw error:`, error);
              throw error;
            });
        }
        
        // Handle synchronous results
        if (opts.logReturn) {
          logger(`[${filename:pascalcase}] ${className}.${methodName} returned:`, result);
        }
        
        if (opts.logTime) {
          const end = performance.now();
          logger(`[${filename:pascalcase}] ${className}.${methodName} execution time: ${end - start}ms`);
        }
        
        return result;
      } catch (error) {
        logger(`[${filename:pascalcase}] ${className}.${methodName} threw error:`, error);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Options for the Memoize decorator
 */
export interface MemoizeOptions {
  /** Maximum number of entries to cache */
  maxSize?: number;
  
  /** Cache expiration time in milliseconds */
  expiresIn?: number;
  
  /** Custom hash function for arguments */
  hashFunction?: (...args: any[]) => string;
}

/**
 * Method decorator that memoizes (caches) the return value of a method based on its arguments
 *
 * @example
 * class MyClass {
 *   @Memoize()
 *   expensiveCalculation(a: number, b: number): number {
 *     console.log('Computing...');
 *     return a + b;
 *   }
 * }
 *
 * @param options Configuration options
 */
export function Memoize(options: MemoizeOptions = {}): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    if (descriptor.value) {
      return memoizeMethod(descriptor, options);
    } else if (descriptor.get) {
      return memoizeGetter(descriptor, options);
    }
    
    return descriptor;
  };
}

/**
 * Helper for memoizing methods
 */
function memoizeMethod(
  descriptor: PropertyDescriptor,
  options: MemoizeOptions
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  const maxSize = options.maxSize || Infinity;
  const expiresIn = options.expiresIn;
  const hashFunction = options.hashFunction || JSON.stringify;
  
  const cache = new Map<string, { value: any; timestamp: number }>();
  
  descriptor.value = function(...args: any[]) {
    const key = hashFunction(...args);
    
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      
      // Check if the cached value has expired
      if (expiresIn && Date.now() - cached.timestamp > expiresIn) {
        cache.delete(key);
      } else {
        return cached.value;
      }
    }
    
    // If maxSize is reached, remove the oldest entry
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    const result = originalMethod.apply(this, args);
    
    // Handle promise results
    if (result instanceof Promise) {
      return result.then(value => {
        cache.set(key, { value, timestamp: Date.now() });
        return value;
      });
    }
    
    // Handle synchronous results
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };
  
  return descriptor;
}

/**
 * Helper for memoizing getters
 */
function memoizeGetter(
  descriptor: PropertyDescriptor,
  options: MemoizeOptions
): PropertyDescriptor {
  const originalGetter = descriptor.get!;
  const expiresIn = options.expiresIn;
  
  let cache: { value: any; timestamp: number } | null = null;
  
  descriptor.get = function() {
    if (cache) {
      // Check if the cached value has expired
      if (expiresIn && Date.now() - cache.timestamp > expiresIn) {
        cache = null;
      } else {
        return cache.value;
      }
    }
    
    const value = originalGetter.apply(this);
    cache = { value, timestamp: Date.now() };
    return value;
  };
  
  return descriptor;
}

/**
 * Options for the Debounce decorator
 */
export interface DebounceOptions {
  /** Debounce wait time in milliseconds */
  wait?: number;
  
  /** Whether to execute the function at the leading edge */
  leading?: boolean;
  
  /** Whether to execute the function at the trailing edge */
  trailing?: boolean;
}

/**
 * Method decorator that debounces a method
 *
 * @example
 * class MyClass {
 *   @Debounce(300)
 *   handleInput() {
 *     console.log('Input handled');
 *   }
 * }
 *
 * @param waitOrOptions Wait time in ms or options object
 */
export function Debounce(waitOrOptions: number | DebounceOptions): MethodDecorator {
  const options: DebounceOptions = typeof waitOrOptions === 'number' 
    ? { wait: waitOrOptions } 
    : waitOrOptions;
  
  const wait = options.wait || 300;
  const leading = options.leading || false;
  const trailing = options.trailing !== false; // Default to true
  
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    // Symbol for storing timeouts on the instance
    const timeoutSymbol = Symbol(`__${String(propertyKey)}_debounceTimeout`);
    
    descriptor.value = function(...args: any[]) {
      const context = this;
      const later = function() {
        (context as any)[timeoutSymbol] = null;
        
        if (trailing) {
          originalMethod.apply(context, args);
        }
      };
      
      const callNow = leading && !(context as any)[timeoutSymbol];
      
      clearTimeout((context as any)[timeoutSymbol]);
      (context as any)[timeoutSymbol] = setTimeout(later, wait);
      
      if (callNow) {
        originalMethod.apply(context, args);
      }
    };
    
    return descriptor;
  };
}

/**
 * Options for the Throttle decorator
 */
export interface ThrottleOptions {
  /** Throttle limit time in milliseconds */
  limit?: number;
  
  /** Whether to execute on the trailing edge */
  trailing?: boolean;
}

/**
 * Method decorator that throttles a method
 *
 * @example
 * class MyClass {
 *   @Throttle(300)
 *   handleScroll() {
 *     console.log('Scroll handled');
 *   }
 * }
 *
 * @param limitOrOptions Limit time in ms or options object
 */
export function Throttle(limitOrOptions: number | ThrottleOptions): MethodDecorator {
  const options: ThrottleOptions = typeof limitOrOptions === 'number' 
    ? { limit: limitOrOptions } 
    : limitOrOptions;
  
  const limit = options.limit || 300;
  const trailing = options.trailing || false;
  
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    // Symbols for storing state on the instance
    const lastCallSymbol = Symbol(`__${String(propertyKey)}_throttleLastCall`);
    const timeoutSymbol = Symbol(`__${String(propertyKey)}_throttleTimeout`);
    
    descriptor.value = function(...args: any[]) {
      const context = this;
      
      if (!(context as any)[lastCallSymbol] || 
         ((Date.now() - (context as any)[lastCallSymbol]) >= limit)) {
        
        (context as any)[lastCallSymbol] = Date.now();
        return originalMethod.apply(context, args);
      }
      
      if (trailing && !(context as any)[timeoutSymbol]) {
        (context as any)[timeoutSymbol] = setTimeout(() => {
          (context as any)[lastCallSymbol] = Date.now();
          (context as any)[timeoutSymbol] = null;
          originalMethod.apply(context, args);
        }, limit - (Date.now() - (context as any)[lastCallSymbol]));
      }
    };
    
    return descriptor;
  };
}

/**
 * Options for the Retry decorator
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  
  /** Delay between retries in milliseconds */
  delay?: number;
  
  /** Whether to use exponential backoff */
  exponential?: boolean;
  
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  
  /** Optional predicate to determine if retry should be attempted */
  retryIf?: (error: Error) => boolean;
}

/**
 * Method decorator that retries a method on failure
 *
 * @example
 * class MyClass {
 *   @Retry({ maxAttempts: 3, delay: 1000 })
 *   async fetchData(): Promise<any> {
 *     // API call that might fail
 *   }
 * }
 *
 * @param options Configuration options
 */
export function Retry(options: RetryOptions = {}): MethodDecorator {
  const maxAttempts = options.maxAttempts || 3;
  const delay = options.delay || 300;
  const exponential = options.exponential || false;
  const backoffMultiplier = options.backoffMultiplier || 2;
  const maxDelay = options.maxDelay || 30000;
  const retryIf = options.retryIf || (() => true);
  
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      let attempts = 0;
      let currentDelay = delay;
      
      while (true) {
        attempts++;
        
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          if (
            attempts >= maxAttempts ||
            !(error instanceof Error) ||
            !retryIf(error)
          ) {
            throw error;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          
          // Calculate next delay for exponential backoff
          if (exponential) {
            currentDelay = Math.min(
              currentDelay * backoffMultiplier,
              maxDelay
            );
          }
        }
      }
    };
    
    return descriptor;
  };
}

/**
 * Property decorator that makes a class property readonly
 *
 * @example
 * class MyClass {
 *   @Readonly()
 *   version = '1.0.0';
 * }
 */
export function Readonly(): PropertyDecorator {
  return function(target: Object, propertyKey: string | symbol) {
    const descriptor = {
      get: function() {
        return (target as any)[`__${String(propertyKey)}`];
      },
      set: function(value: any) {
        if ((target as any)[`__${String(propertyKey)}_initialized`]) {
          console.warn(`Attempt to modify readonly property '${String(propertyKey)}'`);
          return;
        }
        
        (target as any)[`__${String(propertyKey)}`] = value;
        (target as any)[`__${String(propertyKey)}_initialized`] = true;
      },
      enumerable: true,
      configurable: true
    };
    
    Object.defineProperty(target, propertyKey, descriptor);
  };
}

/**
 * Method parameter decorator that validates a parameter
 *
 * @example
 * class MyClass {
 *   myMethod(@Validate(value => value > 0, 'Value must be positive') value: number) {
 *     // ...
 *   }
 * }
 *
 * @param validator Validation function
 * @param message Error message if validation fails
 */
export function Validate(
  validator: (value: any) => boolean,
  message: string
): ParameterDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    const originalMethod = (target as any)[propertyKey];
    
    (target as any)[propertyKey] = function(...args: any[]) {
      if (!validator(args[parameterIndex])) {
        throw new Error(`Parameter ${parameterIndex} of ${String(propertyKey)}: ${message}`);
      }
      
      return originalMethod.apply(this, args);
    };
  };
}

/**
 * Class decorator that makes a class singleton
 *
 * @example
 * @Singleton()
 * class MyService {
 *   // ...
 * }
 */
export function Singleton(): ClassDecorator {
  return function<T extends { new(...args: any[]): object }>(constructor: T) {
    const instanceSymbol = Symbol('instance');
    
    return class Singleton extends constructor {
      constructor(...args: any[]) {
        const cls = this.constructor as any;
        
        if (cls[instanceSymbol]) {
          return cls[instanceSymbol];
        }
        
        super(...args);
        cls[instanceSymbol] = this;
      }
    };
  };
}

/**
 * Method decorator that binds a method to its class instance
 *
 * @example
 * class MyClass {
 *   @Bind()
 *   handleClick() {
 *     // 'this' always refers to the class instance
 *   }
 * }
 */
export function Bind(): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    return {
      configurable: true,
      get() {
        if (this === target) {
          return originalMethod;
        }
        
        const boundFn = originalMethod.bind(this);
        Object.defineProperty(this, propertyKey, {
          value: boundFn,
          configurable: true,
          writable: true
        });
        
        return boundFn;
      }
    };
  };
}

/**
 * Method decorator that deprecates a method
 *
 * @example
 * class MyClass {
 *   @Deprecated('Use newMethod() instead')
 *   oldMethod() {
 *     // ...
 *   }
 * }
 *
 * @param message Optional message with migration instructions
 */
export function Deprecated(message?: string): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const warningMessage = message 
        ? `DEPRECATED: ${String(propertyKey)} is deprecated. ${message}`
        : `DEPRECATED: ${String(propertyKey)} is deprecated.`;
      
      console.warn(warningMessage);
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}