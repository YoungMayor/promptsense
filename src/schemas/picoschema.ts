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
 */
export function parsePicoschema(input: any): ResolvedSchema {
  const schema: ResolvedSchema = {};

  if (!input || typeof input !== "object") {
    return schema;
  }

  for (const [key, value] of Object.entries(input)) {
    const { cleanKey, optional, isCollection: keyIsCollection, isEnum: keyIsEnum } = parseKey(key);
    
    if (keyIsEnum && Array.isArray(value)) {
      schema[cleanKey] = {
        type: "enum",
        optional,
        isCollection: false,
        enumValues: value.map(v => String(v)),
      };
      continue;
    }

    if (typeof value === "string") {
      const field = parseStringDefinition(value, optional);
      if (keyIsCollection) {
        field.isCollection = true;
      }
      schema[cleanKey] = field;
    } else if (typeof value === "object" && value !== null) {
      const { type, isCollection, cleanTypeKey } = parseCollectionType(cleanKey);
      
      schema[cleanTypeKey] = {
        type: type,
        optional: optional || cleanKey.endsWith("?"),
        isCollection: isCollection || keyIsCollection,
        subFields: Array.isArray(value) ? undefined : parsePicoschema(value),
      };
    }
  }

  return schema;
}

function parseKey(key: string): { cleanKey: string; optional: boolean; isCollection: boolean; isEnum: boolean } {
  let cleanKey = key;
  let optional = false;
  let isCollection = false;
  let isEnum = false;

  if (cleanKey.endsWith("?")) {
    cleanKey = cleanKey.slice(0, -1);
    optional = true;
  }

  if (cleanKey.includes("(array)")) {
    cleanKey = cleanKey.replace("(array)", "");
    isCollection = true;
  } else if (cleanKey.includes("(object)")) {
    cleanKey = cleanKey.replace("(object)", "");
  } else if (cleanKey.includes("(enum)")) {
    cleanKey = cleanKey.replace("(enum)", "");
    isEnum = true;
  }

  return { cleanKey, optional, isCollection, isEnum };
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

  const enumMatch = key.match(/(.*)\(enum\)$/);
  if (enumMatch) {
     return { type: "enum", isCollection: false, cleanTypeKey: enumMatch[1] };
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
