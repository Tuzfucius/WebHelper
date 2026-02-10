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
        console.log(`[SkillManager] Registered skill: ${skill.name}`);
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
        console.log(`[SkillManager] Executing skill: ${name}`, args);
        return await skill.execute(args);
    }
}

export const skillManager = new SkillManager();

// Import and register all skills
import './web_search'
import './translate'
import './analyze_page'

console.log('[SkillManager] All skills registered:', skillManager.getSkillsDefinitions().map(s => s.name));
