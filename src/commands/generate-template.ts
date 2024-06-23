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

	// Get template directories
	const templateDirectories = getTemplates();
	const quickPicks: vscode.QuickPickItem[] = Object.values(templateDirectories).map((template) => {
		const shortPath = template.path?.split('/').slice(-3).slice(0, -1).join('/');

		return {
			description: shortPath,
			label: template.name,
		};
	});

	// Ask user which template to use
	const quickPick: vscode.QuickPickItem = (await vscode.window.showQuickPick(quickPicks, {
		placeHolder: 'Select a template...',
	})) as vscode.QuickPickItem;
	const templateName: string = quickPick?.label as string;
	const selectedTemplate: ITemplate = templateDirectories.find((template) => template.name === templateName) as ITemplate;

	// Check if we have a template
	if (!selectedTemplate?.files) {
		vscode.window.showErrorMessage('No template was selected. Please try again.');
		return;
	}

	// Get list of variable filenames"[filename].js".
	let variableFilenames: string[] = selectedTemplate.files
		?.filter((file) => file.targetPath.match(/\{(.*?)\}/i))
		.map((file) => (file.targetPath?.match(/\{(.*?)\}/i) || ['', ''])[1] as string);

	variableFilenames = [...new Set(variableFilenames)];

	// Gather input from the user
	const answers: Record<string, string> = {};

	for (const variable of variableFilenames) {
		const answer: string = (await vscode.window.showInputBox({
			prompt: `Enter a value for: "${variable}"`,
		})) as string;

		answers[variable] = answer;
	}

	// Generate files
	await generate(targetPath, selectedTemplate, answers);

	// Replace filenames
	replaceFilenames(targetPath, answers);
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
	template?.files?.forEach((file: ITemplateFile) => {
		let outputPath: string = `${outputDirectory}/${file.targetPath}`;

		// Check if outputPath has a variable filename like: [filename].vue
		const variableFilename: string = outputPath.match(/\{(.*?)\}/i)?.[1] as string;

		// If variable filename, replace it with user input
		if (variableFilename) {
			const userInputValue: string = userInput[variableFilename];
			outputPath = outputPath.replace(`{${variableFilename}}`, userInputValue);
		}

		// Make sure full path structure exists
		ensureDirectoryExistence(outputPath);

		// Ensure both exist
		if (!fs.existsSync(file.inputPath)) {
			VsCodeHelper.log(`File does not exist: ${file.inputPath}`);
			return;
		}

		// Copy file.inputPath to file.outputPath
		fs.copyFileSync(file.inputPath, outputPath);

		// Log
		VsCodeHelper.log(`
			From -> ${file.inputPath}
			To -> ${outputPath}
		`);

		// Check if file is binary
		const isBinary = fs.readFileSync(file.inputPath).includes('\0');

		// If binary, do not replace
		if (isBinary) {
			return;
		}

		// Read file content
		let fileContent = fs.readFileSync(file.inputPath, 'utf8');

		// Replace variables
		fileContent = assignVariables(fileContent, file.inputPath, outputPath, userInput);

		// Save file
		fs.writeFileSync(outputPath, fileContent);
	});
}

// Recursively iterate through directories and replace filenames with answers key/val
// @ts-ignore
function replaceFilenames(dir: string = '/var/www', answers: Record<string, any> = {}) {
	fs.readdirSync(dir).forEach((file) => {
		const filePath = `${dir}/${file}`;
		const stat = fs.statSync(filePath);

		// Recursion
		if (stat.isDirectory()) {
			replaceFilenames(filePath, answers);
			return;
		}

		// Replace filename with answers key/val
		let newFilePath = filePath;

		// Replace with variables
		for (const [key, val] of Object.entries(answers)) {
			newFilePath = newFilePath.replace(`{${key}}`, (val as any).toString());
		}

		// Rename file
		fs.renameSync(filePath, newFilePath);
	});
}
