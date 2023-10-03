import * as vscode from 'vscode';

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

		// Add our custom variables
		Object.keys(this.configuration?.variables || {}).forEach((key) => {
			output[key] = this.configuration?.variables[key] || '';
		});

		return output;
	}
}
