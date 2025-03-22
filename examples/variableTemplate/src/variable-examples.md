# Variable Showcase Template

This template demonstrates the enhanced variable system in the File Template extension.

## Basic Variables

The value of `filename` is: **${input.filename}**

## String Transformations

-   Uppercase: **${filename:uppercase}**
-   Lowercase: **${filename:lowercase}**
-   Capitalize: **${filename:capitalize}**
-   CamelCase: **${filename:camelcase}**
-   PascalCase: **${filename:pascalcase}**
-   snake_case: **${filename:snakecase}**
-   kebab-case: **${filename:kebabcase}**

## Date and Time

-   Today's date: **${date:YYYY-MM-DD}**
-   Current time: **${date:HH:mm:ss}**
-   Full timestamp: **${date:YYYY-MM-DD HH:mm:ss}**

## UUIDs

-   Standard UUID: **${uuid}**
-   Short UUID: **${uuid:short}**

## Counter Examples

-   Simple Counter: **${counter}**
-   Counter with Start: **${counter:start=10}**
-   Counter with Padding: **${counter:padding=3}**
-   Counter with Step: **${counter:step=5}**
-   Combined Counter: **${counter:start=100:step=10:padding=4}**

## Environment Information

-   User's HOME: **${env:HOME:/not-found}**
-   Username: **${env:USERNAME:anonymous}**

## Git Information

-   Branch: **${git:branch}**
-   Repository: **${git:repo}**
-   Author: **${git:author}**
-   Email: **${git:email}**

## JavaScript Evaluation

You can also use JavaScript expressions with the `{{{ }}}` syntax:

```javascript
{
	{
		{
			// This will be executed as JavaScript
			variables.calculatedValue = 40 + 2;
			variables.timestamp = Date.now();
			variables.randomNumber = Math.floor(Math.random() * 100);
		}
	}
}
```

Calculated value: ${{ variables.calculatedValue }}
Timestamp: ${{ variables.timestamp }}
Random number: ${{ variables.randomNumber }}

## Combining with Conditionals

You can use the JavaScript evaluation to create conditionals:

```javascript
{
	{
		{
			// Example conditional logic
			// Initialize the filename variable if it doesn't exist
			variables.filename = variables.filename || '';
			
			if (variables.filename.toLowerCase().includes('component')) {
				variables.fileType = 'Component';
			} else if (variables.filename.toLowerCase().includes('service')) {
				variables.fileType = 'Service';
			} else {
				variables.fileType = 'Generic';
			}
		}
	}
}
```

This file is a: ${{ variables.fileType }}

## Regular Template Variables

Any variables defined in your settings.json will also be available:

-   Example: **${foo}**
