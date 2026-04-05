import React from 'react';
import { motion } from 'motion/react';
import { Package, Globe, ArrowRight, AlertTriangle, FileText } from 'lucide-react';
import { SavedResult } from '../types';

interface SavedResultsProps {
  savedResults: SavedResult[];
  onLoad: (saved: SavedResult) => void;
  onDelete: (id: string) => void;
  t: any;
  isRtl: boolean;
}

export const SavedResults: React.FC<SavedResultsProps> = ({
  savedResults, onLoad, onDelete, t, isRtl
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-900">{t.savedBtn}</h2>
      </div>

      {savedResults.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{t.noSaved}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedResults.map((saved) => (
            <div key={saved.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between hover:border-blue-300 transition-all group shadow-sm">
              <div className="flex items-center gap-5">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">{saved.product}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> {saved.country} • {saved.date}
                  </p>
                  {saved.actualCosts && saved.actualCosts.some(c => c.cost) && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.actualLabel}:</div>
                      {(() => {
                        const estTotal = saved.analysis.costBreakdown.reduce((acc, curr) => acc + (parseFloat(curr.estimatedCost.replace(/[^0-9.]/g, '')) || 0), 0);
                        const actTotal = saved.actualCosts.reduce((acc, curr) => acc + (parseFloat(curr.cost.replace(/[^0-9.]/g, '')) || 0), 0);
                        const diff = actTotal - estTotal;
                        return (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">${actTotal.toFixed(2)}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
                <button 
                  onClick={() => onLoad(saved)}
                  className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  {t.analyzeBtn}
                </button>
                <button 
                  onClick={() => onDelete(saved.id)}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <AlertTriangle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
