import * as vscode from "vscode";
import { parsePrompt } from "./parser";

export const DIAGNOSTIC_SOURCE = "PromptSense";

export function refreshDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): void {
  if (
    document.languageId !== "promptsense" &&
    !document.fileName.endsWith(".prompt")
  ) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const content = document.getText();
  const parsed = parsePrompt(content);

  // 1. Report YAML errors from parser
  for (const error of parsed.errors) {
    const line = error.line || 0;
    const range = new vscode.Range(line, 0, line, 100);
    diagnostics.push(
      new vscode.Diagnostic(
        range,
        error.message,
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }

  // 2. Validate required fields
  if (parsed.frontmatterRange) {
    if (!parsed.config.model) {
      const range = new vscode.Range(
        parsed.frontmatterRange.startLine,
        0,
        parsed.frontmatterRange.startLine,
        3,
      );
      diagnostics.push(
        new vscode.Diagnostic(
          range,
          "Missing required field: 'model'",
          vscode.DiagnosticSeverity.Warning,
        ),
      );
    }
  }

  collection.set(document.uri, diagnostics);
}

export function subscribeToDocumentChanges(
  context: vscode.ExtensionContext,
  collection: vscode.DiagnosticCollection,
): void {
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, collection);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        refreshDiagnostics(editor.document, collection);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      refreshDiagnostics(e.document, collection),
    ),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) =>
      collection.delete(doc.uri),
    ),
  );
}
