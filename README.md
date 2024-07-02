<img src="./assets/hero.jpg" width="100%" />

<div style="text-align: center; padding: 2rem;">
	<a href="https://marketplace.visualstudio.com/items?itemName=PolymerMallard.global-boilerplate" title="Visual Studio Marketplace Version">
		<img src="https://img.shields.io/visual-studio-marketplace/v/PolymerMallard.global-boilerplate.svg" />
	</a>
	<a href="https://marketplace.visualstudio.com/items?itemName=PolymerMallard.global-boilerplate" title="Visual Studio Marketplace Installs">
		<img src="https://img.shields.io/visual-studio-marketplace/i/PolymerMallard.global-boilerplate.svg" />
	</a>
	<a href="https://paypal.me/polymermallard" title="Backers on Paypal">
		<img src="https://img.shields.io/badge/backer-Paypal-blue.svg" />
	</a>
	<p style="font-size: 1.25rem; padding: 2rem;">
		Streamline your workflow by effortlessly unpacking folders of templates.
	</p>
</div>

## 0A. Your first Boilerplate

We start by creating a new template in our workspace.

1. Open Command Palette(_Cmd+Shift+P_) and find `> ⎖ Boilerplate!: Create new boilerplate...`
2. Select `$WORKSPACE/.vscode/templates`
3. Type "My First Extension"

You now have a working sample template. Anything put in the `src` folder will be processed and created when applying a boilerplate.

> The template includes a `src/example.txt` that displays some available variables and how to use them. We explore this further down below in `2. Configuration`.

Open a new project, press _Cmd+Shift+P_, and select `> ⎖ Boilerplate!: Generate here...` You should now see the "My First Extension" available in the dropdown. After selecting that, you will see the files appear in the root of your project.

If you'd like to unpack them into a specific folder, you can right click the folder and find `> ⎖ Boilerplate!: Generate here...` at the bottom of the context menu.

## 0B. Import from Gist

If you've found a [public gist](https://gist.github.com/) you'd like to use, you can do the following:

1. Open Command Palette(_Cmd+Shift+P_) and find `> ⎖ Boilerplate!: Import from gist...`
2. Select the folder you'd like to save it to _(e.g. home vs workspace)_
3. Enter a name for the boilerplate
4. Paste the full URL or Gist ID into the prompt

It will fetch and download files from the public gist into the folder/name you've specified.

Here's a [sample gist](https://gist.github.com/mattkenefick/6fd1c869b36b6bda5c36bde54d63a8d1) you can try that includes a few dot files such as `.gitignore`, `.editorconfig`, etc.

![Example](assets/example.gif)

## 1. Usage

1. Right click a folder in the Explorer and select `⎖ Boilerplate!: Generate here...`
2. Select boilerplate to apply
3. Add any required inputs (optional)

<div style="text-align: center">
	<img src="./assets/screenshot-generate-here-b.png" height="75" />
</div>

If you don't select a specific folder in the Explorer, the boilerplate will be applied to the root of your workspace.

## 2. Configuration

The files in your boilerplate can evaluate variables, execute code, and apply user input to filenames. There are several types of variables available inside your templates.

1. Variables defined in your Code settings
2. Variables defined in `process.env`
3. A local `package.json` file (if available)
4. User defined input (asked by plugin)
5. Custom in-template contexts

### General usage

Basic variables can be applied in the following ways:

```
${foo}
${env.USER}
${package.version}
```

User-defined input variables _(as asked by the plugin)_ are namespaced under `input`. These would show up if you named a file `{filename}.json` or similar.

```
${input.filename}
```

We automatically include the environment variables and the nearest `package.json` file we can find.

> **Note:** _We start looking for a `package.json` in the path you've selected and search upwards for the nearest one. This allows you to have multiple projects open in a workspace but still use the most accurate manifest._

### Custom Variables

Hardcoded variables with no special wrappings. You can add these to your User Settings.

```
"global-boilerplate.variables": {
	"${lorem}": "Lorem ipsum sit amet dolor.",
	"${my-variable}": "Hello World."
}
```

These would be accessible in your template via `${lorem}` and `${my-variable}`.

### Evaluated Variables

You can include dynamic JavaScript evaluations by using a syntax like this:

```
${{ Date.now() }}
```

It will automatically return the value evaluated without need for a `return` statement. Within this context, all variables are available on a flattened object called `variables`, so an example from above would become:

```
variables.foo
variables.env_USER
variables.package_version
```

Note that multidimensional objects are flattened with an underscore rather than a period. These variables are accessible through the evaluation, so you could do something like:

```
// Input
User: ${{ variables.env_USER }}
Modified: ${{ variables.env_USER.toUpperCase() }}

// Output
User: polymermallard
Modified: POLYMERMALLARD
```

This can be combined into more complex situations like these:

```
${{
	const [major, minor, patch] = variables.package_version.split('.');

	`Major: ${major}\nMinor: ${minor}\nPatch: ${patch}`
}}
```

and

```
${{
	if (variables.package_author.indexOf('Kenefick') > -1) {
		`It's Matt.`
	}
	else {
		`It's someone else.`
	}
}}
```

### Evaluated Contexts

The evaluated variables are powerful but sometimes you want to reuse them or perform more complex tasks. For that, we have a special syntax where you can define variables for future use.

```
Example:

{{{ variables.myVariable = 'This is my variable'.split(' ').join('-') }}}

${{ variables.myVariable }}
```

The generated output for this is:

```
Example:

This-is-my-variable
```

> If any evaluated context fails, the subsequent contexts will NOT BE PROCESSED so make sure your code works.

## 3. Template Locations

You can specify where the extension searches for templates by defining paths in the Code settings file.

```
"global-boilerplate.templateDirectories": [
	".vscode/templates",
	"$HOME/VSCodeTemplates"
]
```

The following variables will be evaluated when searching the system:

```
~ = process.env.HOME
$HOME = process.env.HOME
$WORKSPACE= workspaceRoot
```

## Release Notes

### 1.2.1

-   Boilerplate! renamed and refactored

### 0.2.1

-   Modify template to include `src/` by default

### 0.2.0

-   Add dynamic filenames
-   Improve variables and add ability to set them
-   Add examples
-   Update README

### 0.1.0

-   Initial release
