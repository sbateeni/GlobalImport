import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Globe, Search, Ship, DollarSign, 
  CheckCircle, AlertTriangle, Info, ArrowRight, 
  MapPin, Box, Truck, ShieldCheck, FileText, Languages, Building2, Download, RefreshCw
} from 'lucide-react';
import { ImportAnalysis } from '../services/gemini';
import { CostDashboard } from './CostDashboard';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisResultProps {
  analysis: ImportAnalysis;
  t: any;
  isRtl: boolean;
  actualCostsInput: { item: string, cost: string }[];
  onActualCostChange: (idx: number, val: string) => void;
  onSaveActualCosts: () => void;
  chatMessages: { role: 'user' | 'model', text: string }[];
  chatInput: string;
  onChatInputChange: (val: string) => void;
  onChatSubmit: (e: React.FormEvent) => void;
  isChatLoading: boolean;
  onSaveResult: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis, t, isRtl, actualCostsInput, onActualCostChange, onSaveActualCosts,
  chatMessages, chatInput, onChatInputChange, onChatSubmit, isChatLoading, onSaveResult
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Import-Analysis-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-8"
    >
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-2xl shadow-lg shadow-blue-100">
            <Package className="w-6 h-6 sm:w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.summaryTitle}</h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">{analysis.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? (isRtl ? 'جاري التصدير...' : 'Exporting...') : (isRtl ? 'تصدير PDF' : 'Export PDF')}
          </button>
          <button 
            onClick={onSaveResult}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-100"
          >
            <FileText className="w-4 h-4" />
            {t.saveBtn}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 bg-white/50 p-2 rounded-3xl">
        {/* Cost Dashboard */}
        <CostDashboard data={analysis.costBreakdown} language={isRtl ? 'Arabic' : 'English'} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Sourcing & Logistics */}
          <div className="lg:col-span-8 space-y-8">
            {/* Sourcing Options */}
            <motion.section variants={itemVariants} className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                {t.sourcingTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.productOptions.map((option, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-blue-300 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{option.name}</h4>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        {option.estimatedPriceRange}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">{option.qualityNotes}</p>
                    
                    <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <h5 className="text-[10px] font-bold text-slate-400 mb-2 flex items-center gap-1 uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" />
                        {t.companyLabel}
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {option.companyDetails}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-slate-50">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t.sourceLabel} <span className="text-blue-600 ml-1">{option.source}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {t.ratingLabel} <span className="text-amber-500 ml-1">{option.supplierRating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Logistics Journey */}
            <motion.section variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-6 flex items-center gap-3">
                <Truck className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold text-white">{t.logisticsTitle}</h3>
              </div>
              <div className="p-8">
                <div className="relative space-y-8">
                  <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-slate-100" />
                  {analysis.stepByStepGuide.map((step, idx) => (
                    <div key={idx} className="relative flex gap-6 group">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center font-bold text-blue-600 z-10 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-50">
                        {step.step}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          </div>

          {/* Right Column: Shipping & Costs */}
          <div className="lg:col-span-4 space-y-8">
            {/* Shipping Summary */}
            <motion.section variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Ship className="w-5 h-5 text-blue-600" />
                  {t.shippingTitle} {analysis.shippingDetails.isAllowed ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-500" />}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.estCost}</div>
                    <div className="text-sm font-bold text-slate-900">{analysis.shippingDetails.estimatedCostRange}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t.estTime}</div>
                    <div className="text-sm font-bold text-slate-900">{analysis.shippingDetails.estimatedTime}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t.methods}</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.shippingDetails.methods.map((m, i) => (
                      <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Cost Breakdown & Actual Input */}
            <motion.section variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  {t.costTitle}
                </h3>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-slate-100">
                  {analysis.costBreakdown.map((item, idx) => {
                    const actual = actualCostsInput[idx]?.cost || '';
                    const estValue = parseFloat(item.estimatedCost.replace(/[^0-9.]/g, '')) || 0;
                    const actValue = parseFloat(actual.replace(/[^0-9.]/g, '')) || 0;
                    const diff = actValue - estValue;
                    
                    return (
                      <li key={idx} className="p-6 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-700">{item.item}</span>
                          <span className="text-sm font-extrabold text-slate-900">{item.estimatedCost}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                            <input 
                              type="text"
                              placeholder={t.actualLabel}
                              value={actual}
                              onChange={(e) => onActualCostChange(idx, e.target.value)}
                              className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          {actual && (
                            <div className={`text-xs font-extrabold px-2 py-1 rounded-lg ${diff > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={onSaveActualCosts}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t.saveActualBtn}
                  </button>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>

      {/* Chat Box */}
      <motion.section variants={itemVariants} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-6 flex items-center gap-3">
          <Languages className="w-6 h-6 text-blue-400" />
          <h3 className="text-lg font-bold text-white">{t.chatTitle}</h3>
        </div>
        <div className="h-80 overflow-y-auto p-8 space-y-6 bg-slate-50">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-3xl px-6 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-100' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none px-6 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={onChatSubmit} className="p-4 sm:p-6 border-t border-slate-100 bg-white flex gap-2 sm:gap-3">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => onChatInputChange(e.target.value)}
            placeholder={t.chatPlaceholder}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 sm:px-6 py-3 sm:py-3.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="bg-slate-900 hover:bg-blue-600 disabled:bg-slate-200 text-white px-4 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            <span className="hidden sm:inline">{t.sendBtn}</span>
          </button>
        </form>
      </motion.section>
    </motion.div>
  );
};
