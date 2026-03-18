import * as vscode from "vscode";
import { PromptCompletionProvider } from "./completion";
import { subscribeToDocumentChanges } from "./diagnostics";
import { PromptHoverProvider } from "./hover";
import { parsePrompt } from "./parser";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "promptsense" is now active!');

  // Diagnostics
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("promptsense");
  context.subscriptions.push(diagnosticCollection);
  subscribeToDocumentChanges(context, diagnosticCollection);

  // Completion
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "promptsense" },
      new PromptCompletionProvider(),
      ":",
      " ",
    ),
  );

  // Hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { language: "promptsense" },
      new PromptHoverProvider(),
    ),
  );

  // Track document changes for basic parsing verification
  vscode.workspace.onDidOpenTextDocument((doc) => {
    if (doc.languageId === "promptsense" || doc.fileName.endsWith(".prompt")) {
      const parsed = parsePrompt(doc.getText());
      console.log("Parsed Prompt on Open:", parsed);
    }
  });

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      event.document.languageId === "promptsense" ||
      event.document.fileName.endsWith(".prompt")
    ) {
      const parsed = parsePrompt(event.document.getText());
      console.log("Parsed Prompt on Change:", parsed);
    }
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
