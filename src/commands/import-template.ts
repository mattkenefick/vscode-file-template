import * as axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as url from 'url';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { assignVariables, getVariables, ensureDirectoryExistence, expandDirectory } from '../common/helper';
import { exec } from 'child_process';
import { promisify } from 'util';

enum UrlType {
	BITBUCKET_SNIPPET,
	GITHUB_GIST,
	GITHUB_REPO_DIRECTORY,
	GITLAB_SNIPPET,
	RAW_GITHUB_URL,
	UNKNOWN,
}

interface ImportedFile {
	content: string;
	name: string;
	path?: string;
}

/**
 * Creates a safe slug from a string
 *
 * @param input The string to convert to a slug
 * @return A safe slug
 */
function createSafeSlug(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
		.replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Imports a template from a URL (gist, repo, etc.)
 *
 * Supported URL formats:
 * - GitHub Gist: https://gist.github.com/username/gistId
 * - GitHub Gist (direct): https://gist.github.com/gistId
 * - GitHub repo directory: https://github.com/username/repo/tree/branch/path/to/directory
 * - GitHub raw file: https://raw.githubusercontent.com/username/repo/branch/path/to/file
 * - GitLab snippet: https://gitlab.com/snippets/snippetId
 * - Bitbucket snippet: https://bitbucket.org/snippets/username/snippetId
 *
 * Special filename patterns:
 * - "{variable}--filename.ext" will create a folder structure with {variable} as a directory
 *
 * @return Promise<void>
 */
export default async function importTemplate(): Promise<void> {
	try {
		// Get template directories from settings
		const directories: string[] = Settings.templateDirectories;

		if (!directories.length) {
			vscode.window.showErrorMessage('No template directories configured. Please update your settings.');
			return;
		}

		// Ask user where to save the template
		const directoryName = await vscode.window.showQuickPick(directories, {
			placeHolder: 'Where would you like to save this boilerplate?',
		});

		// Check if user cancelled
		if (!directoryName) {
			return; // User cancelled, just exit silently
		}

		// Determine fully qualified path for directory based off name
		const directory = expandDirectory(directoryName);

		// Ensure the directory exists
		try {
			if (!fs.existsSync(directory)) {
				fs.mkdirSync(directory, { recursive: true });
				VsCodeHelper.log(`Created directory: ${directory}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create directory: ${directory}. ${(error as Error).message}`);
			return;
		}

		// Ask user for the template name
		const templateName = await vscode.window.showInputBox({
			prompt: 'What would you like to call it? (e.g. My Angular Boilerplate)',
			validateInput: (input) => {
				return input.trim() ? null : 'Template name cannot be empty';
			},
		});

		// Exit if user cancelled
		if (templateName === undefined) {
			return; // User cancelled, just exit silently
		}

		// Ensure template name is valid
		if (!templateName.trim()) {
			vscode.window.showErrorMessage('Template name cannot be empty. Please try again.');
			return;
		}

		// Create safe folder slug
		const templateSlug = createSafeSlug(templateName);
		const templatePath = path.join(directory, templateSlug);

		// Exit if there's a template with the same name
		if (fs.existsSync(templatePath)) {
			const overwrite = await vscode.window.showWarningMessage(
				`Boilerplate '${templateSlug}' already exists at ${directory}. Overwrite?`,
				{ modal: true },
				'Yes',
				'No',
			);

			if (overwrite !== 'Yes') {
				return;
			}

			// Delete existing directory
			try {
				deleteDirectoryRecursive(templatePath);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to remove existing template: ${(error as Error).message}`);
				return;
			}
		}

		// Ask user for the source URL
		const importUrl = await vscode.window.showInputBox({
			prompt: 'Paste the URL to import from:',
			placeHolder: 'GitHub Gist, Repository, GitLab Snippet, etc.',
			validateInput: (input) => {
				if (!input.trim()) {
					return 'URL cannot be empty';
				}
				if (!isValidUrl(input)) {
					return 'Please enter a valid URL';
				}
				return null;
			},
		});

		// Exit if user cancelled
		if (importUrl === undefined) {
			return; // User cancelled, just exit silently
		}

		// Show progress indicator
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Importing template from ${getUrlDomain(importUrl)}...`,
				cancellable: false,
			},
			async (progress) => {
				progress.report({ increment: 0 });

				try {
					// Determine URL type
					const urlType = determineUrlType(importUrl);

					// Create the template directory
					ensureDirectoryExistence(path.join(templatePath, 'manifest.json'));

					progress.report({ increment: 20, message: 'Fetching files...' });

					// Import files based on URL type
					const files = await importFilesFromUrl(importUrl, urlType);

					if (!files || files.length === 0) {
						throw new Error('No files were found or could be imported.');
					}

					progress.report({ increment: 60, message: 'Creating template...' });

					// Create manifest.json with enhanced metadata
					const manifestContent = JSON.stringify(
						{
							name: templateName,
							rootDir: 'src',
							description: `Imported from ${getUrlDomain(importUrl)}`,
							source: importUrl,
							version: '1.0.0',
							created: new Date().toISOString(),
							files: files.map((f) => f.name),
						},
						null,
						2,
					);

					fs.writeFileSync(path.join(templatePath, 'manifest.json'), manifestContent);

					// Create src directory if it doesn't exist
					ensureDirectoryExistence(path.join(templatePath, 'src'));

					// Write all files to the template
					for (const file of files) {
						// Process special filename patterns like "{filename}--State.ts"
						let targetFileName = file.name;
						let subDir = '';

						// Check for the pattern "{name}--filename.ext" which should create a folder structure
						const patternMatch = file.name.match(/^(\{[^}]+\})--(.+)$/);
						if (patternMatch) {
							// Keep the variable pattern as folder name to be replaced during template generation
							subDir = patternMatch[1];
							targetFileName = patternMatch[2];
							VsCodeHelper.log(`Detected folder pattern: ${subDir} with file ${targetFileName}`);
						}

						// Determine the final path
						const filePath = file.path
							? path.join(templatePath, file.path, subDir, targetFileName)
							: path.join(templatePath, 'src', subDir, targetFileName);

						ensureDirectoryExistence(filePath);
						fs.writeFileSync(filePath, file.content);
						VsCodeHelper.log(`Imported file: ${filePath}`);
					}

					progress.report({ increment: 20, message: 'Finalizing...' });

					// Show success message
					vscode.window.showInformationMessage(`Template '${templateName}' imported successfully with ${files.length} files.`);

					// Open new editor at directory
					try {
						await promisify(exec)(`code "${templatePath}"`);
					} catch (error) {
						vscode.window.showInformationMessage(`Template created at: ${templatePath}`);
					}
				} catch (error) {
					VsCodeHelper.log(`Error importing template: ${(error as Error).message}`);
					vscode.window.showErrorMessage(`Failed to import template: ${(error as Error).message}`);
				}
			},
		);
	} catch (error) {
		VsCodeHelper.log(`Error in importTemplate: ${(error as Error).message}`);
		vscode.window.showErrorMessage(`An error occurred: ${(error as Error).message}`);
	}
}

/**
 * Determines the type of URL provided
 *
 * @param url The URL to analyze
 * @return The URL type
 */
function determineUrlType(urlString: string): UrlType {
	if (!urlString) return UrlType.UNKNOWN;

	try {
		const parsedUrl = new url.URL(urlString);
		const hostname = parsedUrl.hostname;
		const urlPath = parsedUrl.pathname;

		// GitHub Gist
		if ((hostname === 'gist.github.com' || hostname === 'github.com') && urlPath.includes('/gist/')) {
			return UrlType.GITHUB_GIST;
		}

		// Direct Gist ID
		if (urlPath.match(/\/([a-f0-9]{32})$/) || urlString.match(/([a-f0-9]{32})/)) {
			return UrlType.GITHUB_GIST;
		}

		// GitHub Raw URL
		if (hostname === 'raw.githubusercontent.com') {
			return UrlType.RAW_GITHUB_URL;
		}

		// GitHub Repository directory
		if (hostname === 'github.com' && urlPath.match(/\/[^\/]+\/[^\/]+\/tree\/[^\/]+\/[^\/]+/)) {
			return UrlType.GITHUB_REPO_DIRECTORY;
		}

		// GitLab Snippet
		if (hostname.includes('gitlab') && urlPath.includes('/snippets/')) {
			return UrlType.GITLAB_SNIPPET;
		}

		// Bitbucket Snippet
		if (hostname.includes('bitbucket') && urlPath.includes('/snippets/')) {
			return UrlType.BITBUCKET_SNIPPET;
		}

		return UrlType.UNKNOWN;
	} catch (error) {
		// If URL parsing fails, try to handle common formats directly
		// This allows for flexibility with non-standard URL formats

		// Try to detect Gist IDs directly
		if (urlString.match(/[a-f0-9]{32}/i)) {
			return UrlType.GITHUB_GIST;
		}

		return UrlType.UNKNOWN;
	}
}

/**
 * Imports files from a URL based on the URL type
 *
 * @param url The URL to import from
 * @param urlType The type of URL
 * @return Promise<ImportedFile[]> Array of imported files
 */
async function importFilesFromUrl(url: string, urlType: UrlType): Promise<ImportedFile[]> {
	switch (urlType) {
		case UrlType.GITHUB_GIST:
			return importFromGithubGist(url);
		case UrlType.GITHUB_REPO_DIRECTORY:
			return importFromGithubRepo(url);
		case UrlType.RAW_GITHUB_URL:
			return importFromRawGithub(url);
		case UrlType.GITLAB_SNIPPET:
			return importFromGitlabSnippet(url);
		case UrlType.BITBUCKET_SNIPPET:
			return importFromBitbucketSnippet(url);
		default:
			throw new Error(`Unsupported URL type: ${url}`);
	}
}

/**
 * Imports files from a GitHub Gist
 *
 * @param url The Gist URL
 * @return Promise<ImportedFile[]> Array of imported files
 */
async function importFromGithubGist(url: string): Promise<ImportedFile[]> {
	// Extract Gist ID from URL
	const gistIdMatch = url.match(/([a-f0-9]{32})/i) || url.match(/gist\.github\.com\/(?:.*?)\/([a-z0-9]+)/i);

	if (!gistIdMatch || !gistIdMatch[1]) {
		throw new Error('Could not extract Gist ID from URL.');
	}

	const gistId = gistIdMatch[1];
	const apiUrl = `https://api.github.com/gists/${gistId}`;

	try {
		const response = await axios.default.get(apiUrl);

		if (response.status !== 200) {
			throw new Error(`Failed to fetch Gist. Status: ${response.status}`);
		}

		const gistData = response.data;

		if (!gistData.files || Object.keys(gistData.files).length === 0) {
			throw new Error('Gist does not contain any files.');
		}

		const files: ImportedFile[] = [];

		// Process files
		for (const [filename, fileInfo] of Object.entries(gistData.files)) {
			files.push({
				name: filename,
				content: (fileInfo as any).content,
			});
		}

		return files;
	} catch (error) {
		VsCodeHelper.log(`Error fetching Gist files: ${(error as Error).message}`);
		throw new Error(`Failed to fetch Gist: ${(error as Error).message}`);
	}
}

/**
 * Imports files from a GitHub repository directory
 *
 * @param url The GitHub repo directory URL
 * @return Promise<ImportedFile[]> Array of imported files
 */
async function importFromGithubRepo(url: string): Promise<ImportedFile[]> {
	// Format: https://github.com/{owner}/{repo}/tree/{branch}/{path}
	const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/);

	if (!match) {
		throw new Error('Invalid GitHub repository URL format.');
	}

	const [, owner, repo, branch, dirPath] = match;
	const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;

	try {
		const response = await axios.default.get(apiUrl);

		if (response.status !== 200) {
			throw new Error(`Failed to fetch repository contents. Status: ${response.status}`);
		}

		const contents = response.data;

		if (!Array.isArray(contents)) {
			throw new Error('Invalid repository directory contents.');
		}

		const files: ImportedFile[] = [];

		// Process only files, not directories
		const fileContents = contents.filter((item) => item.type === 'file');

		// Fetch each file content
		for (const file of fileContents) {
			const fileResponse = await axios.default.get(file.download_url);

			if (fileResponse.status === 200) {
				files.push({
					name: file.name,
					content: fileResponse.data,
					path: '', // Put in root src directory
				});
			}
		}

		return files;
	} catch (error) {
		VsCodeHelper.log(`Error fetching GitHub repo files: ${(error as Error).message}`);
		throw new Error(`Failed to fetch repository files: ${(error as Error).message}`);
	}
}

/**
 * Imports file from a raw GitHub URL
 *
 * @param string externalUrl The raw GitHub URL
 * @return Promise<ImportedFile[]> Array with the imported file
 */
async function importFromRawGithub(externalUrl: string): Promise<ImportedFile[]> {
	try {
		const response = await axios.default.get(externalUrl);

		if (response.status !== 200) {
			throw new Error(`Failed to fetch raw file. Status: ${response.status}`);
		}

		// Extract filename from URL
		const parsedUrl = new url.URL(externalUrl);
		const filename = path.basename(parsedUrl.pathname);

		return [
			{
				name: filename,
				content: response.data,
			},
		];
	} catch (error) {
		VsCodeHelper.log(`Error fetching raw GitHub file: ${(error as Error).message}`);
		throw new Error(`Failed to fetch raw file: ${(error as Error).message}`);
	}
}

/**
 * Imports files from a GitLab snippet
 *
 * @param url The GitLab snippet URL
 * @return Promise<ImportedFile[]> Array of imported files
 */
async function importFromGitlabSnippet(url: string): Promise<ImportedFile[]> {
	// This would require GitLab API access token for private snippets
	// For public snippets, you can use the raw URL

	try {
		// Extract snippet ID and potentially file
		const match = url.match(/gitlab\.com\/snippets\/(\d+)/);

		if (!match) {
			throw new Error('Invalid GitLab snippet URL.');
		}

		const snippetId = match[1];
		const rawUrl = `https://gitlab.com/snippets/${snippetId}/raw`;

		const response = await axios.default.get(rawUrl);

		if (response.status !== 200) {
			throw new Error(`Failed to fetch GitLab snippet. Status: ${response.status}`);
		}

		// Default filename for GitLab snippets
		return [
			{
				name: 'snippet.txt',
				content: response.data,
			},
		];
	} catch (error) {
		VsCodeHelper.log(`Error fetching GitLab snippet: ${(error as Error).message}`);
		throw new Error(`Failed to fetch GitLab snippet: ${(error as Error).message}`);
	}
}

/**
 * Imports files from a Bitbucket snippet
 *
 * @param url The Bitbucket snippet URL
 * @return Promise<ImportedFile[]> Array of imported files
 */
async function importFromBitbucketSnippet(url: string): Promise<ImportedFile[]> {
	// This would require Bitbucket API access for private snippets
	try {
		const match = url.match(/bitbucket\.org\/snippets\/([^\/]+)\/([^\/]+)/);

		if (!match) {
			throw new Error('Invalid Bitbucket snippet URL.');
		}

		const [, username, snippetId] = match;
		const rawUrl = `https://bitbucket.org/snippets/${username}/${snippetId}/raw`;

		const response = await axios.default.get(rawUrl);

		if (response.status !== 200) {
			throw new Error(`Failed to fetch Bitbucket snippet. Status: ${response.status}`);
		}

		// Default filename for Bitbucket snippets
		return [
			{
				name: 'snippet.txt',
				content: response.data,
			},
		];
	} catch (error) {
		VsCodeHelper.log(`Error fetching Bitbucket snippet: ${(error as Error).message}`);
		throw new Error(`Failed to fetch Bitbucket snippet: ${(error as Error).message}`);
	}
}

/**
 * Recursively deletes a directory and its contents
 *
 * @param dirPath The path to delete
 */
function deleteDirectoryRecursive(dirPath: string): void {
	if (fs.existsSync(dirPath)) {
		fs.readdirSync(dirPath).forEach((file) => {
			const curPath = path.join(dirPath, file);

			if (fs.lstatSync(curPath).isDirectory()) {
				// Recursive call
				deleteDirectoryRecursive(curPath);
			} else {
				// Delete file
				fs.unlinkSync(curPath);
			}
		});

		// Delete the empty directory
		fs.rmdirSync(dirPath);
	}
}

/**
 * Checks if a string is a valid URL
 *
 * @param url The URL to validate
 * @return boolean
 */
function isValidUrl(urlString: string): boolean {
	try {
		new url.URL(urlString);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Extracts the domain from a URL
 *
 * @param url The URL to get the domain from
 * @return string
 */
function getUrlDomain(urlString: string): string {
	try {
		const parsedUrl = new url.URL(urlString);
		return parsedUrl.hostname;
	} catch (error) {
		return 'unknown source';
	}
}
