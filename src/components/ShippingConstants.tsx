import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, DollarSign, Clock, Anchor, Trash2, RefreshCw } from 'lucide-react';
import { ShippingRates } from '../services/gemini';

interface ShippingConstantsProps {
  constants: ShippingRates[];
  onFetchRates: (country: string) => void;
  onDelete: (country: string) => void;
  isFetching: boolean;
  countryInput: string;
  onCountryInputChange: (val: string) => void;
  t: any;
  isRtl: boolean;
}

export const ShippingConstants: React.FC<ShippingConstantsProps> = ({
  constants, onFetchRates, onDelete, isFetching, countryInput, onCountryInputChange, t, isRtl
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t.constantsBtn}</h2>
          <p className="text-slate-500 text-sm mt-1">تخزين وإدارة تكاليف الشحن التجاري الموثقة من الموانئ والجهات الرسمية لكل دولة.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full sm:w-48">
            <input 
              type="text" 
              placeholder={t.countryLabel}
              value={countryInput}
              onChange={(e) => onCountryInputChange(e.target.value)}
              className="pl-4 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
            />
          </div>
          <button 
            onClick={() => onFetchRates(countryInput)}
            disabled={isFetching || !countryInput.trim()}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
          >
            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t.fetchRatesBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {constants.map((rate, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{rate.country}</h3>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
                  <Clock className="w-3 h-3" />
                  {t.lastUpdatedLabel || 'Last Updated'}: {rate.lastUpdated}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onFetchRates(rate.country)}
                  disabled={isFetching}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                  title={t.fetchRatesBtn}
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => onDelete(rate.country)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{t.fcl20}</div>
                  <div className="text-sm font-bold text-slate-900">{rate.fcl20ft}</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">{t.fcl40}</div>
                  <div className="text-sm font-bold text-slate-900">{rate.fcl40ft}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.lcl}</div>
                  <div className="text-sm font-bold text-slate-900">{rate.lclPerCbm}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">VAT / Tax</div>
                  <div className="text-sm font-bold text-slate-900">{rate.vatRate ?? '0'}%</div>
                </div>
              </div>

              {(rate.warRiskSurcharge || rate.bafPercentage) && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">War Risk & BAF</div>
                  <div className="text-xs font-bold text-slate-900">
                    {rate.warRiskSurcharge || '0'} / {rate.bafPercentage || '0'}%
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t.transitTime}</div>
                    <div className="text-xs text-slate-700">{rate.estimatedTransitTime}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Anchor className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{t.ports}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rate.majorPorts.map((port, pidx) => (
                        <span key={pidx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{port}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {rate.costBreakdown && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t.costTitle}</div>
                  <div className="space-y-2">
                    {rate.costBreakdown.map((item, iidx) => (
                      <div key={iidx} className="flex justify-between text-[11px]">
                        <span className="text-slate-600">{item.item}</span>
                        <span className="font-bold text-slate-900">{item.estimatedCost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
