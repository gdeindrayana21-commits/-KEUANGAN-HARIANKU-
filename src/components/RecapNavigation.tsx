import React from 'react';
import { Calendar, CalendarRange, CalendarDays, CalendarCheck } from 'lucide-react';
import { TabType } from './Sidebar';

interface RecapNavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const RecapNavigation: React.FC<RecapNavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'daily_recap' as TabType, label: 'Harian', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'weekly_recap' as TabType, label: 'Mingguan', icon: <CalendarRange className="w-3.5 h-3.5" /> },
    { id: 'monthly_recap' as TabType, label: 'Bulanan', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: 'yearly_recap' as TabType, label: 'Tahunan', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center space-x-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`recap-subnav-${tab.id}`}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
