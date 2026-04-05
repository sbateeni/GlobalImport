import React from 'react';
import { Package, Globe, Search, Ship } from 'lucide-react';

interface SearchFormProps {
  productName: string;
  onProductNameChange: (val: string) => void;
  country: string;
  onCountryChange: (val: string) => void;
  onAnalyze: (e: React.FormEvent) => void;
  isAnalyzing: boolean;
  t: any;
  isRtl: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  productName, onProductNameChange, country, onCountryChange, onAnalyze, isAnalyzing, t, isRtl
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-10 max-w-4xl mx-auto mb-12 sm:mb-16 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400"></div>
      <form onSubmit={onAnalyze} className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
        <div className="md:col-span-5 relative">
          <label htmlFor="product" className="block text-sm font-bold text-slate-700 mb-2">{t.productLabel}</label>
          <div className="relative">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
              <Package className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              id="product"
              className={`block w-full ${isRtl ? 'pr-10 sm:pr-12 pl-4' : 'pl-10 sm:pl-12 pr-4'} py-3.5 sm:py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white outline-none font-medium text-sm sm:text-base`}
              placeholder={isRtl ? 'مثلاً: سماعات لاسلكية، ألواح شمسية' : 'e.g., Wireless Earbuds, Solar Panels'}
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
              required
            />
          </div>
        </div>
        
        <div className="md:col-span-4 relative">
          <label htmlFor="country" className="block text-sm font-bold text-slate-700 mb-2">{t.countryLabel}</label>
          <div className="relative">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
              <Globe className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              id="country"
              className={`block w-full ${isRtl ? 'pr-10 sm:pr-12 pl-4' : 'pl-10 sm:pl-12 pr-4'} py-3.5 sm:py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white outline-none font-medium text-sm sm:text-base`}
              placeholder={isRtl ? 'دولة الوجهة' : 'Destination Country'}
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="md:col-span-3 flex items-end">
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:bg-blue-600 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-100"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{t.analyzingBtn}</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>{t.analyzeBtn}</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-10 pt-10 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4 text-slate-400">
          <Ship className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{isRtl ? 'تتبع سريع للحاويات (AIS)' : 'Quick Container Tracking (AIS)'}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder={isRtl ? 'أدخل رقم الحاوية (مثلاً: MEDU7626508)' : 'Enter container number (e.g., MEDU7626508)'}
            className="flex-1 p-3.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                // This will be handled by the parent component or we can just redirect
                const val = (e.currentTarget as HTMLInputElement).value;
                if (val) window.dispatchEvent(new CustomEvent('quick-track', { detail: val }));
              }
            }}
          />
          <button 
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value) window.dispatchEvent(new CustomEvent('quick-track', { detail: input.value }));
            }}
            className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            {isRtl ? 'تتبع الآن' : 'Track Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
