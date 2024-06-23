import * as Command from './commands';
import * as Config from './config';
import * as vscode from 'vscode';

/**
 * @param ExtensionContract context
 * @return void
 */
export function activate(context: vscode.ExtensionContext) {
	const functionNames = Object.keys(Command);

	functionNames.forEach((name) => {
		const commandName = `${Config.Extension.slug}.${name}`;
		const func = Command[name as keyof typeof Command] as any;
		const disposable = vscode.commands.registerCommand(commandName, async (...args) => await func(...args));

		context.subscriptions.push(disposable);
	});
}

/**
 * @return void
 */
export function deactivate() {
	// do nothing
}
