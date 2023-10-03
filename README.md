# New from Template

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/polymermallard.file-template.svg)](https://marketplace.visualstudio.com/items?itemName=polymermallard.new-from-template)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/polymermallard.file-template.svg)](https://marketplace.visualstudio.com/items?itemName=polymermallard.new-from-template)
[![Backers on Patreon](https://img.shields.io/badge/backer-Patreon-orange.svg)](https://www.patreon.com/mattkenefick)
[![Backers on Paypal](https://img.shields.io/badge/backer-Paypal-blue.svg)](https://paypal.me/polymermallard)

Creates a new file/folder structure from user-defined templates capable of logic and variables.

![Example](assets/file-template.gif)

## Quickstart

First, we need to create a template to use.

1. Create a new template pressing _Cmd+Shift+P_ and ">File Template: New template"
2. Select `$WORKSPACE/.vscode/templates`
3. Write "My First Extension" in the prompt
4. Add new file(s) in this newly opened project

You now have a working template. Go to a different project and press _Cmd+Shift+P_ and ">File Template: Generate here..." You should now see the "My First Extension" available in the dropdown. After selecting that, you should see your files appear in the project.

Read further to learn more about structuring your templates and using dynamic code/variables.

## Usage

1. Right click a file in the tree explorer and select "File Template: Generate here..." or using the action bar (_Cmd+Shift+P_)
2. Select template to use
3. Add any required inputs (optional)

<div style="text-align: center">
	<img src="./assets/screenshot-generate-here-b.png" height="75" />
</div>

If you don't use the file Explorer tree (left panel), it will add your template to the root of current folder structure.

## Configuration

You can define custom variables to use in the scripts and multiple locations for templates via settings. We automatically include variables from `process.env` and the nearest `package.json`, if there's one available. There are a couple examples in the `examples` directory demonstrating a range of functionality for templates.

---

To use `env` vars, you can add them like so:

```
My Home: ${env.HOME}
My User: ${env.USER}
```

To use `package.json` vars:

```
${package.name}
${package.version}
...
```

**Note:** _We start looking for a `package.json` in the path you've selected and search upwards for the nearest one. This allows you to have multiple projects open in a workspace but still use the most accurate manifest._

### Custom Variables

Hardcoded variables with no special wrappings. You can add these to your User Settings.

```
	"new-from-template.variables": {
		"${lorem}": "Lorem ipsum sit amet dolor adipiscing elit et al.",
		"${my-variable}": "Hello World."
	}
```

These would be accessible in your template through `${lorem}` and `${my-variable}`.

### Template Locations

Identify where templates can be found. You can add these to your User Settings.

```
	"new-from-template.templateDirectories": [
		".vscode/templates",
		"$HOME/VSCodeTemplates"
	]
```

Available variables are:

```
~ = process.env.HOME
$HOME = process.env.HOME
$WORKSPACE= workspaceRoot
```

### Evaluated Code

You can evaluate code / conditionals within the templates using a special syntax. It's executed through `eval()` in the NodeJS environment.

```
// Print date
${{ Date.now() }}

// Access variables from process.env, package, and anything user defined
// Note that `package.version` becomes `package_version` in this context
${{ variables.package_version }}

// Special path variables (interpreted)
${{ workspaceRoot }}
${{ inputPathRelative }}
${{ outputPathRelative }}
${{ inputDirectory }}
${{ outputDirectory }}
${{ inputDirectoryRelative }}
${{ outputDirectoryRelative }}
${{ inputFilename }}
${{ outputFilename }}

// Performing operations
${{
	const [major, minor, patch] = variables.package_version.split('.');

	`Major: ${major}\nMinor: ${minor}\nPatch: ${patch}`
}}

// Conditionals
${{
	if (variables.package_author.indexOf('Kenefick') > -1) {
		`It's Matt.`
	}
	else {
		`It's someone else.`
	}
}}

// Setting variables (note the syntax change)
${--
	variables.myVariable = 'My Variable'
--}

Value: ${{ variables.myVariable }}
Value Upper: ${{ variables.myVariable.toUpperCase() }}
```

## Creating a template

This extension will search for folders within your `new-from-template.templateDirectories` list. Every extension must have a `manifest.json` file.

```
{
	"name": "My Extension"
}
```

Or if you want to have your files in a subdirectory:

```
{
	"name": "My Extension",
	"rootDir": "src"
}
```

All files (except the manifest) will be copied to the directory you select. Binary files are transferred over without modifiction. ASCII files are evaluated for variables.

By default, the filenames are the same. If you need a dynamic filename(s), you can wrap a variable in brackets like so:

```
{filename}.vue
{filename}-123.vue
```

This will prompt the user to provide a value for `filename`. If they input "Batman", you will get a directory like this:

```
Batman.vue
Batman-123.vue
```

## Release Notes

### 0.2.0

-   Add dynamic filenames
-   Improve variables and add ability to set them
-   Add examples
-   Update README

### 0.1.0

-   Initial release
