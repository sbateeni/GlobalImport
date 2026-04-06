import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Hash, Info, CheckCircle, AlertTriangle, RefreshCw, Copy, ExternalLink, ShieldCheck, Globe, DollarSign } from 'lucide-react';
import { findHSCode, HSCodeResult } from '../services/gemini';

interface HSCodeFinderProps {
  language: string;
}

export const HSCodeFinder: React.FC<HSCodeFinderProps> = ({ language }) => {
  const [product, setProduct] = useState('');
  const [country, setCountry] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<HSCodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isRtl = language === 'Arabic';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim() || !country.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const data = await findHSCode(product, country, language);
      setResult(data);
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setError(isRtl 
          ? 'عذراً، لقد تجاوزت حصة الاستخدام اليومية. يرجى المحاولة لاحقاً.' 
          : 'Quota exceeded. Please try again later.');
      } else {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const t = {
    title: isRtl ? 'مكتشف رمز النظام المنسق (HS Code)' : 'HS Code Finder',
    subtitle: isRtl ? 'ابحث عن الرمز الجمركي الدقيق لمنتجك لتحديد الرسوم والضرائب.' : 'Find the exact customs code for your product to determine duties and taxes.',
    productPlaceholder: isRtl ? 'اسم المنتج (مثلاً: سماعات بلوتوث)' : 'Product name (e.g., Bluetooth Headphones)',
    countryPlaceholder: isRtl ? 'دولة الاستيراد' : 'Import Country',
    searchBtn: isRtl ? 'بحث عن الرمز' : 'Find Code',
    searching: isRtl ? 'جاري البحث...' : 'Searching...',
    resultTitle: isRtl ? 'نتيجة التصنيف' : 'Classification Result',
    hscode: isRtl ? 'رمز النظام المنسق' : 'HS Code',
    description: isRtl ? 'الوصف الرسمي' : 'Official Description',
    dutyRate: isRtl ? 'معدل الرسوم التقديري' : 'Estimated Duty Rate',
    confidence: isRtl ? 'مستوى الثقة' : 'Confidence Level',
    notes: isRtl ? 'ملاحظات هامة' : 'Important Notes',
    copy: isRtl ? 'نسخ الرمز' : 'Copy Code',
    copied: isRtl ? 'تم النسخ!' : 'Copied!',
    disclaimer: isRtl 
      ? 'هذه النتائج استرشادية فقط. يرجى دائماً التحقق من المخلص الجمركي الرسمي.' 
      : 'These results are for guidance only. Always verify with an official customs broker.'
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
          <Hash className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder={t.productPlaceholder}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all`}
              required
            />
          </div>
          <div className="relative">
            <Globe className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t.countryPlaceholder}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all`}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSearching ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              {t.searching}
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              {t.searchBtn}
            </>
          )}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden"
          >
            <div className="bg-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-indigo-100 text-sm font-medium uppercase tracking-wider">{t.resultTitle}</span>
                <div className="flex items-center gap-2 bg-indigo-500/30 px-3 py-1 rounded-full text-xs">
                  <ShieldCheck className="w-3 h-3" />
                  {t.confidence}: {result.confidence}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black tracking-tight">{result.hscode}</h2>
                <button 
                  onClick={() => copyToClipboard(result.hscode)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.description}</label>
                  <p className="text-gray-900 font-medium leading-relaxed">{result.description}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.dutyRate}</label>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
                    <DollarSign className="w-5 h-5" />
                    {result.dutyRate}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-1">{t.notes}</h4>
                    <p className="text-sm text-amber-800 leading-relaxed">{result.notes}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-400 italic">{t.disclaimer}</p>
                <a 
                  href={`https://www.google.com/search?q=HS+Code+${result.hscode}+${country}+customs+duty`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
                >
                  {isRtl ? 'تحقق من المصدر' : 'Verify Source'}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
