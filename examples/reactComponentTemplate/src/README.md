# React Component Template

This template generates a complete React component package with TypeScript, including:

-   Main component file with TypeScript types (`{filename}.tsx`)
-   CSS styles (`{filename}.css`)
-   Unit tests (`{filename}.test.tsx`)
-   Storybook stories (`{filename}.stories.tsx`)

## Usage

When you select this template, you'll be prompted to provide a value for `{filename}`.
This value will be used throughout the template files.

For example, if you enter "UserProfile" for the filename, the template will generate:

-   `UserProfile.tsx`
-   `UserProfile.css`
-   `UserProfile.test.tsx`
-   `UserProfile.stories.tsx`

## Features

This template demonstrates several powerful features of the File Template extension:

### Variable Transformations

The template applies different case transformations to your filename:

-   `${filename:pascalcase}` - UserProfile
-   `${filename:kebabcase}` - user-profile
-   `${filename:lowercase}` - userprofile

### Date Variables

The template includes the creation date in various formats:

-   `${date:YYYY-MM-DD}` - 2023-04-15

### UUID Generation

Unique identifiers are generated with:

-   `${uuid:short}` - A shorter UUID

### Counters

Sequential numbers are generated with:

-   `${counter:start=100}` - 100, 101, 102...
-   `${counter:start=1000:padding=4}` - 1000, 1001, 1002...

### Environment Variables

The current user is included with:

-   `${env:USER}` - current system user

### Advanced JavaScript Evaluation

The template demonstrates conditional rendering and JavaScript evaluation using the `${{ }}` syntax.

## Customization

You can easily customize this template:

1. Add or modify props in the component interface
2. Change the styling in the CSS file
3. Update the tests for your specific use cases
4. Customize the Storybook stories for your component

## Best Practices

This template follows React best practices:

-   Proper TypeScript typing
-   Functional components with hooks
-   Responsive design with media queries
-   Accessibility features
-   Comprehensive test coverage
-   Dark mode support
