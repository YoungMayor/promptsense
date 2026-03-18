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

  // 3. Validate variables against schema
  if (parsed.resolvedSchema) {
    // Extract variables with dots and handle `#each` scopes
    const varUsages = extractVariableUsages(content, parsed.templateRange?.startLine || 0);

    for (const usage of varUsages) {
      const field = resolveSchemaPath(parsed.resolvedSchema, usage.path);
      
      if (!field && !usage.isInEachScope) {
         diagnostics.push(
           new vscode.Diagnostic(
             usage.range,
             `Variable '${usage.path}' is not defined in the schema.`,
             vscode.DiagnosticSeverity.Warning
           )
         );
      } else if (field) {
        // Validation: Array used without #each
        if (field.isCollection && !usage.isUsedInEachHead && !usage.isInEachScope) {
           diagnostics.push(
             new vscode.Diagnostic(
               usage.range,
               `Variable '${usage.path}' is an array. Use '{{#each ${usage.path}}}' to iterate over it instead of direct interpolation.`,
               vscode.DiagnosticSeverity.Error
             )
           );
        }
      }
    }
  }

  collection.set(document.uri, diagnostics);
}

interface VariableUsage {
  path: string;
  range: vscode.Range;
  isUsedInEachHead: boolean;
  isInEachScope: boolean;
}

function extractVariableUsages(content: string, templateStartLine: number): VariableUsage[] {
  const usages: VariableUsage[] = [];
  const lines = content.split("\n");
  let eachScopeDepth = 0;

  for (let i = templateStartLine; i < lines.length; i++) {
    const lineText = lines[i];
    
    // Track #each blocks
    if (lineText.includes("{{#each")) {
      const match = lineText.match(/\{\{\s*#each\s+([a-zA-Z0-9_.-]+)\s*\}\}/);
      if (match) {
        const startIdx = lineText.indexOf(match[0]);
        usages.push({
          path: match[1],
          range: new vscode.Range(i, startIdx, i, startIdx + match[0].length),
          isUsedInEachHead: true,
          isInEachScope: false
        });
        eachScopeDepth++;
        continue;
      }
    }
    
    if (lineText.includes("{{/each}}")) {
      eachScopeDepth--;
      continue;
    }

    // Extract regular variables
    const matches = lineText.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g);
    for (const m of matches) {
      const startIdx = m.index!;
      usages.push({
        path: m[1],
        range: new vscode.Range(i, startIdx, i, startIdx + m[0].length),
        isUsedInEachHead: false,
        isInEachScope: eachScopeDepth > 0
      });
    }
  }

  return usages;
}

function resolveSchemaPath(schema: any, path: string): any {
  if (!schema) {
    return undefined;
  }
  const parts = path.split(".");
  let current = schema;
  for (let i = 0; i < parts.length; i++) {
    const field = current[parts[i]];
    if (!field) {
      return undefined;
    }
    if (i === parts.length - 1) {
      return field;
    }
    if (field.subFields) {
      current = field.subFields;
    } else {
      return undefined;
    }
  }
  return undefined;
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
