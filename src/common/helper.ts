import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { ITemplate } from '../interface';

/**
 * @param string inputPath
 * @param string outputPath
 * @param object userInput
 * @return Record<string, string>
 */
export function getVariables(inputPath: string = '', outputPath: string = '', userInput: any = {}): Record<string, string> {
	let key: string, value: string;
	let mergedVariables: Record<string, string> = {};

	mergedVariables = Object.assign(mergedVariables, Settings.variables);
	mergedVariables = Object.assign(mergedVariables, getJsonFileAsVariables(path.dirname(outputPath), 'package.json'));

	for (key in userInput) {
		mergedVariables['${input.' + key + '}'] = userInput[key];
	}

	return mergedVariables;
}

/**
 * @param string fileContent
 * @param string inputPath
 * @param string outputPath
 * @param object userInput
 * @return string
 */
export function assignVariables(fileContent: string = '', inputPath: string = '', outputPath: string = '', userInput: any = {}): string {
	let key: string, value: string;

	const workspaceRoot = vscode.workspace.rootPath || '';
	const inputPathRelative = inputPath.replace(workspaceRoot || '', '').replace(/^\//, '');
	const inputDirectory = path.dirname(inputPath);
	const inputDirectoryRelative = path.dirname(inputPathRelative);
	const inputFilename = path.basename(inputPath);
	const outputPathRelative = outputPath.replace(workspaceRoot || '', '').replace(/^\//, '');
	const outputDirectory = path.dirname(outputPath);
	const outputDirectoryRelative = path.dirname(outputPathRelative);
	const outputFilename = path.basename(outputPath);

	// VsCodeHelper.log(`InputPath: ${inputPath}`);
	// VsCodeHelper.log(`OutputPath: ${outputPath}`);
	// VsCodeHelper.log(`InputPathRelative: ${inputPathRelative}`);
	// VsCodeHelper.log(`InputDirectory: ${inputDirectory}`);
	// VsCodeHelper.log(`InputDirectoryRelative: ${inputDirectoryRelative}`);
	// VsCodeHelper.log(`InputFilename: ${inputFilename}`);
	// VsCodeHelper.log(`OutputPathRelative: ${outputPathRelative}`);
	// VsCodeHelper.log(`OutputDirectory: ${outputDirectory}`);
	// VsCodeHelper.log(`OutputDirectoryRelative: ${outputDirectoryRelative}`);
	// VsCodeHelper.log(`OutputFilename: ${outputFilename}`);

	// Custom variables
	let mergedVariables = getVariables(inputPath, outputPath, userInput);

	// Iterate through variables
	for (key in mergedVariables) {
		value = mergedVariables[key];
		fileContent = fileContent.replaceAll(key, value);
	}

	// Reformat variables for evaluated code, e.g. "${myVariable}" becomes "variables.myVariable"
	const variables = Object.entries(mergedVariables).reduce((acc: any, [key, value]) => {
		key = key
			.replace(/\${?{?/g, '')
			.replace(/}?}?/g, '')
			.replace('.', '_');
		acc[key] = value;
		return acc;
	}, {});

	// Perform non-echoed actions here, triple brace {{{ ... }}}
	// You'd use this to evaluate code in the current context
	try {
		[...fileContent.matchAll(/\n?\{\{\{(.*?)\}\}\}\n?/gis)].forEach((match: any) => {
			const key = match[0];
			eval(match[1]);
			fileContent = fileContent.replace(key, '');
		});
	} catch (e) {
		VsCodeHelper.log('Failed non-echoed script:' + (e as any).message);
	}

	// TODO perform more assignments here
	// Using 's' flag and a non-greedy match with `.*?`
	try {
		[...fileContent.matchAll(/\${{(.*?)}}/gis)].forEach((match: any) => {
			const key = match[0];
			const value = eval(`
				${match[1]}
			`);

			fileContent = fileContent.replace(key, value);
		});
	} catch (e) {
		VsCodeHelper.log('Failed assigned eval script: ' + (e as any).message);
	}

	return fileContent;
}

/**
 * Generates a template object from a template path
 *
 * @param string templatePath
 * @return ITemplate
 */
export function createTemplateFromDirectory(templatePath: string): ITemplate {
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
 * Ensures that the directory for the given file path exists.
 *
 * @param filePath The file path.
 * @return void
 */
export function ensureDirectoryExistence(filePath: string): void {
	const normalizedPath = path.dirname(path.normalize(filePath));

	// Create directory path if it doesn't exist
	if (!fs.existsSync(normalizedPath)) {
		fs.mkdirSync(normalizedPath, { recursive: true });
	}
}

/**
 * Expands a directory path by replacing special variables with their corresponding values.
 *
 * @param directory The directory path to expand.
 * @return The expanded directory path.
 */
export function expandDirectory(directory: string): string {
	const workspaceRoot = vscode.workspace.rootPath;

	// Replace special variables with their corresponding values
	directory = directory
		.replace('~', process.env.HOME || '')
		.replace('$HOME', process.env.HOME || '')
		.replace('$WORKSPACE', workspaceRoot || '')
		.replace('$CWD', workspaceRoot || '');

	return directory;
}

/**
 * Finds a file in a given directory or its parent directories.
 *
 * @param directory The directory to start the search from.
 * @param filename The name of the file to find.
 * @param iteration The current iteration count (default: 0).
 * @returns The path of the found file, or an empty string if the file is not found.
 */
export function findFile(directory: string, filename: string, iteration: number = 0): string {
	const fileExists: boolean = fs.existsSync(`${directory}/${filename}`);

	// Max iterations reached or file found
	if (iteration > 10 || fileExists) {
		return fileExists ? `${directory}/${filename}` : '';
	}

	// File not found, continue searching in parent directory
	return findFile(path.resolve(directory, '..'), filename, iteration + 1);
}

/**
 * Find all files inside a dir, recursively.
 *
 * @param string dir
 * @return string[]
 */
export function getAllFiles(dir: string): string[] {
	return fs.readdirSync(dir).reduce((files: string[], file: string) => {
		const name = path.join(dir, file);
		const isDirectory = fs.statSync(name).isDirectory();
		return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name];
	}, []);
}

/**
 * Read and parse a JSON file
 *
 * @param string fromDirectory
 * @param string filename
 * @return Record<string, any>
 */
function getJsonFile(fromDirectory: string = '', filename: string = 'package.json'): Record<string, any> {
	const jsonPath = fromDirectory ? findFile(fromDirectory, filename) : `${vscode.workspace.rootPath}/${filename}`;

	// Check if file exists
	if (!fs.existsSync(jsonPath)) {
		return {};
	}

	// Log
	VsCodeHelper.log(`Found ${filename} at ${jsonPath}`);

	return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

/**
 * Convert a JSON file into a key-value object.
 *
 * @param string fromDirectory
 * @param string filename
 * @return Record<string, any>
 */
function getJsonFileAsVariables(fromDirectory: string, filename: string = 'package.json'): Record<string, any> {
	const json = getJsonFile(fromDirectory, 'package.json');
	let output: any = {};

	// Search for package.json
	Object.entries(json).forEach(([key, value]) => {
		output[`\${package.${key}}`] = value as string;
	});

	// Add custom variables
	return output;
}

/**
 * Used in getTemplates to find all directories in a given path.
 *
 * @param string path
 * @return string[]
 */
export function getTemplatePathsFromDirectory(path: string): string[] {
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
 * Seaches all defined template paths for templates and returns them as an array.
 * This includes workspace and local directories, as defined by:
 *
 * 		~, $HOME - User's home directory
 * 		$CWD, $WORKSPACE - Current workspace directory
 *
 * @return ITemplate[]
 */
export function getTemplates(): ITemplate[] {
	const templates: ITemplate[] = [];

	// Get editor root directory
	const workspaceRoot = vscode.workspace.rootPath;

	// Templates from all directories
	Settings.templateDirectories.forEach((templatePath) => {
		// Resolve special variables to get absolute path to directory
		templatePath = expandDirectory(templatePath);

		// Log
		VsCodeHelper.log(`Searching for templates in ${templatePath}`);

		// Search for a .vscode directory
		const localTemplates: string[] = getTemplatePathsFromDirectory(templatePath);

		// Iterate through directories
		localTemplates.forEach((templatePath) => {
			const template: ITemplate = createTemplateFromDirectory(templatePath);
			template.path = templatePath;
			templates.push(template);
		});
	});

	return templates;
}
