# VS Code File Template Development Guide

## Build & Test Commands
- Build: `yarn compile` or `yarn package`
- Lint: `yarn lint`
- Test: `yarn test`
- Run single test: `mocha --require ts-node/register path/to/test.ts`
- Watch for changes: `yarn test-watch`

## Code Style Guidelines
- **Imports**: Use named imports with explicit paths. Prefer destructuring where appropriate.
- **Types**: Use TypeScript interfaces with 'I' prefix. Explicitly type parameters and return values.
- **Formatting**: Use tabs for indentation, single quotes for strings, and trailing semicolons.
- **Naming**: camelCase for variables/functions, PascalCase for classes, ALL_CAPS for constants.
- **Error Handling**: Use try/catch blocks, log errors with VsCodeHelper.log and display user messages.
- **Functions**: Document with JSDoc, use async/await for asynchronous operations.
- **Organization**: Keep related functionality in dedicated modules under appropriate folders.

This is a VSCode extension that helps users create and manage file and folder templates (boilerplates).