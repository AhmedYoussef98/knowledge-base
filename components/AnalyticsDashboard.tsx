import React from 'react';
import { AnalyticsData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X } from 'lucide-react';

interface Props {
  data: AnalyticsData;
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
}

export const AnalyticsDashboard: React.FC<Props> = ({ data, isOpen, onClose, t }) => {
  if (!isOpen) return null;

  const barData = data.topKeywords.map(([name, value]) => ({ name, value }));
  const questionData = data.topQuestions.map(([name, value]) => ({ name, value }));

  return (
    <div className="fixed inset-0 bg-squad-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border-t-8 border-squad-primary">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-squad-primary">{t('analyticsTitle')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Top Keywords Chart */}
          <div className="bg-squad-bg/30 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-6 text-squad-primary border-b border-gray-200 pb-2">{t('topKeywords')}</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12, fill: '#281362'}} />
                  <Tooltip 
                    cursor={{fill: '#F4F3FF'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FE6A11' : '#A08FF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Questions List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-squad-primary border-b border-gray-200 pb-2">{t('topQuestions')}</h3>
            <div className="space-y-3">
              {questionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow group">
                  <span className="font-medium text-gray-700 group-hover:text-squad-primary transition-colors">
                    <span className="text-squad-orange font-bold ltr:mr-2 rtl:ml-2">{idx + 1}.</span> 
                    {item.name}
                  </span>
                  <span className="bg-squad-palePurple text-squad-primary px-3 py-1 rounded-full text-sm font-bold">
                    {item.value} {t('views')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};