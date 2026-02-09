import React, { useMemo, useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
} from 'recharts';
import { useAppContext, useSettings } from '../../stores/AppContext';
import { useTranslation } from '../../utils/i18n';
import { sendToActiveTab } from '../../utils/messaging';
import { ReadingStats, ComplexityStats, ComplexityMetrics } from '../../types';

export const ReadingDashboard: React.FC = () => {
    const { state } = useAppContext();
    const { settings } = useSettings();
    const t = useTranslation(settings.language);
    const readingStats = state.readingStats;
    const [currentMetrics, setCurrentMetrics] = useState<ComplexityMetrics | null>(null);

    // Fetch complexity stats from active tab
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const stats = await sendToActiveTab('GET_PAGE_STATS', undefined);
                if (stats) {
                    setCurrentMetrics(stats);
                }
            } catch (err) {
                console.log('Failed to fetch page stats:', err);
            }
        };

        fetchStats();
        // Optional: Polling or listening for tab updates could be added here
    }, []);

    // Process reading stats for charts
    const weeklyData = useMemo(() => {
        // Get last 7 days including today
        const last7Days: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        return last7Days.map(dateStr => {
            const stat = readingStats.find(s => s.date === dateStr);
            const dateObj = new Date(dateStr);
            // Format: Mon, Tue, etc.
            const name = dateObj.toLocaleDateString(settings.language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short' });
            return {
                name,
                minutes: stat ? stat.minutes : 0,
                articles: stat ? stat.articles : 0
            };
        });
    }, [readingStats, settings.language]);

    // Format complexity data labels
    const complexityData = useMemo(() => {
        const metrics = currentMetrics || { vocabulary: 0, sentence: 0, density: 0, abstract: 0 };
        return [
            { subject: 'vocabulary', A: metrics.vocabulary, fullMark: 100 },
            { subject: 'sentence', A: metrics.sentence, fullMark: 100 },
            { subject: 'density', A: metrics.density, fullMark: 100 },
            { subject: 'abstract', A: metrics.abstract, fullMark: 100 },
            // Structure/Sentiment not implemented yet, using placeholders or derived
            { subject: 'structure', A: (metrics.sentence + metrics.density) / 2, fullMark: 100 },
            { subject: 'sentiment', A: 50, fullMark: 100 },
        ].map(item => ({
            ...item,
            subject: t.keywords[item.subject as keyof typeof t.keywords] || item.subject
        }));
    }, [t, currentMetrics]);

    const isDark = settings.theme === 'dark';
    const textColor = isDark ? '#E6E1E5' : '#1D1B20';
    const subTextColor = isDark ? '#CAC4D0' : '#49454F';
    const gridColor = isDark ? '#49454F' : '#E0E0E0';
    const primaryColor = isDark ? '#D0BCFF' : '#6750A4';
    const backgroundColor = isDark ? '#2B2930' : '#FFFFFF';
    const tooltipStyle = {
        borderRadius: '8px',
        border: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        backgroundColor: isDark ? '#36343B' : '#FFFFFF',
        color: textColor
    };

    return (
        <div className="space-y-6 p-2 pb-6">
            <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl shadow-sm border ${isDark ? 'bg-[#141218] border-[#49454F]' : 'bg-white border-[#E0E0E0]'}`}>
                    <div className="text-[10px] text-gray-500 mb-1">{t.totalWords}</div>
                    <div className="text-lg font-bold" style={{ color: primaryColor }}>
                        {currentMetrics?.wordCount || 0}
                    </div>
                </div>
                <div className={`p-3 rounded-xl shadow-sm border ${isDark ? 'bg-[#141218] border-[#49454F]' : 'bg-white border-[#E0E0E0]'}`}>
                    <div className="text-[10px] text-gray-500 mb-1">{t.avgSpeed}</div>
                    <div className="text-lg font-bold" style={{ color: primaryColor }}>
                        {currentMetrics?.wpm || 0}
                        <span className="text-[8px] ml-1 font-normal opacity-70">{t.wpm}</span>
                    </div>
                </div>
                <div className={`p-3 rounded-xl shadow-sm border ${isDark ? 'bg-[#141218] border-[#49454F]' : 'bg-white border-[#E0E0E0]'}`}>
                    <div className="text-[10px] text-gray-500 mb-1">{t.estCost}</div>
                    <div className="text-lg font-bold" style={{ color: primaryColor }}>
                        ${((currentMetrics?.wordCount || 0) / 750 * 0.002).toFixed(4)}
                    </div>
                </div>
            </div>

            <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDark ? 'bg-[#141218] border-[#49454F]' : 'bg-white border-[#E0E0E0]'}`}>
                <h3 className={`text-sm font-semibold mb-4 transition-colors`} style={{ color: textColor }}>{t.readingTime}</h3>
                <div style={{ width: '100%', height: 200, minHeight: 200 }}>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                            <Tooltip cursor={{ fill: isDark ? '#49454F' : '#F3EDF7' }} contentStyle={tooltipStyle} />
                            <Bar dataKey="minutes" fill={primaryColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDark ? 'bg-[#141218] border-[#49454F]' : 'bg-white border-[#E0E0E0]'}`}>
                    <h3 className="text-sm font-semibold mb-2 transition-colors" style={{ color: textColor }}>{t.contentComplexity}</h3>
                    <div style={{ width: '100%', height: 200, minHeight: 200 }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={complexityData}>
                                <PolarGrid stroke={gridColor} />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: subTextColor }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                <Radar name="Current Article" dataKey="A" stroke={primaryColor} fill={primaryColor} fillOpacity={0.3} />
                                <Tooltip contentStyle={tooltipStyle} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={`p-4 rounded-xl shadow-sm border transition-colors ${isDark ? 'bg-[#141218] border-[#49454F]' : 'bg-white border-[#E0E0E0]'}`}>
                    <h3 className="text-sm font-semibold mb-4 transition-colors" style={{ color: textColor }}>{t.readingHistory}</h3>
                    <div style={{ width: '100%', height: 160, minHeight: 160 }}>
                        <ResponsiveContainer width="100%" height={160}>
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: subTextColor }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line type="monotone" dataKey="articles" stroke={primaryColor} strokeWidth={2} dot={{ fill: primaryColor, r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
