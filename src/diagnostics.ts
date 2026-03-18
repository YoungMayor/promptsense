import * as vscode from "vscode";
import { parsePrompt } from "./parser";

export const DIAGNOSTIC_SOURCE = "PromptSense";

const BUILT_IN_HELPERS = new Set([
  "if",
  "else",
  "unless",
  "each",
  "and",
  "or",
  "not",
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "concat",
  "exec",
  "ask",
  "cat",
  "tail",
  "head",
  "env",
  "role",
  "media",
]);

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
    const varUsages = extractVariableUsages(
      content,
      parsed.templateRange?.startLine || 0,
    );

    for (const usage of varUsages) {
      const field = resolveSchemaPath(parsed.resolvedSchema, usage.path);

      if (!field) {
        if (!usage.isInEachScope) {
          diagnostics.push(
            new vscode.Diagnostic(
              usage.range,
              `Variable '${usage.path}' is not defined in the schema.`,
              vscode.DiagnosticSeverity.Error,
            ),
          );
        }
      } else {
        // Validation: Array used without #each
        if (
          field.isCollection &&
          !usage.isUsedInEachHead &&
          !usage.isInEachScope
        ) {
          diagnostics.push(
            new vscode.Diagnostic(
              usage.range,
              `Type Mismatch: '${usage.path}' is an array (collection). Direct interpolation is not supported. Use '{{#each ${usage.path}}} ... {{/each}}' to iterate over its items.`,
              vscode.DiagnosticSeverity.Error,
            ),
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

function extractVariableUsages(
  content: string,
  templateStartLine: number,
): VariableUsage[] {
  const usages: VariableUsage[] = [];
  const lines = content.split("\n");
  let eachScopeDepth = 0;

  for (let i = templateStartLine; i < lines.length; i++) {
    const lineText = lines[i];

    // Find all {{ ... }} blocks
    const expressionRegex =
      /\{\{\s*(#?\/?[a-zA-Z0-9_.-]+(?:\s+[a-zA-Z0-9_.-]+)*)\s*\}\}/g;
    const matches = lineText.matchAll(expressionRegex);

    for (const m of matches) {
      const fullExpression = m[1];
      const startIdx = m.index! + m[0].indexOf(fullExpression);

      // Handle block helpers
      if (fullExpression.startsWith("#each")) {
        const parts = fullExpression.split(/\s+/);
        if (parts.length > 1) {
          const varName = parts[1];
          const varIdx = fullExpression.indexOf(varName);
          usages.push({
            path: varName,
            range: new vscode.Range(
              i,
              startIdx + varIdx,
              i,
              startIdx + varIdx + varName.length,
            ),
            isUsedInEachHead: true,
            isInEachScope: false,
          });
        }
        eachScopeDepth++;
        continue;
      }

      if (fullExpression.startsWith("/each")) {
        eachScopeDepth--;
        continue;
      }

      // Handle other helpers and regular variables
      // Pattern: Tokenize by space and filter out built-ins, quotes, and numbers
      const tokens = fullExpression.replace(/[#\/]/g, "").split(/\s+/);
      for (const token of tokens) {
        if (!token) {
          continue;
        }

        // Skip built-ins, strings, and numbers
        if (
          BUILT_IN_HELPERS.has(token) ||
          token.startsWith('"') ||
          token.startsWith("'") ||
          /^\d+$/.test(token)
        ) {
          continue;
        }

        const tokenIdx = fullExpression.indexOf(token);
        usages.push({
          path: token,
          range: new vscode.Range(
            i,
            startIdx + tokenIdx,
            i,
            startIdx + tokenIdx + token.length,
          ),
          isUsedInEachHead: false,
          isInEachScope: eachScopeDepth > 0,
        });
      }
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
    const part = parts[i];
    const field = current[part];
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
