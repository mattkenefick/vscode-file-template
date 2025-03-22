import * as fs from 'fs';
import * as vscode from 'vscode';
import VsCodeHelper from '../utility/vscode-helper';
import { ITemplate, ITemplateFile } from '../interface';
import { assignVariables, ensureDirectoryExistence, getTemplates } from '../common/helper';
import { processVariable } from '../common/variable-processor';

/**
 * Primary entrypoint for the `generateTemplate` command.
 *
 * @param vscode.Uri search
 * @return Promise<void>
 */
export default async function generateTemplate(fileTreeUri: vscode.Uri): Promise<void> {
	const workspaceRoot = vscode.workspace.rootPath;
	const targetPath = fileTreeUri?.fsPath || workspaceRoot || '';
	const templateDirectories = getTemplates();
	const quickPicks: vscode.QuickPickItem[] = templateDirectories.map((template) => {
		const shortPath = template.path?.split('/').slice(-3).slice(0, -1).join('/');

		return {
			description: shortPath,
			label: template.name,
		};
	});

	// Ask user which template to use
	const quickPick = await vscode.window.showQuickPick(quickPicks, {
		placeHolder: 'Select a template...',
	});

	// Handle user cancellation
	if (!quickPick) {
		return;
	}

	const templateName: string = quickPick.label;
	const selectedTemplate = templateDirectories.find((template) => template.name === templateName);

	// Check if we have a template
	if (!selectedTemplate?.files) {
		vscode.window.showErrorMessage('No template was selected. Please try again.');
		return;
	}

	// Log out all the files
	// VsCodeHelper.log('Generating template files:');
	// VsCodeHelper.log(JSON.stringify(selectedTemplate));

	// Get list of variable filenames like "{filename}.js" or "{filename:pascalcase}.js"
	const variableFilenames = [
		...new Set(
			selectedTemplate.files
				.filter((file) => file.targetPath?.includes('{'))
				.map((file) => {
					// Extract just the base variable name (before any `:` transformations)
					const match = file.targetPath.match(/\{([^:}]*)/i);
					return match ? match[1] : '';
				})
				.filter(Boolean),
		),
	];

	// Log variable names
	// VsCodeHelper.log('Variable filenames found: ' + JSON.stringify(variableFilenames));

	// Gather input from the user
	const answers: Record<string, string> = {};

	for (const variable of variableFilenames) {
		const answer = await vscode.window.showInputBox({
			prompt: `Enter a value for: "${variable}"`,
		});

		// Handle user cancellation of input box
		if (answer === undefined) {
			vscode.window.showInformationMessage('Template generation cancelled.');
			return;
		}

		answers[variable] = answer;
	}

	try {
		// Generate files
		await generate(targetPath, selectedTemplate, answers);

		// Replace filenames
		replaceFilenames(targetPath, answers);

		vscode.window.showInformationMessage(`Template "${templateName}" generated successfully.`);
	} catch (error) {
		VsCodeHelper.log(`Error generating template: ${(error as Error).message}`);
		vscode.window.showErrorMessage(`Failed to generate template: ${(error as Error).message}`);
	}
}

/**
 * The `userInput` are answers for the variables, like {filename} = "myfile"
 *
 * @param string outputDirectory
 * @param ITemplate template
 * @param Record<string, string> userInput
 * @return Promise<void>
 */
async function generate(outputDirectory: string, template: ITemplate, userInput: Record<string, string>): Promise<void> {
	if (!template.files || !template.files.length) {
		throw new Error('Template has no files defined');
	}

	for (const file of template.files) {
		try {
			let outputPath: string = `${outputDirectory}/${file.targetPath}`;

			// Process any variables in the outputPath with transformations
			// This will handle patterns like {filename} and {filename:pascalcase}
			const variableMatches = [...outputPath.matchAll(/\{([^:}]*?)(?::([^}]*))?\}/g)];
			
			for (const match of variableMatches) {
				const fullMatch = match[0]; // The entire match like "{filename:pascalcase}"
				const variableName = match[1]; // Just the variable name, e.g., "filename"
				const transformation = match[2]; // The transformation, e.g., "pascalcase"
				
				// Check if we have user input for this variable
				if (variableName && userInput[variableName]) {
					let replacementValue = userInput[variableName];
					
					// If there's a transformation, process it
					if (transformation) {
						try {
							// Use the variable processor to apply the transformation
							const processedValue = await processVariable(
								`\${${variableName}:${transformation}}`, 
								userInput
							);
							replacementValue = processedValue;
						} catch (error) {
							VsCodeHelper.log(`Error processing transformation ${transformation} for ${variableName}: ${(error as Error).message}`);
						}
					}
					
					// Replace the variable in the output path
					outputPath = outputPath.replace(fullMatch, replacementValue);
				}
			}

			// Make sure full path structure exists
			ensureDirectoryExistence(outputPath);

			// Ensure input file exists
			if (!fs.existsSync(file.inputPath)) {
				VsCodeHelper.log(`File does not exist: ${file.inputPath}`);
				continue;
			}

			// Copy file.inputPath to file.outputPath
			fs.copyFileSync(file.inputPath, outputPath);

			// Log
			VsCodeHelper.log(`From -> ${file.inputPath}\nTo -> ${outputPath}`);

			// Check if file is binary
			const fileBuffer = fs.readFileSync(file.inputPath);
			const isBinary = fileBuffer.includes('\0');

			// If binary, do not replace variables
			if (isBinary) {
				continue;
			}

			// Read file content
			let fileContent = fs.readFileSync(file.inputPath, 'utf8');

			// Replace variables
			fileContent = await assignVariables(fileContent, file.inputPath, outputPath, userInput);

			// Save file
			fs.writeFileSync(outputPath, fileContent);
		} catch (error) {
			VsCodeHelper.log(`Error processing file ${file.inputPath}: ${(error as Error).message}`);
			throw error; // Re-throw to be caught by the main function
		}
	}
}

/**
 * Recursively iterate through directories and replace filenames with answer variables
 *
 * @param string dir - The directory to start the recursive search from
 * @param Record<string, string> answers - Key-value pairs of variables and their values
 * @return void
 */
function replaceFilenames(dir: string, answers: Record<string, string>): void {
	if (!dir || !fs.existsSync(dir)) {
		return;
	}

	try {
		// First check if the directory name itself contains variables and should be renamed
		let newDirPath = dir;
		let dirContainsVariable = false;

		// Check if directory path contains any variables to replace
		for (const [key, val] of Object.entries(answers)) {
			if (val && dir.includes(`{${key}}`)) {
				dirContainsVariable = true;
				newDirPath = newDirPath.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
			}
		}

		// Check for transformations in directory name
		const dirVariableMatches = [...dir.matchAll(/\{([^:}]*?)(?::([^}]*))?\}/g)];
		for (const match of dirVariableMatches) {
			const fullMatch = match[0]; // The entire match like "{filename:pascalcase}"
			const variableName = match[1]; // Just the variable name, e.g., "filename" 
			const transformation = match[2]; // The transformation, e.g., "pascalcase"
			
			if (variableName && answers[variableName]) {
				dirContainsVariable = true;
				let replacementValue = answers[variableName];
				
				// If there's a transformation, apply it directly
				if (transformation) {
					try {
						// Basic transformations
						switch (transformation) {
							case 'uppercase':
								replacementValue = replacementValue.toUpperCase();
								break;
							case 'lowercase':
								replacementValue = replacementValue.toLowerCase();
								break;
							case 'capitalize':
								replacementValue = replacementValue.charAt(0).toUpperCase() + replacementValue.slice(1);
								break;
							case 'camelcase':
								replacementValue = replacementValue
									.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
									.replace(/^[A-Z]/, (c) => c.toLowerCase());
								break;
							case 'pascalcase':
								replacementValue = replacementValue
									.replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
									.replace(/[^a-zA-Z0-9]/g, '');
								break;
							case 'kebabcase':
								replacementValue = replacementValue
									.replace(/([a-z])([A-Z])/g, '$1-$2')
									.replace(/\s+/g, '-')
									.toLowerCase();
								break;
							case 'snakecase':
								replacementValue = replacementValue
									.replace(/([a-z])([A-Z])/g, '$1_$2')
									.replace(/\s+/g, '_')
									.toLowerCase();
								break;
							default:
								VsCodeHelper.log(`Unknown transformation: ${transformation}, using original value`);
						}
					} catch (error) {
						VsCodeHelper.log(`Error processing transformation ${transformation} for directory: ${(error as Error).message}`);
					}
				}
				
				newDirPath = newDirPath.replace(fullMatch, replacementValue);
			}
		}

		// Only attempt to rename the directory if it has changed
		if (dirContainsVariable && newDirPath !== dir) {
			try {
				fs.renameSync(dir, newDirPath);
				VsCodeHelper.log(`Renamed directory: ${dir} -> ${newDirPath}`);

				// Update the working directory for the rest of the function
				dir = newDirPath;
			} catch (dirError) {
				VsCodeHelper.log(`Error renaming directory ${dir}: ${(dirError as Error).message}`);
			}
		}

		const files = fs.readdirSync(dir);

		for (const file of files) {
			const filePath = `${dir}/${file}`;

			try {
				const stat = fs.statSync(filePath);

				// Recursively process subdirectories first
				if (stat.isDirectory()) {
					replaceFilenames(filePath, answers);
					continue;
				}

				// Check if filename contains any variables to replace
				if (!file.includes('{')) {
					continue;
				}

				// Process this file to handle both simple variables and transformations
				let newFilePath = filePath;
				const variableMatches = [...file.matchAll(/\{([^:}]*?)(?::([^}]*))?\}/g)];
				
				for (const match of variableMatches) {
					const fullMatch = match[0]; // The entire match like "{filename:pascalcase}"
					const variableName = match[1]; // Just the variable name, e.g., "filename"
					const transformation = match[2]; // The transformation, e.g., "pascalcase"
					
					// Check if we have user input for this variable
					if (variableName && answers[variableName]) {
						let replacementValue = answers[variableName];
						
						// If there's a transformation, apply it directly
						if (transformation) {
							try {
								// Basic transformations
								switch (transformation) {
									case 'uppercase':
										replacementValue = replacementValue.toUpperCase();
										break;
									case 'lowercase':
										replacementValue = replacementValue.toLowerCase();
										break;
									case 'capitalize':
										replacementValue = replacementValue.charAt(0).toUpperCase() + replacementValue.slice(1);
										break;
									case 'camelcase':
										replacementValue = replacementValue
											.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
											.replace(/^[A-Z]/, (c) => c.toLowerCase());
										break;
									case 'pascalcase':
										replacementValue = replacementValue
											.replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
											.replace(/[^a-zA-Z0-9]/g, '');
										break;
									case 'kebabcase':
										replacementValue = replacementValue
											.replace(/([a-z])([A-Z])/g, '$1-$2')
											.replace(/\s+/g, '-')
											.toLowerCase();
										break;
									case 'snakecase':
										replacementValue = replacementValue
											.replace(/([a-z])([A-Z])/g, '$1_$2')
											.replace(/\s+/g, '_')
											.toLowerCase();
										break;
									default:
										VsCodeHelper.log(`Unknown transformation: ${transformation}, using original value`);
								}
							} catch (error) {
								VsCodeHelper.log(`Error processing transformation ${transformation} for ${variableName}: ${(error as Error).message}`);
							}
						}
						
						// Replace the variable in the file path
						newFilePath = newFilePath.replace(fullMatch, replacementValue);
					}
				}

				// Only rename if the path has changed
				if (newFilePath !== filePath) {
					fs.renameSync(filePath, newFilePath);
					VsCodeHelper.log(`Renamed file: ${filePath} -> ${newFilePath}`);
				}
			} catch (error) {
				VsCodeHelper.log(`Error processing file ${filePath}: ${(error as Error).message}`);
			}
		}
	} catch (error) {
		VsCodeHelper.log(`Error reading directory ${dir}: ${(error as Error).message}`);
	}
}