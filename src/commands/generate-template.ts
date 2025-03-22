import * as fs from 'fs';
import * as vscode from 'vscode';
import VsCodeHelper from '../utility/vscode-helper';
import { ITemplate, ITemplateFile } from '../interface';
import { assignVariables, ensureDirectoryExistence, getTemplates } from '../common/helper';

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

	// Get list of variable filenames like "{filename}.js"
	const variableFilenames = [
		...new Set(
			selectedTemplate.files
				.filter((file) => file.targetPath.includes('{'))
				.map((file) => {
					const match = file.targetPath.match(/\{(.*?)\}/i);
					return match ? match[1] : '';
				})
				.filter(Boolean),
		),
	];

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

			// Check if outputPath has a variable filename like: {filename}.vue
			const match = outputPath.match(/\{(.*?)\}/i);
			const variableFilename = match ? match[1] : null;

			// If variable filename, replace it with user input
			if (variableFilename && userInput[variableFilename]) {
				outputPath = outputPath.replace(`{${variableFilename}}`, userInput[variableFilename]);
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
			fileContent = assignVariables(fileContent, file.inputPath, outputPath, userInput);

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
		const files = fs.readdirSync(dir);

		for (const file of files) {
			const filePath = `${dir}/${file}`;

			try {
				const stat = fs.statSync(filePath);

				// Recursively process subdirectories
				if (stat.isDirectory()) {
					replaceFilenames(filePath, answers);
					continue;
				}

				// Check if filename contains any variables to replace
				if (!file.includes('{')) {
					continue;
				}

				// Replace filename with answers key/val
				let newFilePath = filePath;

				// Replace all variables in the filename
				for (const [key, val] of Object.entries(answers)) {
					if (val) {
						newFilePath = newFilePath.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
					}
				}

				// Only rename if the path has changed
				if (newFilePath !== filePath) {
					fs.renameSync(filePath, newFilePath);
					VsCodeHelper.log(`Renamed: ${filePath} -> ${newFilePath}`);
				}
			} catch (error) {
				VsCodeHelper.log(`Error processing file ${filePath}: ${(error as Error).message}`);
			}
		}
	} catch (error) {
		VsCodeHelper.log(`Error reading directory ${dir}: ${(error as Error).message}`);
	}
}
