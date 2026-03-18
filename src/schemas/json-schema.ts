import type { ResolvedSchema, SchemaField } from "./picoschema";

export function parseJsonSchema(json: any): ResolvedSchema {
  const schema: ResolvedSchema = {};

  if (!json || typeof json !== "object") {
    return schema;
  }

  const props = json.properties || {};
  const required = new Set(json.required || []);

  for (const [key, value] of Object.entries(props)) {
    schema[key] = convertJsonField(value, required.has(key));
  }

  return schema;
}

function convertJsonField(field: any, isRequired: boolean): SchemaField {
  const type = field.type || "any";
  const optional = !isRequired;
  let isCollection = false;
  let subFields: Record<string, SchemaField> | undefined;

  if (type === "array") {
    isCollection = true;
    if (field.items && field.items.type === "object") {
      subFields = parseJsonSchema(field.items);
    }
  } else if (type === "object") {
    subFields = parseJsonSchema(field);
  }

  return {
    type: type === "array" && field.items?.type ? field.items.type : type,
    description: field.description,
    optional,
    isCollection,
    subFields,
    enumValues: field.enum,
  };
}
