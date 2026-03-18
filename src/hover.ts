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
      const lineText = document.lineAt(line).text;
      const wordRange = document.getWordRangeAtPosition(position);
      const word = wordRange ? document.getText(wordRange) : "";

      if (word === "model" && parsed.config.model) {
        return new vscode.Hover(
          new vscode.MarkdownString(
            `**Model**: \`${parsed.config.model}\`\nThe LLM identifier used for this prompt.`,
          ),
        );
      }

      if (word === "input" || word === "schema") {
        return new vscode.Hover(
          new vscode.MarkdownString(
            `**Schema**: Configuration for prompt input/output structure.`,
          ),
        );
      }

      // Variable hovers in template
      if (line >= parsed.templateRange?.startLine!) {
        const field = parsed.resolvedSchema?.[word];
        if (field) {
          let hoverText = `**Variable**: \`${word}\`\n\n**Type**: \`${field.type}${field.isCollection ? "[]" : ""}\`${field.optional ? " (optional)" : ""}`;
          if (field.description) {
            hoverText += `\n\n---\n${field.description}`;
          }
          if (field.enumValues) {
            hoverText += `\n\n**Enums**: \`${field.enumValues.join(", ")}\``;
          }
          return new vscode.Hover(new vscode.MarkdownString(hoverText));
        }
      }
    }

    return null;
  }
}
