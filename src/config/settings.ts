import * as vscode from 'vscode';
import Extension from './extension';

/**
 * @author Matt Kenefick <matt@polymermallard.com>
 * @package Config
 * @project File Template
 */
export class Settings {
	/**
	 * @type vscode.WorkspaceConfiguration
	 */
	public configuration!: vscode.WorkspaceConfiguration;

	/**
	 * @constructor
	 * @param string configurationKey
	 */
	constructor(configurationKey: string) {
		this.configuration = vscode.workspace.getConfiguration(configurationKey) || {};
	}

	/**
	 * @return Record<string, string>
	 */
	public get scripts(): Record<string, string> {
		return this.configuration?.scripts || {};
	}

	/**
	 * @return string[]
	 */
	public get templateDirectories(): string[] {
		return this.configuration?.templateDirectories || [];
	}

	/**
	 * @return Record<string, string>
	 */
	public get variables(): Record<string, string> {
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

// Export singleton
export default new Settings(Extension.slug);
