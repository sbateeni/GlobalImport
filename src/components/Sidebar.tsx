import React, { useState } from 'react';
import { Ship, Search, FileText, ShieldCheck, Truck, Languages, MapPin, Hash, Coins, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { AppView, Language } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  savedCount: number;
  language: string;
  onLanguageChange: (lang: string) => void;
  languages: Language[];
  t: any;
  currency: string;
  onCurrencyChange: (currency: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onViewChange, savedCount, language, onLanguageChange, languages, t,
  currency, onCurrencyChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isRtl = languages.find(l => l.code === language)?.dir === 'rtl';
  const isAr = language === 'Arabic';

  const currencies = ['USD', 'EUR', 'SAR', 'AED', 'EGP', 'GBP', 'CNY', 'ILS'];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { id: 'search', icon: <Search className="w-5 h-5" />, label: t.analyzeBtn },
    { id: 'hscode', icon: <Hash className="w-5 h-5" />, label: isAr ? 'رمز HS' : 'HS Code' },
    { id: 'saved', icon: <FileText className="w-5 h-5" />, label: t.savedBtn, badge: savedCount > 0 ? savedCount : undefined },
    { id: 'constants', icon: <ShieldCheck className="w-5 h-5" />, label: t.constantsBtn },
    { id: 'calculator', icon: <Truck className="w-5 h-5" />, label: t.calculatorBtn },
    { id: 'tracking', icon: <MapPin className="w-5 h-5" />, label: t.trackingBtn },
    { id: 'settings', icon: <SettingsIcon className="w-5 h-5" />, label: isAr ? 'الضبط' : 'Settings' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-slate-200 w-64">
      <div className="p-6 border-b border-slate-100">
        <div 
          className="flex items-center gap-2 text-blue-600 cursor-pointer"
          onClick={() => {
            onViewChange('search');
            setIsOpen(false);
          }}
        >
          <Ship className="w-8 h-8" />
          <span className="font-bold text-2xl tracking-tight text-slate-900">Global<span className="text-blue-600">Import</span></span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavButton 
            key={item.id}
            active={currentView === item.id} 
            onClick={() => {
              onViewChange(item.id as AppView);
              setIsOpen(false);
            }}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase px-2">{isAr ? 'العملة' : 'Currency'}</label>
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
            <Coins className="w-4 h-4 text-slate-500" />
            <select 
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer w-full"
            >
              {currencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase px-2">{isAr ? 'اللغة' : 'Language'}</label>
          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl">
            <Languages className="w-4 h-4 text-slate-500" />
            <select 
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer w-full"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium pt-2">
          © 2026 GlobalImport AI
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} w-64 z-50`}>
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-50">
        <div 
          className="flex items-center gap-2 text-blue-600"
          onClick={() => onViewChange('search')}
        >
          <Ship className="w-6 h-6" />
          <span className="font-bold text-xl tracking-tight text-slate-900">Global<span className="text-blue-600">Import</span></span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            />
            <motion.aside 
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`lg:hidden fixed inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} border-slate-200 w-64 z-50 shadow-2xl`}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

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
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
    <span className="flex-1 text-start">{label}</span>
    {badge !== undefined && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);
