import React, { useState } from 'react'
import { useSettings } from '../../stores/AppContext'
import { skillManager } from '../../core/skills'
import { MCPServerConfig, MCPTool } from '../../types'
import { Server, Plus, Trash2, RefreshCw, Wifi, WifiOff, ChevronDown, ChevronRight } from 'lucide-react'
import { useToast } from '../../components/Toast'

export const MCPManager: React.FC = () => {
    const { settings, updateSettings } = useSettings()
    const { showToast } = useToast()
    const [newServerName, setNewServerName] = useState('')
    const [newServerUrl, setNewServerUrl] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [connectingId, setConnectingId] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const mcpServers = settings.mcpServers || []

    const handleAddServer = () => {
        if (!newServerName.trim() || !newServerUrl.trim()) {
            showToast('请填写服务器名称和 URL', 'warning')
            return
        }

        const newServer: MCPServerConfig = {
            id: Date.now().toString(),
            name: newServerName.trim(),
            url: newServerUrl.trim().replace(/\/+$/, ''),
            enabled: true,
            tools: []
        }

        updateSettings({ mcpServers: [...mcpServers, newServer] })
        setNewServerName('')
        setNewServerUrl('')
        setIsAdding(false)
        showToast(`已添加 MCP Server: ${newServer.name}`, 'success')
    }

    const handleRemoveServer = (id: string) => {
        const server = mcpServers.find(s => s.id === id)
        if (server) {
            // 移除该服务器注册的 Skills
            skillManager.removeMCPSkills(server.url)
        }
        updateSettings({ mcpServers: mcpServers.filter(s => s.id !== id) })
        showToast('已移除 MCP Server', 'success')
    }

    const handleToggleServer = (id: string) => {
        const updated = mcpServers.map(s => {
            if (s.id !== id) return s
            const newEnabled = !s.enabled
            if (!newEnabled && s.url) {
                skillManager.removeMCPSkills(s.url)
            }
            return { ...s, enabled: newEnabled }
        })
        updateSettings({ mcpServers: updated })
    }

    const handleConnectAndFetchTools = async (server: MCPServerConfig) => {
        setConnectingId(server.id)
        try {
            // 尝试获取 MCP Server 的工具列表
            const response = await fetch(`${server.url}/tools`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const tools: MCPTool[] = (data.tools || data || []).map((t: any) => ({
                name: t.name,
                description: t.description || '',
                inputSchema: t.inputSchema || t.input_schema || { type: 'object', properties: {} }
            }))

            // 先移除旧的 MCP Skills
            skillManager.removeMCPSkills(server.url)

            // 注册新的 MCP Skills
            tools.forEach(tool => skillManager.registerMCPSkill(tool, server.url))

            // 更新服务器配置
            const updated = mcpServers.map(s =>
                s.id === server.id
                    ? { ...s, tools, lastConnected: new Date().toISOString() }
                    : s
            )
            updateSettings({ mcpServers: updated })

            showToast(`已连接并获取 ${tools.length} 个工具`, 'success')
        } catch (error) {
            showToast(`连接失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
        } finally {
            setConnectingId(null)
        }
    }

    return (
        <div className="space-y-3">
            {/* 标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#D0BCFF] dark:bg-[#4F378B] rounded-lg text-[#21005D] dark:text-[#EADDFF]">
                        <Server size={16} />
                    </div>
                    <h4 className="text-xs font-semibold dark:text-[#E6E1E5]">MCP Servers</h4>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 text-xs text-[#6750A4] hover:bg-[#EADDFF] dark:hover:bg-[#4A4458] px-2 py-1 rounded-lg transition-colors"
                >
                    <Plus size={14} />
                    添加
                </button>
            </div>

            {/* 添加新服务器表单 */}
            {isAdding && (
                <div className="p-3 bg-[#F3EDF7] dark:bg-[#1C1B1F] rounded-xl space-y-2">
                    <input
                        type="text"
                        value={newServerName}
                        onChange={(e) => setNewServerName(e.target.value)}
                        placeholder="服务器名称"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#2B2930] border border-[#E7E0EC] dark:border-[#49454F] rounded-lg focus:outline-none focus:border-[#6750A4]"
                    />
                    <input
                        type="url"
                        value={newServerUrl}
                        onChange={(e) => setNewServerUrl(e.target.value)}
                        placeholder="http://localhost:3000"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#2B2930] border border-[#E7E0EC] dark:border-[#49454F] rounded-lg focus:outline-none focus:border-[#6750A4]"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAddServer} className="flex-1 px-3 py-1.5 bg-[#6750A4] text-white text-xs rounded-lg hover:bg-[#5235a0]">
                            确认添加
                        </button>
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs border border-[#E7E0EC] rounded-lg hover:bg-white/50">
                            取消
                        </button>
                    </div>
                </div>
            )}

            {/* 服务器列表 */}
            {mcpServers.length === 0 && !isAdding && (
                <div className="text-center py-4 text-xs text-[#49454F] dark:text-[#CAC4D0]">
                    暂无配置的 MCP Server
                </div>
            )}

            {mcpServers.map(server => (
                <div
                    key={server.id}
                    className="p-3 bg-[#F3EDF7] dark:bg-[#1C1B1F] rounded-xl border border-transparent hover:border-[#6750A4]/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            {server.enabled ? (
                                <Wifi size={12} className="text-green-500" />
                            ) : (
                                <WifiOff size={12} className="text-gray-400" />
                            )}
                            <span className="text-xs font-semibold dark:text-[#E6E1E5]">{server.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* 启用/禁用开关 */}
                            <button
                                onClick={() => handleToggleServer(server.id)}
                                className={`relative w-8 h-4 rounded-full transition-colors ${server.enabled ? 'bg-[#6750A4]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${server.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                            {/* 刷新工具 */}
                            <button
                                onClick={() => handleConnectAndFetchTools(server)}
                                disabled={connectingId === server.id}
                                className="p-1 hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors"
                                title="重新获取工具"
                            >
                                <RefreshCw size={12} className={connectingId === server.id ? 'animate-spin' : ''} />
                            </button>
                            {/* 展开/折叠 */}
                            <button
                                onClick={() => setExpandedId(expandedId === server.id ? null : server.id)}
                                className="p-1 hover:bg-white/50 dark:hover:bg-white/10 rounded-md transition-colors"
                            >
                                {expandedId === server.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </button>
                            {/* 删除 */}
                            <button
                                onClick={() => { if (confirm('确定移除此服务器？')) handleRemoveServer(server.id) }}
                                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-red-500 transition-colors"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>

                    <div className="text-[10px] text-[#49454F] dark:text-[#CAC4D0] break-all">{server.url}</div>

                    {/* 展开详情 - 显示工具列表 */}
                    {expandedId === server.id && (
                        <div className="mt-2 pt-2 border-t border-[#E7E0EC] dark:border-[#49454F]">
                            {server.tools && server.tools.length > 0 ? (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-[#6750A4] dark:text-[#D0BCFF] mb-1">
                                        可用工具 ({server.tools.length})
                                    </p>
                                    {server.tools.map(tool => (
                                        <div key={tool.name} className="px-2 py-1 bg-white dark:bg-[#2B2930] rounded-md">
                                            <span className="text-[10px] font-mono font-medium text-[#6750A4] dark:text-[#D0BCFF]">{tool.name}</span>
                                            <p className="text-[9px] text-[#49454F] dark:text-[#CAC4D0] mt-0.5">{tool.description}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-[#49454F] dark:text-[#CAC4D0]">
                                    点击刷新按钮获取可用工具
                                </p>
                            )}
                            {server.lastConnected && (
                                <p className="text-[9px] text-[#79747E] mt-1">
                                    上次连接: {new Date(server.lastConnected).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
