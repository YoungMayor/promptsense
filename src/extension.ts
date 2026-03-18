import * as vscode from "vscode";
import { parsePrompt } from "./parser";

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "promptsense" is now active!');

	const disposable = vscode.workspace.onDidOpenTextDocument((document) => {
		if (document.languageId === "promptsense") {
			const parsed = parsePrompt(document.getText());
			console.log("Parsed .prompt file:", parsed);
		}
	});

	const helloWorld = vscode.commands.registerCommand(
		"promptsense.helloWorld",
		() => {
			vscode.window.showInformationMessage("Hello World from PromptSense!");
		},
	);

	context.subscriptions.push(disposable, helloWorld);
}

// This method is called when your extension is deactivated
export function deactivate() {}
