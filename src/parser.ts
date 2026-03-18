import * as yaml from "yaml";
import { type ResolvedSchema, parsePicoschema } from "./schemas/picoschema";
import { parseJsonSchema } from "./schemas/json-schema";

export interface ParsedPrompt {
  config: any;
  template: string;
  variables: string[];
  resolvedSchema?: ResolvedSchema;
  frontmatterRange?: { startLine: number; endLine: number };
  templateRange?: { startLine: number; endLine: number };
  errors: Array<{ message: string; line?: number; column?: number }>;
}

export function parsePrompt(content: string): ParsedPrompt {
  const result: ParsedPrompt = {
    config: {},
    template: "",
    variables: [],
    errors: [],
  };

  const lines = content.split("\n");
  const frontmatterMatches = content.match(/^---\s*$/gm);

  if (!frontmatterMatches || frontmatterMatches.length < 2) {
    result.template = content;
    result.variables = extractVariables(content);
    result.templateRange = { startLine: 0, endLine: lines.length - 1 };
    return result;
  }

  // Find boundaries
  const firstBoundaryIndex = content.indexOf("---");
  const firstBoundaryEnd = content.indexOf("\n", firstBoundaryIndex) + 1;
  const secondBoundaryIndex = content.indexOf("---", firstBoundaryEnd);

  if (secondBoundaryIndex === -1) {
    result.template = content;
    result.variables = extractVariables(content);
    return result;
  }

  const secondBoundaryEnd = content.indexOf("\n", secondBoundaryIndex) + 1;

  const yamlContent = content.substring(firstBoundaryEnd, secondBoundaryIndex);
  result.template = content.substring(
    secondBoundaryEnd === 0 ? secondBoundaryIndex + 3 : secondBoundaryEnd,
  );

  // Set ranges (0-indexed for internal use, usually match VS Code lines)
  const firstBoundaryLine =
    content.substring(0, firstBoundaryIndex).split("\n").length - 1;
  const secondBoundaryLine =
    content.substring(0, secondBoundaryIndex).split("\n").length - 1;

  result.frontmatterRange = {
    startLine: firstBoundaryLine,
    endLine: secondBoundaryLine,
  };

  result.templateRange = {
    startLine: secondBoundaryLine + 1,
    endLine: lines.length - 1,
  };

  try {
    result.config = yaml.parse(yamlContent) || {};

    // Resolve Schema if present in input
    if (result.config.input?.schema) {
      const schemaInput = result.config.input.schema;

      // JSON Schema usually has 'type: object' at root or 'properties'
      if (
        typeof schemaInput === "object" &&
        (schemaInput.type === "object" || schemaInput.properties)
      ) {
        result.resolvedSchema = parseJsonSchema(schemaInput);
      } else if (typeof schemaInput === "object") {
        // Fallback to Picoschema for other object shapes
        result.resolvedSchema = parsePicoschema(schemaInput);
      }
    }
  } catch (err: any) {
    // Attempt to extract line from YAML error
    const match = err.message.match(/at line (\d+), column (\d+)/);
    result.errors.push({
      message: err.message,
      line: match
        ? Number.parseInt(match[1]) + firstBoundaryLine
        : firstBoundaryLine + 1,
      column: match ? Number.parseInt(match[2]) : 0,
    });
  }

  result.variables = extractVariables(result.template);

  return result;
}

function extractVariables(template: string): string[] {
  const variables = new Set<string>();

  // Extract regular variables {{var}}
  for (const match of template.matchAll(/\{\{([a-zA-Z0-9_.-]+)\}\}/g)) {
    const name = match[1];
    if (
      !name.startsWith("#") &&
      !name.startsWith("/") &&
      !name.startsWith(">")
    ) {
      variables.add(name);
    }
  }

  // Extract from block tags {{#if var}}
  for (const match of template.matchAll(/\{\{#[a-z]+\s+([a-zA-Z0-9_.-]+)/g)) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
