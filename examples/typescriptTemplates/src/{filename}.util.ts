/**
 * ${filename:pascalcase} Utility
 * 
 * @description Utility functions for ${filename:lowercase} operations
 * @author ${env:USER}
 * @created ${date:YYYY-MM-DD}
 * @version 1.0.0
 */

/**
 * Configuration options for ${filename:pascalcase}Util operations
 */
export interface ${filename:pascalcase}UtilOptions {
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Default date format to use
   */
  defaultDateFormat?: string;
  
  /**
   * Default string encoding
   */
  defaultEncoding?: 'utf8' | 'base64' | 'hex';
  
  /**
   * Default precision for number operations
   */
  precision?: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: ${filename:pascalcase}UtilOptions = {
  debug: false,
  defaultDateFormat: 'YYYY-MM-DD',
  defaultEncoding: 'utf8',
  precision: 2
};

/**
 * ${filename:pascalcase} Utility class
 */
export class ${filename:pascalcase}Util {
  private _options: ${filename:pascalcase}UtilOptions;
  
  /**
   * Create a new ${filename:pascalcase}Util instance
   * 
   * @param options Configuration options
   */
  constructor(options: ${filename:pascalcase}UtilOptions = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Get the current options
   */
  get options(): Readonly<${filename:pascalcase}UtilOptions> {
    return { ...this._options };
  }
  
  /**
   * Update options
   * 
   * @param options New options to merge with existing ones
   * @returns The current instance for chaining
   */
  setOptions(options: Partial<${filename:pascalcase}UtilOptions>): ${filename:pascalcase}Util {
    this._options = { ...this._options, ...options };
    return this;
  }
  
  /**
   * Format a date with the default or specified format
   * 
   * @param date The date to format
   * @param format Optional format override
   * @returns Formatted date string
   */
  formatDate(date: Date | string | number, format?: string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateFormat = format || this._options.defaultDateFormat || 'YYYY-MM-DD';
    
    // Simple format implementation
    const tokens: Record<string, () => string> = {
      YYYY: () => dateObj.getFullYear().toString(),
      MM: () => (dateObj.getMonth() + 1).toString().padStart(2, '0'),
      DD: () => dateObj.getDate().toString().padStart(2, '0'),
      HH: () => dateObj.getHours().toString().padStart(2, '0'),
      mm: () => dateObj.getMinutes().toString().padStart(2, '0'),
      ss: () => dateObj.getSeconds().toString().padStart(2, '0'),
      SSS: () => dateObj.getMilliseconds().toString().padStart(3, '0')
    };
    
    return Object.keys(tokens).reduce(
      (result, token) => result.replace(token, tokens[token]()),
      dateFormat
    );
  }
  
  /**
   * Parse a date string using the default or specified format
   * 
   * @param dateStr The date string to parse
   * @param format Optional format override
   * @returns Parsed Date object
   */
  parseDate(dateStr: string, format?: string): Date {
    // This is a simplified implementation
    // In a real utility, you would implement proper format parsing
    return new Date(dateStr);
  }
  
  /**
   * Format a number with the default or specified precision
   * 
   * @param value The number to format
   * @param precision Optional precision override
   * @returns Formatted number string
   */
  formatNumber(value: number, precision?: number): string {
    const p = precision ?? this._options.precision ?? 2;
    return value.toFixed(p);
  }
  
  /**
   * Generate a random string with the specified length
   * 
   * @param length The length of the random string
   * @param charset The characters to use (default: alphanumeric)
   * @returns Random string
   */
  randomString(length: number = 8, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
    
    return result;
  }
  
  /**
   * Generate a random ID
   * 
   * @param prefix Optional prefix
   * @returns Random ID
   */
  generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 10);
    return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
  }
  
  /**
   * Encode a string using the specified encoding
   * 
   * @param str The string to encode
   * @param encoding The encoding to use
   * @returns Encoded string
   */
  encodeString(str: string, encoding?: 'base64' | 'hex'): string {
    const enc = encoding || this._options.defaultEncoding;
    
    if (enc === 'base64') {
      return btoa(str);
    } else if (enc === 'hex') {
      return this._stringToHex(str);
    }
    
    return str;
  }
  
  /**
   * Decode a string using the specified encoding
   * 
   * @param str The string to decode
   * @param encoding The encoding to use
   * @returns Decoded string
   */
  decodeString(str: string, encoding?: 'base64' | 'hex'): string {
    const enc = encoding || this._options.defaultEncoding;
    
    if (enc === 'base64') {
      return atob(str);
    } else if (enc === 'hex') {
      return this._hexToString(str);
    }
    
    return str;
  }
  
  /**
   * Truncate a string to the specified length
   * 
   * @param str The string to truncate
   * @param maxLength The maximum length
   * @param suffix The suffix to add (default: '...')
   * @returns Truncated string
   */
  truncateString(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
      return str;
    }
    
    return str.substring(0, maxLength - suffix.length) + suffix;
  }
  
  /**
   * Slugify a string (convert to lowercase, replace spaces with hyphens, remove special chars)
   * 
   * @param str The string to slugify
   * @returns Slugified string
   */
  slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
      .trim();
  }
  
  /**
   * Convert a string to camelCase
   * 
   * @param str The string to convert
   * @returns camelCase string
   */
  toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
  }
  
  /**
   * Convert a string to PascalCase
   * 
   * @param str The string to convert
   * @returns PascalCase string
   */
  toPascalCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
  }
  
  /**
   * Convert a string to snake_case
   * 
   * @param str The string to convert
   * @returns snake_case string
   */
  toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/^_/, '')
      .replace(/[^a-z0-9_]/g, '');
  }
  
  /**
   * Convert a string to kebab-case
   * 
   * @param str The string to convert
   * @returns kebab-case string
   */
  toKebabCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^-/, '')
      .replace(/[^a-z0-9-]/g, '');
  }
  
  /**
   * Check if a value is empty (null, undefined, empty string, empty array, empty object)
   * 
   * @param value The value to check
   * @returns True if empty
   */
  isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }
  
  /**
   * Check if a value is a valid email address
   * 
   * @param value The value to check
   * @returns True if valid email
   */
  isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  /**
   * Check if a value is a valid URL
   * 
   * @param value The value to check
   * @returns True if valid URL
   */
  isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Deep clone an object
   * 
   * @param obj The object to clone
   * @returns Cloned object
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    const cloned: Record<string, any> = {};
    
    Object.keys(obj as Record<string, any>).forEach(key => {
      cloned[key] = this.deepClone((obj as Record<string, any>)[key]);
    });
    
    return cloned as T;
  }
  
  /**
   * Deep merge two objects
   * 
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   */
  deepMerge<T extends Record<string, any>, U extends Record<string, any>>(target: T, source: U): T & U {
    const output = { ...target } as T & U;
    
    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
  
  /**
   * Log a debug message if debug mode is enabled
   * 
   * @param message The message to log
   * @param data Additional data to log
   */
  debug(message: string, ...data: any[]): void {
    if (this._options.debug) {
      console.log(`[${filename:pascalcase}Util] ${message}`, ...data);
    }
  }
  
  /**
   * Convert a string to hexadecimal
   * 
   * @param str The string to convert
   * @returns Hex string
   * @private
   */
  private _stringToHex(str: string): string {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      hex += charCode.toString(16).padStart(2, '0');
    }
    return hex;
  }
  
  /**
   * Convert a hexadecimal string to a regular string
   * 
   * @param hex The hex string to convert
   * @returns Decoded string
   * @private
   */
  private _hexToString(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substr(i, 2), 16);
      str += String.fromCharCode(charCode);
    }
    return str;
  }
  
  /**
   * Check if a value is an object
   * 
   * @param item The value to check
   * @returns True if object
   * @private
   */
  private _isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

// Export a singleton instance with default options
export const ${filename:camelcase}Util = new ${filename:pascalcase}Util();

// Also export the class for custom instantiation
export default ${filename:pascalcase}Util;