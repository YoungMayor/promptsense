# 📄 `ABOUT.md` (AI-agent optimised)

## PromptSense

**PromptSense** is a VS Code extension for `.prompt` files that provides structured authoring, validation, and intelligent tooling for AI prompt workflows.

It defines and supports a **config + template format** for prompts, enabling them to be treated as structured, analyzable assets rather than raw text.

---

## 🧠 Core Concept

A `.prompt` file is a combination of:

1. **Structured configuration (YAML-like)**
2. **A dynamic template using variables**

Example:

```
---
model: gemini
input:
  schema: User
---

Hello {{name}}
```

The extension must parse and understand both layers.

---

## 🧬 Schema System (Critical)

PromptSense must support multiple schema definition strategies:

### 1. JSON Schema

Inline or referenced JSON Schema objects.

```yaml
input:
  schema:
    type: object
    properties:
      field1:
        type: number
        minimum: 20
```

### 2. Picoschema

Lightweight schema definitions used in certain AI frameworks.

```yaml
input:
  schema:
    title: string # string, number, and boolean types are defined like this
    subtitle?: string # optional fields are marked with a `?`
    draft?: boolean, true when in draft state
    status?(enum, approval status): [PENDING, APPROVED]
    date: string, the date of publication e.g. '2024-04-09' # descriptions follow a comma
    tags(array, relevant tags for article): string # arrays are denoted via parentheses
    authors(array):
        name: string
        email?: string
    metadata?(object): # objects are also denoted via parentheses
        updatedAt?: string, ISO timestamp of last update
        approvedBy?: integer, id of approver
    extra?: any, arbitrary extra data
    (*): string, wildcard field
```

### 3. Code-defined schemas (reference-based)

Schemas defined in application code and referenced by name (e.g. Genkit-style).

Example:

```typescript
import { z } from 'genkit';

const MenuItemSchema = ai.defineSchema(
  'MenuItemSchema',
  z.object({
    dishname: z.string(),
    description: z.string(),
    calories: z.coerce.number(),
    allergens: z.array(z.string()),
  }),
);
```

```yaml
---
model: googleai/gemini-2.5-flash-latest
output:
  schema: MenuItemSchema
---
```

---

### 🧠 Important Behaviour

* The extension must **not assume a single schema system**
* Schema resolution should be **pluggable and extensible**
* Unknown schema types should **not break parsing**, but degrade gracefully

---

## ⚙️ Responsibilities of PromptSense

The extension must:

### 1. Parse `.prompt` structure

* Detect frontmatter boundaries
* Extract configuration fields
* Parse template content

---

### 2. Provide syntax awareness

* Highlight keywords (`model`, `schema`, `input`, etc.)
* Highlight template variables (`{{variable}}`)
* Distinguish config vs template clearly

---

### 3. Enable intelligent autocomplete

* Suggest known configuration keys
* Suggest model names (extensible list)
* Suggest schema references where possible

---

### 4. Detect variables

* Extract all template variables (`{{name}}`)
* Track usage across the file

---

### 5. Validate structure

* Missing required fields
* Invalid configuration shapes
* Conflicts between config and template

---

### 6. Validate against schema

When schema is resolvable:

* Validate template variables against schema fields
* Surface mismatches as diagnostics

---

### 7. Provide hover intelligence

* Show schema details when hovering references
* Show variable context and inferred types

---

## 🎯 Design Constraints

* Must remain **framework-agnostic**
* Must support **incremental enhancement** (basic → advanced features)
* Must prioritise **developer feedback in-editor**
* Must avoid hard dependency on external APIs

---

## 🧭 Extension Behaviour Model

PromptSense operates in layers:

1. **Text parsing layer**
   Understands `.prompt` file structure

2. **Semantic layer**
   Interprets config, variables, and schema relationships

3. **Tooling layer**
   Provides autocomplete, validation, and diagnostics

---

## ⚠️ Non-Goals (Current Scope)

* Executing prompts
* Calling AI models
* Acting as an AI runtime

PromptSense is strictly a **development-time tool**.

---

## 🧠 Key Principle

Prompts should be:

* structured
* validated
* tool-aware

PromptSense exists to enforce this.

---

## 🔍 Final instruction to AI agents

Treat `.prompt` files as:

> Structured documents with strict configuration semantics and dynamic template variables.

Do not treat them as plain text.

