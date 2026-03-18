# PromptSense

**PromptSense** is a VS Code extension for `.prompt` files that provides structured authoring, validation, and intelligent tooling for AI prompt workflows. It treats prompts as structured, analyzable assets by supporting a **config + template format**.

## 🚀 Key Features

- **Syntax Awareness**: Highlight keywords (`model`, `schema`, `input`, etc.) and template variables (`{{variable}}`).
- **Structured Parsing**: Automatically detects frontmatter boundaries and template content.
- **Intelligent Autocomplete**: Suggestions for configuration keys, model names, and schema references.
- **Variable Detection**: Extracts and tracks template variables across the file.
- **Validation**: Surface diagnostics for missing fields, invalid configuration, and mismatches between variables and schemas.
- **Hover Intelligence**: Show schema details and variable context on hover.

## 📖 Core Concept: The `.prompt` File

A `.prompt` file combines structured configuration (YAML-like frontmatter) with a dynamic template.

```yaml
---
model: gemini-2.0-flash
input:
  schema: UserProfile
---
Hello {{name}}, welcome to PromptSense!
```

## 🧬 Schema Support

PromptSense is framework-agnostic and supports multiple schema definition strategies:

1. **JSON Schema**: Inline or referenced objects.
2. **Picoschema**: Lightweight schema definitions.
3. **Code-defined Schemas**: References to schemas defined in your application code (e.g., Gentkit-style `ai.defineSchema`).

## ⚙️ Extension Settings

- `promptsense.enable`: Enable/disable PromptSense features.
- `promptsense.models`: Custom list of AI models for autocomplete.

## 🛠️ Development

PromptSense is strictly a **development-time tool**. It does not execute prompts or call AI models directly.
