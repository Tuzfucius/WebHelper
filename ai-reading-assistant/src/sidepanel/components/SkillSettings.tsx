import React, { useState, useEffect } from 'react'
import { skillManager } from '../../core/skills'
import type { Skill } from '../../core/skills/base'
import { MCPManager } from './MCPManager'
import { Zap, ToggleLeft, ToggleRight } from 'lucide-react'

export const SkillSettings: React.FC = () => {
    const [skills, setSkills] = useState<Skill[]>([])

    useEffect(() => {
        setSkills(skillManager.getAllSkills())
    }, [])

    const handleToggle = (name: string) => {
        skillManager.toggleSkill(name)
        // 刷新列表
        setSkills([...skillManager.getAllSkills()])
    }

    const builtinSkills = skills.filter(s => s.source === 'builtin')
    const mcpSkills = skills.filter(s => s.source === 'mcp')

    return (
        <div className="space-y-6">
            {/* 内置 Skills */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#D0BCFF] dark:bg-[#4F378B] rounded-lg text-[#21005D] dark:text-[#EADDFF]">
                        <Zap size={16} />
                    </div>
                    <h4 className="text-xs font-semibold dark:text-[#E6E1E5]">内置 Skills</h4>
                    <span className="text-[10px] text-[#79747E] bg-[#F3EDF7] dark:bg-[#2B2930] px-2 py-0.5 rounded-full">
                        {builtinSkills.filter(s => s.enabled).length}/{builtinSkills.length} 已启用
                    </span>
                </div>

                {builtinSkills.map(skill => (
                    <div
                        key={skill.name}
                        className={`p-3 rounded-xl border transition-all ${skill.enabled
                                ? 'bg-[#F3EDF7] dark:bg-[#1C1B1F] border-[#D0BCFF] dark:border-[#4F378B]'
                                : 'bg-gray-50 dark:bg-[#1C1B1F]/50 border-gray-200 dark:border-gray-700 opacity-60'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-[#6750A4] dark:text-[#D0BCFF]">{skill.name}</span>
                            <button
                                onClick={() => handleToggle(skill.name)}
                                className="transition-colors"
                                title={skill.enabled ? '禁用' : '启用'}
                            >
                                {skill.enabled ? (
                                    <ToggleRight size={20} className="text-[#6750A4]" />
                                ) : (
                                    <ToggleLeft size={20} className="text-gray-400" />
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">{skill.description}</p>
                        {skill.parameters?.properties && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {Object.keys(skill.parameters.properties).map(param => (
                                    <span key={param} className="px-1.5 py-0.5 bg-white/70 dark:bg-[#2B2930] rounded text-[9px] font-mono text-[#6750A4] dark:text-[#D0BCFF]">
                                        {param}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* MCP Skills */}
            {mcpSkills.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold dark:text-[#E6E1E5]">MCP 工具</h4>
                    {mcpSkills.map(skill => (
                        <div
                            key={skill.name}
                            className={`p-3 rounded-xl border transition-all ${skill.enabled
                                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                    : 'bg-gray-50 dark:bg-gray-900/10 border-gray-200 dark:border-gray-700 opacity-60'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">MCP</span>
                                    <span className="text-xs font-medium dark:text-[#E6E1E5]">{skill.name.replace('mcp_', '')}</span>
                                </div>
                                <button
                                    onClick={() => handleToggle(skill.name)}
                                    className="transition-colors"
                                >
                                    {skill.enabled ? (
                                        <ToggleRight size={20} className="text-blue-500" />
                                    ) : (
                                        <ToggleLeft size={20} className="text-gray-400" />
                                    )}
                                </button>
                            </div>
                            <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">{skill.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* 分隔线 */}
            <div className="border-t border-[#E7E0EC] dark:border-[#49454F]" />

            {/* MCP Server 管理 */}
            <MCPManager />

            {/* 使用提示 */}
            <div className="p-3 bg-[#FEF7FF] dark:bg-[#21005D]/30 rounded-xl">
                <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] leading-relaxed">
                    💡 <strong>使用提示:</strong> Skills 允许 AI 调用外部工具来增强回答能力。
                    启用的 Skills 会自动被模型识别。您也可以通过 MCP Server 接入更多工具。
                </p>
            </div>
        </div>
    )
}
