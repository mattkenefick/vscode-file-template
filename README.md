<img src="./assets/hero.jpg" width="100%" />

<h3 align="center">
	Streamline your workflow by effortlessly unpacking folders of templates.
</h3>

<p align="center">
	<a href="https://marketplace.visualstudio.com/items?itemName=PolymerMallard.global-boilerplate" title="Visual Studio Marketplace Version"><img src="https://img.shields.io/visual-studio-marketplace/v/PolymerMallard.global-boilerplate.svg" /></a>
	<a href="https://marketplace.visualstudio.com/items?itemName=PolymerMallard.global-boilerplate" title="Visual Studio Marketplace Installs"><img src="https://img.shields.io/visual-studio-marketplace/i/PolymerMallard.global-boilerplate.svg" /></a>
	<a href="https://paypal.me/polymermallard" title="Backers on Paypal"><img src="https://img.shields.io/badge/backer-Paypal-blue.svg" /></a>
</p>

<hr />

### 0A. Your first Boilerplate

We start by creating a new template in our workspace. You'll be able to put anything in the `src` folder once it's created.

1. Open the Command Palette (_Cmd+Shift+P_)
2. Find `> ⎖ Boilerplate!: Create new boilerplate...`
3. Select `$WORKSPACE/.vscode/templates`
4. Type "My First Extension"

> The template includes a `src/example.txt` that displays some available variables and how to use them. We explore this further down below in `2. Configuration`.

### 0B. Import from Gist

If you've found a [public gist](https://gist.github.com/) you'd like to use, you can do the following:

1. Open Command Palette(_Cmd+Shift+P_) and find `> ⎖ Boilerplate!: Import from gist...`
2. Select the folder you'd like to save it to _(e.g. home vs workspace)_
3. Enter a name for the boilerplate
4. Paste the full URL or Gist ID into the prompt

It will fetch and download files from the public gist into the folder/name you've specified.

Here's a [sample gist](https://gist.github.com/mattkenefick/6fd1c869b36b6bda5c36bde54d63a8d1) you can try that includes a few dot files such as `.gitignore`, `.editorconfig`, etc.

# Usage

![Example](assets/example.gif)

You can unpack a boilerplate directly to the root of your project using the Command Panel or you can unpack into a specific directory by right clicking and using the context menu.

1. Right click a folder in the Explorer
2. Select `⎖ Boilerplate!: Generate here...`
3. Choose a boilerplate
4. Fill in required inputs (optional)

### 2. Configuration

The files in your boilerplate can evaluate variables, execute code, and apply user input to filenames. There are several types of variables available inside your templates.

1. Variables defined in your Code settings
2. Variables defined in `process.env`
3. A local `package.json` file (if available)
4. User defined input (asked by plugin)
5. Custom in-template contexts

#### General usage

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

#### Custom Variables

Hardcoded variables with no special wrappings. You can add these to your User Settings.

```
"global-boilerplate.variables": {
	"${lorem}": "Lorem ipsum sit amet dolor.",
	"${my-variable}": "Hello World."
}
```

These would be accessible in your template via `${lorem}` and `${my-variable}`.

#### Evaluated Variables

You can include dynamic JavaScript evaluations by using a syntax like this:

```
${{ Date.now() }}
```

It will automatically return the value evaluated without need for a `return` statement. Within this context, all variables are available on an object called `variables`, so an example from above would become:

```
variables.foo
variables.env.USER
variables.package.version
```

Note that multidimensional objects are flattened with an underscore rather than a period. These variables are accessible through the evaluation, so you could do something like:

```
// Input
User: ${{ variables.env.USER }}
Modified: ${{ variables.env.USER.toUpperCase() }}

// Output
User: polymermallard
Modified: POLYMERMALLARD
```

This can be combined into more complex situations like these:

```
${{
	const [major, minor, patch] = variables.package.version.split('.');

	`Major: ${major}\nMinor: ${minor}\nPatch: ${patch}`
}}
```

and

```
${{
	if (variables.package.author.indexOf('Kenefick') > -1) {
		`It's Matt.`
	}
	else {
		`It's someone else.`
	}
}}
```

#### Evaluated Contexts

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

### 3. Template Locations

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
