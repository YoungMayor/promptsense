# 🗺 PromptSense Roadmap

This roadmap outlines the development stages for the PromptSense VS Code extension.

## 🛠 Phase 1: Foundations (Current)

- [ ] **Basic Parsing**: Robust detection of frontmatter and template boundaries.
- [ ] **Syntax Highlighting**: Basic colorization for `.prompt` files (YAML frontmatter + Handlebars-style variables).
- [ ] **Extension Scaffolding**: Setup project structure, linting (Biome), and build pipeline.

## 🧠 Phase 2: Intelligence & Diagnostics

- [ ] **Variable Extraction**: Automatically identify all `{{variables}}` in the template.
- [ ] **Basic Validation**: Ensure required frontmatter fields are present.
- [ ] **Autocomplete**: Basic completion for top-level frontmatter keys (`model`, `input`, `output`).

```yaml
---
model: gemini-2.0-flash
input:
  schema: UserProfile
---
Hello {{name}}, welcome to PromptSense!
```

## 🧬 Phase 3: Schema Integration

- [ ] **JSON Schema Support**: Parse and validate against inline/referenced JSON schemas.
- [ ] **Picoschema Support**: Implementation of the Picoschema parsing logic.
- [ ] **Workspace Scanning**: Detect schema definitions in the local codebase (TypeScript/JavaScript).

## 💎 Phase 4: Advanced Developer Experience

- [ ] **Hover Providers**: Show detailed information about schemas and variables.
- [ ] **Definition Provider**: Jump to schema definitions from the `.prompt` file.
- [ ] **Custom Model Providers**: Allow users to define their own model lists via settings.

## 🚀 Phase 5: Ecosystem & Polish

- [ ] **Prompt Linting**: Advanced rules for prompt engineering best practices.
- [ ] **Snippet Support**: Common frontmatter patterns and schema templates.
- [ ] **Documentation**: Comprehensive guides and example workflows.
