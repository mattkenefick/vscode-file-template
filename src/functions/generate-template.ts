import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { assignVariables, getTemplates, ensureDirectoryExistence, ITemplate, ITemplateFile } from './helper';

/**
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
		fileContent = assignVariables(fileContent, file.inputPath, outputPath);

		// Save file
		fs.writeFileSync(outputPath, fileContent);
	});
}

/**
 * @param vscode.Uri search
 * @return Promise<void>
 */
export async function generateTemplate(fileTreeUri: vscode.Uri): Promise<void> {
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
	const quickPick: vscode.QuickPickItem = (await vscode.window.showQuickPick(quickPicks, { placeHolder: 'Select a template...' })) as vscode.QuickPickItem;
	const templateName: string = quickPick?.label as string;

	// Find template based off selection
	const selectedTemplate: ITemplate = templateDirectories.find((template) => template.name === templateName) as ITemplate;

	// Check if we have a template
	if (!selectedTemplate?.files) {
		vscode.window.showErrorMessage('No template was selected. Please try again.');
		return;
	}

	// Get list of variable filenames"[filename].js".
	// @ts-ignore
	let variableFilenames: string[] = selectedTemplate.files?.filter((file) => file.targetPath.match(/\{(.*?)\}/i)).map((file) => file.targetPath?.match(/\{(.*?)\}/i)[1] as string);
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

	// // Get API token from settings
	// if (!Settings.token) {
	// 	vscode.window.showErrorMessage('OpenAI token is not set as `gpt-template.token` in settings.');
	// 	return;
	// }

	// const language: string = await VsCodeHelper.getLanguageFromFile(fileUri);
	// const fileContent: string = await VsCodeHelper.getTextFromFile(fileUri);
	// const hasActiveDocument: boolean = VsCodeHelper.hasActiveDocument();
	// const activeDocumentText: string = VsCodeHelper.getActiveText();
	// VsCodeHelper.log(`Saving file to ${saveUri}`);
	// await VsCodeHelper.newFile(defaultText, language);
	// vscode.window.showErrorMessage('No purpose was provided. Please try again.');
}
