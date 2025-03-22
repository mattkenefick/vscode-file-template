# TypeScript Templates

This collection provides comprehensive TypeScript templates for common patterns and use cases. These templates are designed to help you quickly scaffold well-structured TypeScript code with best practices built in.

## Available Templates

### 1. Interface Template (`{filename}.interface.ts`)

A comprehensive interface definition with:
- Base and extended interfaces
- Enums for status values
- Configuration interface
- Search parameters interface
- Type guards

### 2. Class Template (`{filename}.ts`)

A full-featured TypeScript class with:
- Private properties and public getters/setters
- EventEmitter implementation
- State management
- Timeout and resource management
- Error handling and retry logic
- JSON serialization

### 3. Service Template (`{filename}.service.ts`)

A service class using dependency injection with:
- CRUD operations
- Caching mechanism
- Filter and search capabilities
- Error handling
- Event publishing
- Transaction support

### 4. Store Template (`{filename}.store.ts`)

A state management store with:
- Reactive state updates
- Actions and reducers
- Selectors for derived state
- Async action support
- Immutable state handling

### 5. Utility Template (`{filename}.util.ts`)

A utility class with:
- String manipulation functions
- Date and number formatting
- Random ID generation
- Object cloning and merging
- Validation helpers

### 6. Decorators Template (`{filename}.decorators.ts`) 

A collection of TypeScript decorators:
- `@Log` - For method logging
- `@Memoize` - For caching method results
- `@Debounce` - For rate-limiting method calls
- `@Throttle` - For controlling method execution frequency
- `@Retry` - For automatic retry on failure
- `@Readonly` - For immutable properties
- `@Validate` - For parameter validation
- `@Singleton` - For ensuring single instance
- `@Bind` - For method binding to instance
- `@Deprecated` - For marking deprecated methods

## Usage

When you select one of these templates, you'll be prompted to provide a value for `{filename}`. This value will be used throughout the template files, automatically transformed into appropriate cases:

| Transformation | Example (if filename = "user_profile") |
|----------------|---------------------------------------|
| `${filename}`  | user_profile                          |
| `${filename:pascalcase}` | UserProfile                 |
| `${filename:camelcase}`  | userProfile                 |
| `${filename:kebabcase}`  | user-profile                |
| `${filename:lowercase}`  | userprofile                 |

## Features Demonstrated

These templates showcase several powerful features of the File Template extension:

- **Variable Transformations** - Converting your input to different case styles
- **Date Variables** - Including creation dates in various formats
- **Environment Variables** - Including user information
- **Clean Code Practices** - Following TypeScript best practices
- **Advanced Patterns** - Implementing common software design patterns

## Customization

Feel free to modify these templates to match your specific project requirements or coding standards. Some common customizations:

1. Change the import style (ES modules vs CommonJS)
2. Adjust error handling strategies
3. Modify the annotation style
4. Add project-specific interfaces or types
5. Integrate with specific libraries or frameworks

## Best Practices

These templates follow TypeScript best practices:
- Strong typing with interfaces and generics
- Access modifiers (public/private)
- Immutability where appropriate
- Error handling
- Documentation with JSDoc comments