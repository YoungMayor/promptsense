export interface SchemaField {
  type: string;
  description?: string;
  optional: boolean;
  isCollection: boolean;
  subFields?: Record<string, SchemaField>;
  enumValues?: string[];
}

export type ResolvedSchema = Record<string, SchemaField>;

/**
 * Parses a Picoschema-style object into a structured Internal Schema.
 * Picoschema looks like:
 *   field: string, description
 *   optional_field?: integer
 *   list(array): string
 */
export function parsePicoschema(input: any): ResolvedSchema {
  const schema: ResolvedSchema = {};

  if (!input || typeof input !== "object") {
    return schema;
  }

  for (const [key, value] of Object.entries(input)) {
    const { cleanKey, optional } = parseKey(key);
    
    if (typeof value === "string") {
      schema[cleanKey] = parseStringDefinition(value, optional);
    } else if (typeof value === "object" && value !== null) {
      const { type, isCollection, cleanTypeKey } = parseCollectionType(cleanKey);
      
      schema[cleanTypeKey] = {
        type: type,
        optional: optional,
        isCollection: isCollection,
        subFields: parsePicoschema(value),
      };
    }
  }

  return schema;
}

function parseKey(key: string): { cleanKey: string; optional: boolean } {
  if (key.endsWith("?")) {
    return { cleanKey: key.slice(0, -1), optional: true };
  }
  return { cleanKey: key, optional: false };
}

function parseCollectionType(key: string): { type: string; isCollection: boolean; cleanTypeKey: string } {
  const arrayMatch = key.match(/(.*)\(array\)$/);
  if (arrayMatch) {
    return { type: "array", isCollection: true, cleanTypeKey: arrayMatch[1] };
  }
  
  const objectMatch = key.match(/(.*)\(object\)$/);
  if (objectMatch) {
    return { type: "object", isCollection: false, cleanTypeKey: objectMatch[1] };
  }

  return { type: "object", isCollection: false, cleanTypeKey: key };
}

function parseStringDefinition(def: string, optional: boolean): SchemaField {
  // Pattern: "type, description"
  const parts = def.split(",").map(p => p.trim());
  const typePart = parts[0];
  const description = parts.length > 1 ? parts.slice(1).join(", ") : undefined;

  // Check for enum: "enum [A, B]"
  const enumMatch = typePart.match(/^enum\s*\[(.*)\]$/);
  if (enumMatch) {
    return {
      type: "enum",
      optional,
      isCollection: false,
      description,
      enumValues: enumMatch[1].split(",").map(e => e.trim()),
    };
  }

  return {
    type: typePart,
    optional,
    isCollection: false,
    description,
  };
}
