import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';

/**
 * @type interface
 */
export interface ITemplateFile {
	inputPath: string;
	targetPath: string;
}

/**
 * @type interface
 */
export interface ITemplate {
	files?: ITemplateFile[];
	name: string;
	path?: string;
	rootDir?: string;
}

/**
 * @param string fromDirectory
 * @return Record<string, any>
 */
function getPackageJson(fromDirectory: string = ''): Record<string, any> {
	const packageJsonPath = fromDirectory ? findFile(fromDirectory, 'package.json') : vscode.workspace.rootPath + '/package.json';

	// Check if package.json exists
	if (!fs.existsSync(packageJsonPath)) {
		return {};
	}

	// Log
	VsCodeHelper.log(`Found package.json at ${packageJsonPath}`);

	return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

/**
 * @param string fromDirectory
 * @return Record<string, any>
 */
function getPackageJsonAsVariables(fromDirectory: string): Record<string, any> {
	const packageJson = getPackageJson(fromDirectory);
	let output: any = {};

	// Search for package.json
	Object.entries(packageJson).forEach(([key, value]) => {
		output[`\${package.${key}}`] = value as string;
	});

	// Add custom variables
	return output;
}

/**
 * @param string fileContent
 * @param string inputPath
 * @param string outputPath
 * @return string
 */
export function assignVariables(fileContent: string = '', inputPath: string, outputPath: string): string {
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

	// Custom variables
	let mergedVariables: Record<string, string> = {};
	mergedVariables = Object.assign(mergedVariables, Settings.variables);
	mergedVariables = Object.assign(mergedVariables, getPackageJsonAsVariables(outputDirectory));

	// Iterate through variables
	for (key in mergedVariables) {
		value = mergedVariables[key];
		fileContent = fileContent.replace(key, value);
	}

	// Variables for evaluations
	const variables = Object.entries(mergedVariables).reduce((acc: any, [key, value]) => {
		key = key
			.replace(/\${?{?/g, '')
			.replace(/}?}?/g, '')
			.replace('.', '_');
		acc[key] = value;
		return acc;
	}, {});

	// Perform non-echoed actions here
	try {
		[...fileContent.matchAll(/\${--(.*?)--}/gis)].forEach((match: any) => {
			const key = match[0];
			eval(match[1]);
			fileContent = fileContent.replace(key, '');
		});
	} catch (e) {
		VsCodeHelper.log('Failed evaluated script');
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
		VsCodeHelper.log('Failed evaluated script');
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
 * @param string filePath
 * @return void
 */
export function ensureDirectoryExistence(filePath: string): void {
	const normalizedPath = path.dirname(path.normalize(filePath));

	// Create directory path
	if (!fs.existsSync(normalizedPath)) {
		fs.mkdirSync(normalizedPath, { recursive: true });
	}
}

/**
 * @param string directory
 * @return string
 */
export function expandDirectory(directory: string): string {
	const workspaceRoot = vscode.workspace.rootPath;

	// Templates from all directories
	directory = directory
		.replace('~', process.env.HOME || '')
		.replace('$HOME', process.env.HOME || '')
		.replace('$WORKSPACE', workspaceRoot || '')
		.replace('$CWD', workspaceRoot || '');

	return directory;
}

/**
 * @param string directory
 * @param string filename
 * @param number iteration
 * @return string
 */
export function findFile(directory: string, filename: string, iteration: number = 0): string {
	const fileExists: boolean = fs.existsSync(`${directory}/${filename}`);

	// Max iterations reached
	if (iteration > 10) {
		return '';
	}

	// File found
	else if (fileExists) {
		return `${directory}/${filename}`;
	}

	// File not found
	else {
		return findFile(path.resolve(directory, '..'), filename, ++iteration);
	}
}

/**
 * Find all files inside a dir, recursively.
 *
 * @param  string} dir Dir path string.
 * @return string[] Filepaths
 */
export function getAllFiles(dir: string): string[] {
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
 * @return ITemplate[]
 */
export function getTemplates(): ITemplate[] {
	const templates: ITemplate[] = [];

	// Get editor root directory
	const workspaceRoot = vscode.workspace.rootPath;

	// Templates from all directories
	Settings.templateDirectories.forEach((templatePath) => {
		// Special variables
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
