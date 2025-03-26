import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import VsCodeHelper from '../utility/vscode-helper';
import { getVariables } from '../common/helper';
import { variableProcessors, TransformType } from '../common/variable-processor';

/**
 * Command to preview all available variables in the current context using WebView
 *
 * @return Promise<void>
 */
export default async function previewVariables(): Promise<void> {
	try {
		// Get current workspace path or use home directory if no workspace
		const currentPath = vscode.workspace.rootPath || process.env.HOME || '';

		// Get user input for demo purposes
		const userInput = {
			description: 'A sample component',
			filename: 'myComponent',
		};

		// Get static variables (from settings, environment, package.json)
		const staticVariables = getVariables(currentPath, currentPath, userInput);

		// Generate variable transformations examples
		const transformationExamples = generateTransformationExamples(userInput.filename);

		// Generate enhanced variable examples
		const enhancedVariableExamples = await generateEnhancedVariableExamples();

		// Create and show the webview panel
		const panel = vscode.window.createWebviewPanel(
			'variablesPreview', // Panel ID
			'Variables Preview', // Panel title
			vscode.ViewColumn.One, // Open in the first column
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(vscode.workspace.rootPath || '', 'media'))],
			},
		);

		// Generate the HTML content for the webview
		panel.webview.html = getWebviewContent(staticVariables, userInput, transformationExamples, enhancedVariableExamples);

		vscode.window.showInformationMessage('Variables preview generated successfully.');
	} catch (error) {
		VsCodeHelper.log(`Error generating variables preview: ${(error as Error).message}`);
		vscode.window.showErrorMessage(`Error generating variables preview: ${(error as Error).message}`);
	}
}

/**
 * Generates the HTML content for the webview
 *
 * @param staticVariables The static variables from the workspace
 * @param userInput The user input variables
 * @param transformationExamples Examples of variable transformations
 * @param enhancedVariableExamples Examples of enhanced variables
 * @returns string The HTML content
 */
function getWebviewContent(
	staticVariables: Record<string, string>,
	userInput: Record<string, string>,
	transformationExamples: Record<string, string>,
	enhancedVariableExamples: Array<[string, string, string]>,
): string {
	return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boilerplate Variables Preview</title>
        <style>
            body {
                font-family: var(--vscode-editor-font-family);
                padding: 20px;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
            }
            h1, h2 {
                color: var(--vscode-editor-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 5px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 20px;
            }
            th, td {
                text-align: left;
                padding: 8px;
                border: 1px solid var(--vscode-panel-border);
            }
            th {
                background-color: var(--vscode-editor-lineHighlightBackground);
            }
            tr:nth-child(even) {
                background-color: var(--vscode-list-hoverBackground);
            }
            .code {
                font-family: 'Courier New', monospace;
                background-color: var(--vscode-textBlockQuote-background);
                padding: 2px 4px;
                border-radius: 3px;
            }
            .section {
                margin-bottom: 30px;
            }
        </style>
    </head>
    <body>
        <h1>Boilerplate Variables Preview</h1>

        <div class="section">
            <h2>Basic Variables</h2>
            <table>
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(staticVariables)
						.map(
							([key, value]) => `
                        <tr>
                            <td><span class="code">${key}</span></td>
                            <td>${value}</td>
                        </tr>
                    `,
						)
						.join('')}
                    ${Object.entries(userInput)
						.map(
							([key, value]) => `
                        <tr>
                            <td><span class="code">\${input.${key}}</span></td>
                            <td>${value}</td>
                        </tr>
                    `,
						)
						.join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Variable Transformations</h2>
            <p>Using base value: <span class="code">${userInput.filename}</span></p>
            <table>
                <thead>
                    <tr>
                        <th>Transformation</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(transformationExamples)
						.map(
							([transform, result]) => `
                        <tr>
                            <td><span class="code">\${filename:${transform}}</span></td>
                            <td>${result}</td>
                        </tr>
                    `,
						)
						.join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Enhanced Variables</h2>
            <table>
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>Example</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    ${enhancedVariableExamples
						.map(
							([name, example, result]) => `
                        <tr>
                            <td><span class="code">${name}</span></td>
                            <td><span class="code">${example}</span></td>
                            <td>${result}</td>
                        </tr>
                    `,
						)
						.join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>JavaScript Evaluation</h2>
            <table>
                <thead>
                    <tr>
                        <th>Example</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="code">\${{ Date.now() }}</span></td>
                        <td>Current timestamp</td>
                    </tr>
                    <tr>
                        <td><span class="code">\${{ variables.filename.toUpperCase() }}</span></td>
                        <td>Access and transform variables</td>
                    </tr>
                    <tr>
                        <td><span class="code">\${{ variables.package.version.split('.')[0] }}</span></td>
                        <td>Extract major version</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Variable Definition</h2>
            <p>Use triple braces to define variables for later use:</p>
            <pre><code>{{{ variables.customVar = 'Hello World' }}}

\${{ variables.customVar }}</code></pre>
        </div>

        <div class="section">
            <h2>Usage in Filenames</h2>
            <table>
                <thead>
                    <tr>
                        <th>Pattern</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span class="code">{filename}.js</span></td>
                        <td>${userInput.filename}.js</td>
                    </tr>
                    ${Object.entries(transformationExamples)
						.map(
							([transform, result]) => `
                        <tr>
                            <td><span class="code">{filename:${transform}}.js</span></td>
                            <td>${result}.js</td>
                        </tr>
                    `,
						)
						.join('')}
                </tbody>
            </table>
        </div>
    </body>
    </html>`;
}

/**
 * Generates examples of variable transformations
 *
 * @param baseValue The base value to transform
 * @return Record<string, string>
 */
function generateTransformationExamples(baseValue: string): Record<string, string> {
	const examples: Record<string, string> = {};

	// Generate examples for each transformation type
	Object.values(TransformType).forEach((transform) => {
		examples[transform] = transformValue(baseValue, transform);
	});

	return examples;
}

/**
 * Generate examples of enhanced variables
 *
 * @return Promise<Array<[string, string, string]>>
 */
async function generateEnhancedVariableExamples(): Promise<Array<[string, string, string]>> {
	const examples: Array<[string, string, string]> = [];

	// Date examples
	examples.push(['date', '${date:YYYY-MM-DD}', variableProcessors.date('YYYY-MM-DD')]);
	examples.push(['date', '${date:HH:mm:ss}', variableProcessors.date('HH:mm:ss')]);

	// UUID examples
	examples.push(['uuid', '${uuid}', variableProcessors.uuid()]);
	examples.push(['uuid', '${uuid:short}', variableProcessors.uuid('short')]);

	// Environment examples
	examples.push(['env', '${env:USER}', process.env.USER || '']);
	examples.push(['env', '${env:HOME:/default}', process.env.HOME || '/default']);

	// Counter examples
	examples.push(['counter', '${counter}', '1']);
	examples.push(['counter', '${counter:start=10}', '10']);
	examples.push(['counter', '${counter:padding=3}', '001']);

	// Git examples (these may be empty if not in a git repo)
	try {
		examples.push(['git', '${git:branch}', await variableProcessors.git('branch')]);
		examples.push(['git', '${git:author}', await variableProcessors.git('author')]);
	} catch (error) {
		examples.push(['git', '${git:branch}', '(not in a git repository)']);
	}

	return examples;
}

/**
 * Helper function to transform a value using the specified transformation
 * (Duplicated from variable-processor.ts to avoid circular dependencies)
 *
 * @param value The value to transform
 * @param transform The transformation to apply
 * @return string The transformed value
 */
function transformValue(value: string, transform: TransformType | string): string {
	if (!value) return value;

	switch (transform) {
		case TransformType.UPPERCASE:
			return value.toUpperCase();

		case TransformType.LOWERCASE:
			return value.toLowerCase();

		case TransformType.CAPITALIZE:
			return value.charAt(0).toUpperCase() + value.slice(1);

		case TransformType.CAMELCASE:
			return value.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^([A-Z])/, (m) => m.toLowerCase());

		case TransformType.PASCALCASE:
			return value.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^([a-z])/, (m) => m.toUpperCase());

		case TransformType.SNAKECASE:
			return value
				.replace(/([a-z])([A-Z])/g, '$1_$2')
				.replace(/[\s-]+/g, '_')
				.toLowerCase();

		case TransformType.KEBABCASE:
			return value
				.replace(/([a-z])([A-Z])/g, '$1-$2')
				.replace(/[\s_]+/g, '-')
				.toLowerCase();

		case TransformType.TRIM:
			return value.trim();

		default:
			return value;
	}
}
