export interface Skill {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    execute: (args: any) => Promise<any>;
}

export class SkillManager {
    private skills: Map<string, Skill> = new Map();

    registerSkill(skill: Skill) {
        this.skills.set(skill.name, skill);
    }

    getSkillsDefinitions() {
        return Array.from(this.skills.values()).map(s => ({
            name: s.name,
            description: s.description,
            parameters: s.parameters
        }));
    }

    async callSkill(name: string, args: any) {
        const skill = this.skills.get(name);
        if (!skill) throw new Error(`Skill ${name} not found`);
        return await skill.execute(args);
    }
}

export const skillManager = new SkillManager();

// Register a basic mock skill for demonstration
skillManager.registerSkill({
    name: 'web_search',
    description: 'Search the web for information (Mock)',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'The search query' }
        },
        required: ['query']
    },
    execute: async ({ query }) => {
        return `Results for "${query}": Found some interesting facts about your query...`;
    }
});
