# 📄 PromptSense Design Specification

**PromptSense** is a professional VS Code extension designed specifically for `.prompt` files. It bridges the gap between raw text and structured AI assets by providing a robust **configuration + template** authoring environment.

---

## 🧠 Core Concept

A `.prompt` file is a structured document consisting of two primary layers:

1. **Metadata Layer (Frontmatter)**: YAML-based configuration defining model parameters, schemas, and inputs.
2. **Template Layer (Body)**: A dynamic text template utilizing variables for runtime interpolation.

### Example Structure

```yaml
---
model: gemini-2.0-flash
input:
  schema: UserProfile
---
Hello {{name}}, welcome to the PromptSense workflow.
```

---

## 🧬 Pluggable Schema System

PromptSense is built with extensibility in mind, supporting multiple schema strategies out of the box.

### 1. JSON Schema (Standard)

Supports both inline and external JSON Schema definitions for strict validation.

```yaml
input:
  schema:
    type: object
    properties:
      field1: { type: number, minimum: 20 }
```

### 2. Picoschema (Lightweight)

Support for the Picoschema format commonly used in modern AI frameworks.

```yaml
input:
  schema:
    title: string 
    status?(enum): [PENDING, APPROVED]
    authors(array): { name: string }
```

### 3. Code-Defined Schemas (Reference)

Seamlessly reference schemas defined within your application code (e.g., Genkit-style Zod schemas).

```typescript
const MenuItemSchema = ai.defineSchema("MenuItemSchema", z.object({ ... }));
```

```yaml
output:
  schema: MenuItemSchema
```

> [!IMPORTANT]
> **Behavioral Goal**: The extension does not enforce a single schema system. Resolution is pluggable, and unknown types degrade gracefully without breaking the editor experience.

---

## ⚙️ Core Responsibilities

The extension provides a rich developer experience (DX) through three primary layers:

### 1. Parsing & Syntax Awareness

- **Frontmatter Detection**: Accurate boundary detection of configuration blocks.
- **Keyword Highlighting**: Specialty colors for `model`, `schema`, `input`, etc.
- **Variable Recognition**: Distinct styling for `{{templateVariables}}`.

### 2. Intelligent Tooling

- **Smart Autocomplete**: Context-aware suggestions for model names and config keys.
- **Variable Tracking**: Automatic extraction and tracking of variables across the file.
- **Hover Intelligence**: Deep-dive into schema definitions and variable types directly in the editor.

### 3. Validation & Diagnostics

- **Structural Integrity**: Warning for missing required fields or invalid YAML.
- **Schema Alignment**: Real-time validation of template variables against the resolved schema.

---

## 🎯 Design Constraints

- **Framework Agnostic**: Works with any AI runtime or framework.
- **Incremental Enhancement**: Start with basic highlighting; unlock advanced validation as schemas are defined.
- **Performance First**: Minimal impact on editor latency; no hard dependencies on external network APIs.

---

## ⚠️ Scope Boundaries

PromptSense is strictly a **development-time tool**.

- **Non-Goals**: Prompt execution, model inference, or acting as an AI runtime.
- **Primary Goal**: Ensure prompts are **Structured**, **Validated**, and **Tool-Aware**.

---

## 🔍 Instructions for AI Agents

Treat `.prompt` files as **Structured Documents** with strict configuration semantics. They are not plain text; they are machine-readable assets with dynamic parts.
