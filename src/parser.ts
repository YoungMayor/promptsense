import * as YAML from "yaml";

export interface PromptDocument {
	config: Record<string, unknown>;
	template: string;
	variables: string[];
}

export function parsePrompt(content: string): PromptDocument {
	const parts = content.split(/^---\s*$/m);

	let config: Record<string, unknown> = {};
	let template = "";

	if (parts.length >= 3) {
		// Found frontmatter
		const rawConfig = parts[1].trim();
		try {
			config = YAML.parse(rawConfig);
		} catch (e) {
			console.error("Failed to parse YAML frontmatter", e);
		}
		template = parts.slice(2).join("---").trim();
	} else {
		// No frontmatter found
		template = content.trim();
	}

	const variables = extractVariables(template);

	return {
		config,
		template,
		variables,
	};
}

function extractVariables(template: string): string[] {
	const variables = new Set<string>();

	for (const match of template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)) {
		variables.add(match[1]);
	}

	return Array.from(variables);
}
