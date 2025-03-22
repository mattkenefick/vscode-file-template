import * as Command from './commands';
import * as Config from './config';
import * as vscode from 'vscode';
import { registerTemplateExplorer } from './explorer/template-explorer';
import { setVariableContext } from './common/variable-processor';

/**
 * @param ExtensionContract context
 * @return void
 */
export function activate(context: vscode.ExtensionContext) {
	// Initialize variable processor with extension context
	setVariableContext(context);

	// Register commands
	const functionNames = Object.keys(Command);

	functionNames.forEach((name) => {
		const commandName = `${Config.Extension.slug}.${name}`;
		const func = Command[name as keyof typeof Command] as any;
		const disposable = vscode.commands.registerCommand(commandName, async (...args) => await func(...args));

		context.subscriptions.push(disposable);
	});

	// Register template explorer
	registerTemplateExplorer(context);
}

/**
 * @return void
 */
export function deactivate() {
	// do nothing
}
