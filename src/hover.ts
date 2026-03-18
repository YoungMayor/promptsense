import * as vscode from "vscode";
import { parsePrompt } from "./parser";

export class PromptHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const content = document.getText();
    const parsed = parsePrompt(content);

    if (!parsed.frontmatterRange) {
      return null;
    }

    const line = position.line;
    if (
      line >= parsed.frontmatterRange.startLine &&
      line <= parsed.frontmatterRange.endLine
    ) {
      const wordRange = document.getWordRangeAtPosition(position);
      const word = wordRange ? document.getText(wordRange) : "";

      if (word === "model" && parsed.config.model) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            `**Model**: \`${parsed.config.model}\`\n\nThe LLM identifier used for this prompt.`,
          ),
        );
      }

      if (word === "input" || word === "schema") {
        return new vscode.Hover(
          new vscode.MarkdownString(
            "**Schema**: Configuration for prompt input/output structure.",
          ),
        );
      }
    }

    // Variable hovers in template
    if (parsed.templateRange && line >= parsed.templateRange.startLine) {
      const wordRange = document.getWordRangeAtPosition(position);
      const word = wordRange ? document.getText(wordRange) : "";
      
      if (!word) {
        return null;
      }

      // Handle dot notation: try to find the full path if possible
      const lineText = document.lineAt(line).text;
      const fullPathMatch = lineText.match(new RegExp(`([a-zA-Z0-9_.-]*${word}[a-zA-Z0-9_.-]*)`));
      const fullPath = fullPathMatch ? fullPathMatch[1] : word;

      const field = resolveSchemaField(parsed.resolvedSchema, fullPath);
      if (field) {
        let hoverText = `**Variable**: \`${fullPath}\`\n\n**Type**: \`${field.type}${field.isCollection ? "[]" : ""}\`${field.optional ? " (optional)" : ""}`;
        if (field.description) {
          hoverText += `\n\n---\n${field.description}`;
        }
        if (field.enumValues) {
          hoverText += `\n\n**Enums**: \`${field.enumValues.join(", ")}\``;
        }
        return new vscode.Hover(new vscode.MarkdownString(hoverText));
      }
    }

    return null;
  }
}

function resolveSchemaField(schema: any, path: string): any {
  if (!schema) return undefined;
  
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
