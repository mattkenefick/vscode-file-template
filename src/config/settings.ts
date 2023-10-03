import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * @author Matt Kenefick <matt@polymermallard.com>
 * @package Config
 * @project File Template
 */
export default class Settings {
	/**
	 * @todo memoize
	 *
	 * @return object
	 */
	public static get configuration() {
		return vscode.workspace.getConfiguration('new-from-template') || {};
	}

	/**
	 * @return Record<string, string>
	 */
	public static get scripts(): Record<string, string> {
		return this.configuration?.scripts || {};
	}

	/**
	 * @return string[]
	 */
	public static get templateDirectories(): string[] {
		return this.configuration?.templateDirectories || [];
	}

	/**
	 * @return Record<string, string>
	 */
	public static get variables(): Record<string, string> {
		let output: Record<string, string> = {};

		// Add environment variables
		Object.keys(process.env).forEach((key) => {
			output[`\${env.${key}}`] = process.env[key] || '';
		});

		// Search for package.json
		Object.entries(getPackageJson()).forEach(([key, value]) => {
			output[`\${package.${key}}`] = value as string;
		});

		// Add custom variables
		output = Object.assign(output, this.configuration?.variables || {});

		return output;
	}
}

/**
 * @return object
 */
function getPackageJson() {
	const packageJsonPath = vscode.workspace.rootPath + '/package.json';

	// Check if package.json exists
	if (!fs.existsSync(packageJsonPath)) {
		return {};
	}

	return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}
