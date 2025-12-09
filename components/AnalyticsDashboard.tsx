import React from 'react';
import { AnalyticsData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, TrendingUp, Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  data: AnalyticsData;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({ data, isOpen, onClose }) => {
  const { language, isRTL } = useLanguage();
  const { t } = useTranslation();

  if (!isOpen) return null;

  const barData = data.topKeywords.map(([name, value]) => ({ name, value }));
  const questionData = data.topQuestions.map(([name, value]) => ({ name, value }));

  // Daleel chart colors
  const chartColors = ['#A3FF47', '#00C2CB', '#4ADE80', '#A3FF47', '#00C2CB'];

  return (
    <div className="fixed inset-0 bg-daleel-deep-space/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-daleel-tech-slate rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-daleel-cyan/30 glow-cyan">

        {/* Header */}
        <div className="p-6 border-b border-daleel-cyan/20 flex justify-between items-center sticky top-0 bg-daleel-tech-slate z-10">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-daleel-neon/20 rounded-xl flex items-center justify-center border border-daleel-neon/30">
              <TrendingUp className="w-5 h-5 text-daleel-neon" />
            </div>
            <h2 className="text-2xl font-bold text-daleel-pure-light" style={{ fontFamily: 'Space Grotesk, Tajawal, sans-serif' }}>
              {t('analytics.title')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-daleel-deep-space/50 rounded-full transition-colors">
            <X className="text-daleel-pure-light/70 hover:text-daleel-neon" />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Top Keywords Chart */}
          <div className="bg-daleel-deep-space/50 p-6 rounded-xl border border-daleel-cyan/30">
            <h3 className={`text-lg font-semibold mb-6 text-daleel-neon border-b border-daleel-cyan/20 pb-2 ${isRTL ? 'text-right' : ''}`}>
              {t('analytics.topKeywords')}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 5, right: isRTL ? 40 : 30, left: isRTL ? 30 : 40, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12, fill: '#F8FAFF' }}
                    orientation={isRTL ? 'right' : 'left'}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 194, 203, 0.1)' }}
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 194, 203, 0.3)',
                      boxShadow: '0 4px 12px rgba(163, 255, 71, 0.2)',
                      color: '#F8FAFF'
                    }}
                    labelStyle={{ color: '#00C2CB', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={isRTL ? [4, 0, 0, 4] : [0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Questions List */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 text-daleel-cyan border-b border-daleel-cyan/20 pb-2 ${isRTL ? 'text-right' : ''}`}>
              {t('analytics.topQuestions')}
            </h3>
            <div className="space-y-3">
              {questionData.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-4 bg-daleel-deep-space/50 border border-daleel-cyan/30 rounded-xl hover:border-daleel-neon/50 hover:shadow-lg transition-all group ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <span className={`font-medium text-daleel-pure-light/90 group-hover:text-daleel-neon transition-colors flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <span className="bg-daleel-neon/20 text-daleel-neon px-2 py-1 rounded-lg text-sm font-bold border border-daleel-neon/30">
                      {idx + 1}
                    </span>
                    {item.name}
                  </span>
                  <div className={`flex items-center gap-2 bg-daleel-cyan/20 text-daleel-cyan px-3 py-1.5 rounded-full text-sm font-bold border border-daleel-cyan/30 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Eye className="w-4 h-4" />
                    <span>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
