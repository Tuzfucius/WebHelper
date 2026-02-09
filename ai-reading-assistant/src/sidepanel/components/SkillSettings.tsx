import React from 'react'
import { skillManager } from '../../core/skills'
import { Cpu, CheckCircle2, ChevronRight } from 'lucide-react'

export const SkillSettings: React.FC = () => {
    const skills = skillManager.getSkillsDefinitions()

    return (
        <div className="p-4 bg-white dark:bg-[#2B2930] rounded-2xl border border-[#E7E0EC] dark:border-[#49454F] space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-[#D0BCFF] dark:bg-[#4F378B] rounded-xl text-[#21005D] dark:text-[#EADDFF]">
                    <Cpu size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold dark:text-[#E6E1E5]">Skills & MCP 集成</h3>
                    <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">AI 当前可调用的工具与协议插件</p>
                </div>
            </div>

            <div className="space-y-3">
                {skills.map((skill) => (
                    <div
                        key={skill.name}
                        className="group p-3 bg-[#F3EDF7] dark:bg-[#1C1B1F] rounded-xl border border-transparent hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-all"
                    >
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#6750A4] dark:text-[#D0BCFF] font-mono">{skill.name}</span>
                                <span className="px-1.5 py-0.5 rounded-md bg-green-100 dark:bg-green-900/30 text-[9px] text-green-700 dark:text-green-400 font-medium flex items-center gap-1">
                                    <CheckCircle2 size={10} /> Enabled
                                </span>
                            </div>
                            <ChevronRight size={14} className="text-[#49454F] dark:text-[#CAC4D0] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[11px] text-[#49454F] dark:text-[#CAC4D0] leading-relaxed mb-2">
                            {skill.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {Object.keys(skill.parameters.properties).map(param => (
                                <span key={param} className="px-1.5 py-0.5 rounded bg-white dark:bg-[#2B2930] border border-[#E7E0EC] dark:border-[#49454F] text-[9px] text-[#49454F] dark:text-[#CAC4D0]">
                                    {param}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
                {skills.length === 0 && (
                    <div className="text-center py-6 text-xs text-[#49454F] dark:text-[#CAC4D0]">
                        暂无已激活的 Skills
                    </div>
                )}
            </div>

            <div className="pt-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl">
                    <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
                        <strong>💡 提示:</strong> AI 会根据您的需求自动决定何时调用这些技能。您可以在聊天中使用“查找”、“搜索”等关键词触发。
                    </p>
                </div>
            </div>
        </div>
    )
}
