import React from 'react';
import { Ship, Search, FileText, ShieldCheck, Truck, Languages, MapPin, Settings as SettingsIcon } from 'lucide-react';
import { AppView, Language } from '../types';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  savedCount: number;
  language: string;
  onLanguageChange: (lang: string) => void;
  languages: Language[];
  t: any;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, onViewChange, savedCount, language, onLanguageChange, languages, t 
}) => {
  const isRtl = languages.find(l => l.code === language)?.dir === 'rtl';
  const isAr = language === 'Arabic';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 text-blue-600 cursor-pointer"
          onClick={() => onViewChange('search')}
        >
          <Ship className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-slate-900">Global<span className="text-blue-600">Import</span></span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavButton 
            active={currentView === 'search'} 
            onClick={() => onViewChange('search')}
            icon={<Search className="w-4 h-4" />}
            label={t.analyzeBtn}
          />
          <NavButton 
            active={currentView === 'saved'} 
            onClick={() => onViewChange('saved')}
            icon={<FileText className="w-4 h-4" />}
            label={t.savedBtn}
            badge={savedCount > 0 ? savedCount : undefined}
          />
          <NavButton 
            active={currentView === 'constants'} 
            onClick={() => onViewChange('constants')}
            icon={<ShieldCheck className="w-4 h-4" />}
            label={t.constantsBtn}
          />
          <NavButton 
            active={currentView === 'calculator'} 
            onClick={() => onViewChange('calculator')}
            icon={<Truck className="w-4 h-4" />}
            label={t.calculatorBtn}
          />
          <NavButton 
            active={currentView === 'tracking'} 
            onClick={() => onViewChange('tracking')}
            icon={<MapPin className="w-4 h-4" />}
            label={t.trackingBtn}
          />
          <NavButton 
            active={currentView === 'settings'} 
            onClick={() => onViewChange('settings')}
            icon={<SettingsIcon className="w-4 h-4" />}
            label={isAr ? 'الضبط' : 'Settings'}
          />
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onViewChange('settings')}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title={isAr ? 'إعدادات API' : 'API Settings'}
          >
            <ShieldCheck className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <Languages className="w-4 h-4 text-slate-500 ml-1 mr-1" />
            <select 
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around h-16 px-2 z-50">
        <MobileNavButton 
          active={currentView === 'search'} 
          onClick={() => onViewChange('search')}
          icon={<Search className="w-5 h-5" />}
          label={t.analyzeBtn}
        />
        <MobileNavButton 
          active={currentView === 'saved'} 
          onClick={() => onViewChange('saved')}
          icon={<FileText className="w-5 h-5" />}
          label={t.savedBtn}
          badge={savedCount > 0 ? savedCount : undefined}
        />
        <MobileNavButton 
          active={currentView === 'constants'} 
          onClick={() => onViewChange('constants')}
          icon={<ShieldCheck className="w-5 h-5" />}
          label={t.constantsBtn}
        />
        <MobileNavButton 
          active={currentView === 'calculator'} 
          onClick={() => onViewChange('calculator')}
          icon={<Truck className="w-5 h-5" />}
          label={t.calculatorBtn}
        />
        <MobileNavButton 
          active={currentView === 'tracking'} 
          onClick={() => onViewChange('tracking')}
          icon={<MapPin className="w-5 h-5" />}
          label={t.trackingBtn}
        />
        <MobileNavButton 
          active={currentView === 'settings'} 
          onClick={() => onViewChange('settings')}
          icon={<SettingsIcon className="w-5 h-5" />}
          label={isAr ? 'الضبط' : 'Settings'}
        />
      </nav>
    </header>
  );
};

interface MobileNavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const MobileNavButton: React.FC<MobileNavButtonProps> = ({ active, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all ${
      active ? 'text-blue-600' : 'text-slate-400'
    }`}
  >
    <div className="relative">
      {icon}
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-bold truncate max-w-full px-1">{label}</span>
  </button>
);

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, badge }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
      active 
        ? 'bg-blue-50 text-blue-600' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    {label}
    {badge !== undefined && (
      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{badge}</span>
    )}
  </button>
);
