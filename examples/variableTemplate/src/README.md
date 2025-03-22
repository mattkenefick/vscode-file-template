# Enhanced Variable System

The File Template extension now supports an enhanced variable system that provides powerful functionality beyond simple text replacement.

## Variable Types

### Basic Variables

-   `${input.varname}` - User input variables

### Transformations

Apply transformations to your variables:

-   `${varname:uppercase}` - Convert to UPPERCASE
-   `${varname:lowercase}` - Convert to lowercase
-   `${varname:capitalize}` - Capitalize First Letter
-   `${varname:camelcase}` - convertToCamelCase
-   `${varname:pascalcase}` - ConvertToPascalCase
-   `${varname:snakecase}` - convert_to_snake_case
-   `${varname:kebabcase}` - convert-to-kebab-case
-   `${varname:trim}` - Remove surrounding whitespace

### Date and Time

-   `${date:YYYY-MM-DD}` - Current date (2023-04-15)
-   `${date:HH:mm:ss}` - Current time (14:30:45)
-   `${date:YYYY-MM-DD HH:mm:ss}` - Full timestamp

### UUIDs

-   `${uuid}` - Generate a UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)
-   `${uuid:short}` - Generate a short UUID (e.g., 123e4567e89b)

### Counters

-   `${counter}` - Simple counter starting at 1
-   `${counter:start=10}` - Counter starting at 10
-   `${counter:step=5}` - Counter with step of 5
-   `${counter:padding=3}` - Counter with zero padding (001, 002, etc.)
-   `${counter:start=100:step=10:padding=4}` - Combined counter options

### Environment Variables

-   `${env:HOME}` - Access environment variables
-   `${env:USERNAME:default}` - With default value if not found

### Git Information

-   `${git:branch}` - Current git branch
-   `${git:author}` - Git author name
-   `${git:email}` - Git author email
-   `${git:repo}` - Repository name

## JavaScript Evaluation

For more complex logic, use the JavaScript evaluation syntax:

```
{{{
  // JavaScript code here
  variables.calculatedValue = 40 + 2;
  variables.timestamp = Date.now();
}}}
```

Then use the calculated values with:

```
${{ variables.calculatedValue }}
${{ variables.timestamp }}
```

## Example Usage

In your template files, you can use these variables like:

```typescript
/**
 * ${filename:pascalcase} Component
 * Created on ${date:YYYY-MM-DD} by ${git:author}
 * ID: ${uuid:short}
 */

export class ${filename:pascalcase}Component {
    // Your component code here
}
```

When you generate a file from this template, all variables will be automatically processed and replaced with their computed values.
