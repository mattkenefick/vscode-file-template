import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';

/**
 * @type interface
 */
interface ITemplateFile {
	inputPath: string;
	targetPath: string;
}

/**
 * @type interface
 */
interface ITemplate {
	files?: ITemplateFile[];
	name: string;
	rootDir?: string;
}

/**
 * @param string fileContent
 * @param string inputPath
 * @param string outputPath
 * @return string
 */
function assignVariables(fileContent: string = '', inputPath: string, outputPath: string): string {
	const workspaceRoot = vscode.workspace.rootPath;
	const inputPathRelative: string = inputPath.replace(workspaceRoot || '', '').replace(/^\//, '');
	const outputPathRelative: string = outputPath.replace(workspaceRoot || '', '').replace(/^\//, '');
	const inputDirectory: string = path.dirname(inputPath);
	const outputDirectory: string = path.dirname(outputPath);
	const inputDirectoryRelative: string = path.dirname(inputPathRelative);
	const outputDirectoryRelative: string = path.dirname(outputPathRelative);
	const inputFilename: string = path.basename(inputPath);
	const outputFilename: string = path.basename(outputPath);
	let key: string, value: string;

	// Iterate through variables
	for (key in Settings.variables) {
		value = Settings.variables[key];
		fileContent = fileContent.replace(key, value);
	}

	// Variables for evaluations
	const variables = Object.entries(Settings.variables).reduce((acc: any, [key, value]) => {
		key = key
			.replace(/\${?{?/g, '')
			.replace(/}?}?/g, '')
			.replace('.', '_');
		acc[key] = value;
		return acc;
	}, {});

	// TODO perform more assignments here
	// Using 's' flag and a non-greedy match with `.*?`
	[...fileContent.matchAll(/\${{(.*?)}}/gis)].forEach((match: any) => {
		const key = match[0];
		const value = eval(`
			${match[1]}
		`);

		fileContent = fileContent.replace(key, value);
	});

	// VsCodeHelper.log(JSON.stringify(Settings.variables, null, 4));

	return fileContent;
}

/**
 * Generates a template object from a template path
 *
 * @param string templatePath
 * @return ITemplate
 */
function createTemplateFromDirectory(templatePath: string): ITemplate {
	const manifestPath = `${templatePath}/manifest.json`;
	const template: ITemplate = Object.assign(
		{
			name: templatePath.split('/').pop() || '',
			files: [],
			rootDir: '',
		},
		JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
	);
	const sourceFilePath = `${templatePath}/${template?.rootDir || ''}`;

	// Read files from root directory of template
	getAllFiles(sourceFilePath).forEach((filepath: string) => {
		const inputPath = filepath;
		const targetPath = inputPath.replace(sourceFilePath, '').replace(/^\//, '');
		const stat = fs.statSync(inputPath);

		if (stat.isFile() && path.resolve(inputPath) !== path.resolve(manifestPath)) {
			template?.files?.push({ inputPath, targetPath });
		}
	});

	return template;
}

/**
 * @param string filePath
 * @return boolean
 */
function ensureDirectoryExistence(filePath: string): boolean {
	const dirname = path.dirname(filePath);

	if (fs.existsSync(dirname)) {
		return true;
	}

	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname, { recursive: true });

	return false;
}

/**
 * Find all files inside a dir, recursively.
 *
 * @param  string} dir Dir path string.
 * @return string[] Filepaths
 */
function getAllFiles(dir: string): string[] {
	return fs.readdirSync(dir).reduce((files: string[], file: string) => {
		const name = path.join(dir, file);
		const isDirectory = fs.statSync(name).isDirectory();
		return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
	}, []);
}

/**
 * @param string path
 * @return string[]
 */
function getTemplatePathsFromDirectory(path: string): string[] {
	const files: string[] = [];

	// No path exists here
	if (!fs.existsSync(path)) {
		return files;
	}

	// Recursively iterate directories
	fs.readdirSync(path).forEach((file) => {
		const filePath = `${path}/${file}`;
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			files.push(filePath);
		}
	});

	return files;
}

/**
 * @return ITemplate[]
 */
function getTemplates(): ITemplate[] {
	const templates: ITemplate[] = [];

	// Get editor root directory
	const workspaceRoot = vscode.workspace.rootPath;

	// Templates from all directories
	Settings.templateDirectories.forEach((templatePath) => {
		// Special variables
		templatePath = templatePath
			.replace('~', process.env.HOME || '')
			.replace('$HOME', process.env.HOME || '')
			.replace('$WORKSPACE', workspaceRoot || '')
			.replace('$CWD', workspaceRoot || '');

		// Log
		VsCodeHelper.log(`Searching for templates in ${templatePath}`);

		// Search for a .vscode directory
		const localTemplates: string[] = getTemplatePathsFromDirectory(templatePath);

		// Iterate through directories
		localTemplates.forEach((templatePath) => {
			const template: ITemplate = createTemplateFromDirectory(templatePath);
			templates.push(template);
		});
	});

	return templates;
}

// ---------------------------------------------------------------------------

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
		const variableFilename: string = outputPath.match(/\[(.*?)\]/i)?.[1] as string;

		// If variable filename, replace it with user input
		if (variableFilename) {
			const userInputValue: string = userInput[variableFilename];
			outputPath = outputPath.replace(`[${variableFilename}]`, userInputValue);
		}

		// Make sure full path structure exists
		ensureDirectoryExistence(outputPath);

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
export async function createTemplate(fileTreeUri: vscode.Uri): Promise<void> {
	const workspaceRoot = vscode.workspace.rootPath;
	const targetPath = fileTreeUri?.fsPath || workspaceRoot || '';

	// Get template directories
	const templateDirectories = getTemplates();
	const names: string[] = Object.values(templateDirectories).map((template) => template.name);

	// Ask user which template to use
	const templateName: string = (await vscode.window.showQuickPick(names, { placeHolder: 'Select a template...' })) as string;

	// Find template based off selection
	const selectedTemplate: ITemplate = templateDirectories.find((template) => template.name === templateName) as ITemplate;

	// Check if we have a template
	if (!selectedTemplate?.files) {
		vscode.window.showErrorMessage('No template was selected. Please try again.');
		return;
	}

	// Get list of variable filenames"[filename].js".
	// @ts-ignore
	let variableFilenames: string[] = selectedTemplate.files?.filter((file) => file.targetPath.match(/\[(.*?)\]/i)).map((file) => file.targetPath?.match(/\[(.*?)\]/i)[1] as string);
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
