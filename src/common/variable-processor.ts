import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as childProcess from 'child_process';
import { promisify } from 'util';
import VsCodeHelper from '../utility/vscode-helper';

const exec = promisify(childProcess.exec);

/**
 * Types of variable transformations
 */
export enum TransformType {
	CAMELCASE = 'camelcase',
	CAPITALIZE = 'capitalize',
	KEBABCASE = 'kebabcase',
	LOWERCASE = 'lowercase',
	PASCALCASE = 'pascalcase',
	SNAKECASE = 'snakecase',
	TRIM = 'trim',
	UPPERCASE = 'uppercase',
}

/**
 * Processes variable transformations
 *
 * @param value The input value
 * @param transform The transformation to apply
 * @returns The transformed value
 */
export function transformValue(value: string, transform: TransformType | string): string {
	if (!value) return value;

	switch (transform) {
		case TransformType.UPPERCASE:
			return value.toUpperCase();

		case TransformType.LOWERCASE:
			return value.toLowerCase();

		case TransformType.CAPITALIZE:
			return value.charAt(0).toUpperCase() + value.slice(1);

		case TransformType.CAMELCASE:
			return value.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^([A-Z])/, (m) => m.toLowerCase());

		case TransformType.PASCALCASE:
			return value.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^([a-z])/, (m) => m.toUpperCase());

		case TransformType.SNAKECASE:
			return value
				.replace(/([a-z])([A-Z])/g, '$1_$2')
				.replace(/[\s-]+/g, '_')
				.toLowerCase();

		case TransformType.KEBABCASE:
			return value
				.replace(/([a-z])([A-Z])/g, '$1-$2')
				.replace(/[\s_]+/g, '-')
				.toLowerCase();

		case TransformType.TRIM:
			return value.trim();

		default:
			return value;
	}
}

/**
 * Enhanced variable types
 */
export const variableProcessors = {
	/**
	 * Generates a date/time string in the specified format
	 * Format: ${date:YYYY-MM-DD}
	 *
	 * @param format The date format
	 * @returns Formatted date string
	 */
	date: (format: string = 'YYYY-MM-DD'): string => {
		const now = new Date();
		return format
			.replace('YYYY', now.getFullYear().toString())
			.replace('MM', (now.getMonth() + 1).toString().padStart(2, '0'))
			.replace('DD', now.getDate().toString().padStart(2, '0'))
			.replace('HH', now.getHours().toString().padStart(2, '0'))
			.replace('mm', now.getMinutes().toString().padStart(2, '0'))
			.replace('ss', now.getSeconds().toString().padStart(2, '0'));
	},

	/**
	 * Generates a UUID
	 * Format: ${uuid} or ${uuid:short}
	 *
	 * @param format Optional format (default or short)
	 * @returns UUID string
	 */
	uuid: (format: string = 'default'): string => {
		const uuid = crypto.randomUUID();
		return format === 'short' ? uuid.replace(/-/g, '').substring(0, 12) : uuid;
	},

	/**
	 * Retrieves environment variables with optional default value
	 * Format: ${env:VARIABLE:defaultValue}
	 *
	 * @param name Environment variable name
	 * @param defaultValue Optional default value
	 * @returns Environment variable value or default
	 */
	env: (name: string, defaultValue: string = ''): string => {
		return process.env[name] || defaultValue;
	},

	/**
	 * Generates a counter with options for start, step, and padding
	 * Format: ${counter:start=1:step=1:padding=2}
	 *
	 * @param options Counter options string
	 * @returns Counter value
	 */
	counter: (options: string = ''): string => {
		// Parse options
		const optionsObj: Record<string, number> = {
			start: 1,
			step: 1,
			padding: 0,
		};

		options.split(':').forEach((option) => {
			const [key, value] = option.split('=');
			if (key && value && Object.keys(optionsObj).includes(key)) {
				optionsObj[key] = parseInt(value, 10);
			}
		});

		// Get or initialize counter for this template
		const counterKey = 'boilerplate.counter';
		const currentCount = parseInt(context.globalState.get(counterKey, optionsObj.start.toString()), 10);
		const nextCount = currentCount + optionsObj.step;

		// Store updated counter
		context.globalState.update(counterKey, nextCount.toString());

		// Format the counter with padding if specified
		return optionsObj.padding > 0 ? currentCount.toString().padStart(optionsObj.padding, '0') : currentCount.toString();
	},

	/**
	 * Retrieves git information
	 * Format: ${git:branch}, ${git:author}, ${git:repo}
	 *
	 * @param type The type of git info to retrieve
	 * @returns Git information
	 */
	git: async (type: string = 'branch'): Promise<string> => {
		try {
			switch (type) {
				case 'branch': {
					const { stdout } = await exec('git rev-parse --abbrev-ref HEAD');
					return stdout.trim();
				}
				case 'author': {
					const { stdout } = await exec('git config user.name');
					return stdout.trim();
				}
				case 'email': {
					const { stdout } = await exec('git config user.email');
					return stdout.trim();
				}
				case 'repo': {
					const { stdout } = await exec('basename -s .git $(git config --get remote.origin.url)');
					return stdout.trim();
				}
				default:
					return '';
			}
		} catch (error) {
			VsCodeHelper.log(`Error getting git info: ${(error as Error).message}`);
			return '';
		}
	},
};

// Will be set during extension activation
let context: vscode.ExtensionContext;

/**
 * Sets the extension context for variables that need it (e.g., counters)
 *
 * @param ctx The extension context
 */
export function setVariableContext(ctx: vscode.ExtensionContext): void {
	context = ctx;
}

/**
 * Processes a variable with the format ${name:param1:param2...}
 *
 * @param variableName Full variable name including parameters
 * @param userInput User-provided input values
 * @returns Processed variable value
 */
export async function processVariable(variableName: string, userInput: Record<string, string> = {}): Promise<string> {
	// Skip if not a variable
	if (!variableName.startsWith('${') || !variableName.endsWith('}')) {
		return variableName;
	}

	// Extract variable parts
	const variableParts = variableName
		.slice(2, -1) // Remove ${ and }
		.split(':');

	const name = variableParts[0];
	const params = variableParts.slice(1);

	// User input variables
	if (name.startsWith('input.') && userInput) {
		const inputName = name.substring(6); // Remove 'input.'
		return userInput[inputName] || '';
	}

	// Check for transformation on a user input
	if (name in userInput && params.length > 0) {
		let value = userInput[name];

		// Apply all transformations in sequence
		for (const transform of params) {
			value = transformValue(value, transform);
		}

		return value;
	}

	// Special variable types
	if (variableParts.length > 1) {
		const type = variableParts[0];

		// Handle date variables
		if (type === 'date' || type === 'time' || type === 'now') {
			const format = params[0] || 'YYYY-MM-DD';
			return variableProcessors.date(format);
		}

		// Handle UUID generation
		if (type === 'uuid') {
			const format = params[0] || 'default';
			return variableProcessors.uuid(format);
		}

		// Handle environment variables
		if (type === 'env') {
			const envName = params[0] || '';
			const defaultValue = params[1] || '';
			return variableProcessors.env(envName, defaultValue);
		}

		// Handle counters
		if (type === 'counter') {
			return variableProcessors.counter(params.join(':'));
		}

		// Handle git info
		if (type === 'git') {
			const gitInfoType = params[0] || 'branch';
			return await variableProcessors.git(gitInfoType);
		}
	}

	// If we reach here, either the variable type is not recognized
	// or it might be a normal variable without special processing
	return variableName;
}
