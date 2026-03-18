import * as vscode from "vscode";

const FRONTMATTER_KEYS = [
  "model",
  "input",
  "output",
  "config",
  "temperature",
  "max_tokens",
];
const COMMON_MODELS = [
  "googleai/gemini-2.0-flash",
  "googleai/gemini-1.5-pro",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3-opus",
  "openai/gpt-4o",
  "openai/gpt-4-turbo",
];

export class PromptCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const text = document.getText();
    const frontmatterMatches = text.match(/^---\s*$/gm);

    if (!frontmatterMatches || frontmatterMatches.length < 2) {
      return [];
    }

    const firstBoundary = text.indexOf("---");
    const secondBoundary = text.indexOf("---", firstBoundary + 3);
    const offset = document.offsetAt(position);

    // Only provide completions within frontmatter
    if (offset > firstBoundary && offset < secondBoundary) {
      const lineText = document.lineAt(position.line).text;

      // If we are at the start of a line or after spaces, suggests keys
      if (
        /^\s*[a-zA-Z0-9_-]*$/.test(lineText.substring(0, position.character))
      ) {
        return FRONTMATTER_KEYS.map((key) => {
          const item = new vscode.CompletionItem(
            key,
            vscode.CompletionItemKind.Keyword,
          );
          item.insertText = `${key}: `;
          return item;
        });
      }

      // If we are after "model:", suggest models
      if (
        /\bmodel:\s*[a-zA-Z0-9_-]*$/.test(
          lineText.substring(0, position.character),
        )
      ) {
        return COMMON_MODELS.map((model) => {
          return new vscode.CompletionItem(
            model,
            vscode.CompletionItemKind.Value,
          );
        });
      }
    }

    return [];
  }
}
