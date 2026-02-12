import React, { useState } from 'react'
import { useSettings, useMessages, useHistory, useReadingStats, useApp } from '../../stores/AppContext'
import type { ExportData } from '../../types'
import { Database, Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '../../components/Toast'

const EXPORT_VERSION = '1.0.0'

export const DataManager: React.FC = () => {
    const { settings } = useSettings()
    const { messages } = useMessages()
    const { history, clearHistory } = useHistory()
    const { readingStats } = useReadingStats()
    const { dispatch } = useApp()
    const { showToast } = useToast()
    const [isImporting, setIsImporting] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    // 导出数据
    const handleExport = () => {
        try {
            const exportData: ExportData = {
                version: EXPORT_VERSION,
                exportedAt: new Date().toISOString(),
                settings: {
                    ...settings,
                    apiKey: '***HIDDEN***' // 不导出 API Key
                },
                chatHistory: messages,
                readingHistory: history,
                readingStats: readingStats || []
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `ai-reading-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            showToast('数据导出成功', 'success')
        } catch (error) {
            showToast('导出失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
        }
    }

    // 导入数据
    const handleImport = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            setIsImporting(true)
            try {
                const text = await file.text()
                const data: ExportData = JSON.parse(text)

                // 验证格式
                if (!data.version || !data.exportedAt) {
                    throw new Error('无效的备份文件格式')
                }

                // 恢复聊天记录
                if (data.chatHistory && data.chatHistory.length > 0) {
                    dispatch({ type: 'LOAD_MESSAGES', payload: data.chatHistory })
                }

                // 恢复阅读历史
                if (data.readingHistory && data.readingHistory.length > 0) {
                    dispatch({ type: 'LOAD_HISTORY', payload: data.readingHistory })
                }

                // 恢复设置（排除 apiKey）
                if (data.settings) {
                    const { apiKey, ...safeSettings } = data.settings as any
                    dispatch({ type: 'UPDATE_SETTINGS', payload: safeSettings })
                }

                showToast(`数据导入成功 (${data.chatHistory?.length || 0} 条消息)`, 'success')
            } catch (error) {
                showToast('导入失败: ' + (error instanceof Error ? error.message : '文件格式错误'), 'error')
            } finally {
                setIsImporting(false)
            }
        }
        input.click()
    }

    // 清除所有数据
    const handleClearAll = async () => {
        try {
            dispatch({ type: 'LOAD_MESSAGES', payload: [] as any })
            clearHistory()
            await chrome.storage.local.clear()
            setShowClearConfirm(false)
            showToast('所有数据已清除', 'success')
        } catch (error) {
            showToast('清除失败', 'error')
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-[#D0BCFF] dark:bg-[#4F378B] rounded-lg text-[#21005D] dark:text-[#EADDFF]">
                    <Database size={16} />
                </div>
                <h4 className="text-xs font-semibold dark:text-[#E6E1E5]">数据管理</h4>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-[#F3EDF7] dark:bg-[#1C1B1F] rounded-lg">
                    <div className="text-sm font-bold text-[#6750A4] dark:text-[#D0BCFF]">{messages.length}</div>
                    <div className="text-[9px] text-[#49454F] dark:text-[#CAC4D0]">聊天消息</div>
                </div>
                <div className="p-2 bg-[#F3EDF7] dark:bg-[#1C1B1F] rounded-lg">
                    <div className="text-sm font-bold text-[#6750A4] dark:text-[#D0BCFF]">{history.length}</div>
                    <div className="text-[9px] text-[#49454F] dark:text-[#CAC4D0]">阅读历史</div>
                </div>
                <div className="p-2 bg-[#F3EDF7] dark:bg-[#1C1B1F] rounded-lg">
                    <div className="text-sm font-bold text-[#6750A4] dark:text-[#D0BCFF]">{readingStats?.length || 0}</div>
                    <div className="text-[9px] text-[#49454F] dark:text-[#CAC4D0]">阅读统计</div>
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
                <button
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#6750A4] text-white rounded-xl text-xs font-medium hover:bg-[#5235a0] transition-colors"
                >
                    <Download size={14} />
                    导出数据
                </button>
                <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-[#6750A4] text-[#6750A4] rounded-xl text-xs font-medium hover:bg-[#EADDFF] transition-colors"
                >
                    <Upload size={14} />
                    {isImporting ? '导入中...' : '导入数据'}
                </button>
            </div>

            {/* 危险操作 */}
            <div className="pt-2 border-t border-[#E7E0EC] dark:border-[#49454F]">
                {showClearConfirm ? (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-medium">此操作不可恢复！建议先导出备份。</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleClearAll} className="flex-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">
                                确认清除
                            </button>
                            <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-lg hover:bg-red-50">
                                取消
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowClearConfirm(true)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Trash2 size={12} />
                        清除所有数据
                    </button>
                )}
            </div>
        </div>
    )
}
