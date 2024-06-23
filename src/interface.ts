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
