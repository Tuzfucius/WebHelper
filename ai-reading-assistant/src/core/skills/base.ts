import { MCPTool } from '../../types'

export interface Skill {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
    execute: (args: any) => Promise<any>;
    enabled: boolean;
    source: 'builtin' | 'mcp'; // 技能来源
    serverUrl?: string;        // MCP 服务器 URL
}

export class SkillManager {
    private skills: Map<string, Skill> = new Map();

    registerSkill(skill: Omit<Skill, 'enabled' | 'source'> & { enabled?: boolean; source?: 'builtin' | 'mcp' }) {
        const fullSkill: Skill = {
            ...skill,
            enabled: skill.enabled ?? true,
            source: skill.source ?? 'builtin'
        };
        this.skills.set(skill.name, fullSkill);
        console.log(`[SkillManager] Registered skill: ${skill.name} (${fullSkill.source})`);
    }

    /**
     * 注册来自 MCP Server 的工具
     */
    registerMCPSkill(tool: MCPTool, serverUrl: string) {
        const skill: Skill = {
            name: `mcp_${tool.name}`,
            description: `[MCP] ${tool.description}`,
            parameters: tool.inputSchema || { type: 'object', properties: {} },
            enabled: true,
            source: 'mcp',
            serverUrl,
            execute: async (args: any) => {
                try {
                    const response = await fetch(`${serverUrl}/call`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tool: tool.name, arguments: args })
                    });
                    if (!response.ok) throw new Error(`MCP call failed: ${response.statusText}`);
                    return await response.json();
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'MCP tool call failed'
                    };
                }
            }
        };
        this.skills.set(skill.name, skill);
        console.log(`[SkillManager] Registered MCP skill: ${skill.name} from ${serverUrl}`);
    }

    /**
     * 移除来自指定 MCP Server 的所有工具
     */
    removeMCPSkills(serverUrl: string) {
        const toRemove: string[] = [];
        this.skills.forEach((skill, name) => {
            if (skill.source === 'mcp' && skill.serverUrl === serverUrl) {
                toRemove.push(name);
            }
        });
        toRemove.forEach(name => this.skills.delete(name));
        console.log(`[SkillManager] Removed ${toRemove.length} MCP skills from ${serverUrl}`);
    }

    /**
     * 只返回启用的 Skills 定义
     */
    getSkillsDefinitions() {
        return Array.from(this.skills.values())
            .filter(s => s.enabled)
            .map(s => ({
                name: s.name,
                description: s.description,
                parameters: s.parameters
            }));
    }

    /**
     * 返回所有 Skills（包括禁用的），用于 UI 管理
     */
    getAllSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    /**
     * 切换 Skill 启用/禁用
     */
    toggleSkill(name: string): boolean {
        const skill = this.skills.get(name);
        if (!skill) return false;
        skill.enabled = !skill.enabled;
        console.log(`[SkillManager] Toggled skill ${name}: ${skill.enabled ? 'enabled' : 'disabled'}`);
        return skill.enabled;
    }

    async callSkill(name: string, args: any) {
        const skill = this.skills.get(name);
        if (!skill) throw new Error(`Skill ${name} not found`);
        if (!skill.enabled) throw new Error(`Skill ${name} is disabled`);
        console.log(`[SkillManager] Executing skill: ${name}`, args);
        return await skill.execute(args);
    }
}

export const skillManager = new SkillManager();

// Import and register all built-in skills
import './web_search'
import './translate'
import './analyze_page'

console.log('[SkillManager] All skills registered:', skillManager.getSkillsDefinitions().map(s => s.name));
