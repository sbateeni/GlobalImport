import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { analyzeImport, ImportAnalysis, ShippingRates, ContainerTrackingInfo } from './services/geminiService';
import { SavedResult, AppView, Language } from './types';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { AnalysisResult } from './components/AnalysisResult';
import { SavedResults } from './components/SavedResults';
import { ShippingConstants } from './components/ShippingConstants';
import { ShippingCalculator } from './components/ShippingCalculator';
import { ContainerTracking } from './components/ContainerTracking';
import { Settings } from './components/Settings';

const LANGUAGES: Language[] = [
  { code: 'Arabic', label: 'العربية', dir: 'rtl' },
  { code: 'English', label: 'English', dir: 'ltr' },
  { code: 'French', label: 'Français', dir: 'ltr' },
  { code: 'Spanish', label: 'Español', dir: 'ltr' },
];

export default function App() {
  const [productName, setProductName] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState(() => localStorage.getItem('import_lang') || 'Arabic');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [savedResults, setSavedResults] = useState<SavedResult[]>(() => {
    const saved = localStorage.getItem('import_saved');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentView, setCurrentView] = useState<AppView>('search');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [actualCostsInput, setActualCostsInput] = useState<{ item: string, cost: string }[]>([]);
  const [shippingConstants, setShippingConstants] = useState<ShippingRates[]>(() => {
    const saved = localStorage.getItem('import_constants');
    return saved ? JSON.parse(saved) : [];
  });
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [savedTracking, setSavedTracking] = useState<ContainerTrackingInfo[]>(() => {
    const saved = localStorage.getItem('import_tracking');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('import_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('import_saved', JSON.stringify(savedResults));
  }, [savedResults]);

  useEffect(() => {
    localStorage.setItem('import_tracking', JSON.stringify(savedTracking));
  }, [savedTracking]);

  const saveTrackingResult = (info: ContainerTrackingInfo) => {
    setSavedTracking(prev => {
      const filtered = prev.filter(t => t.containerNumber !== info.containerNumber);
      return [info, ...filtered];
    });
  };

  const deleteTrackingResult = (containerNumber: string) => {
    setSavedTracking(prev => prev.filter(t => t.containerNumber !== containerNumber));
  };

  useEffect(() => {
    localStorage.setItem('import_constants', JSON.stringify(shippingConstants));
  }, [shippingConstants]);

  useEffect(() => {
    const handleQuickTrack = (e: any) => {
      setCurrentView('tracking');
      // We can't directly set the container code in ContainerTracking from here easily without lifting state,
      // but we can store it in localStorage or just let the user see the tracking page.
      // Actually, let's just use a simple state for the initial tracking code.
      localStorage.setItem('import_quick_track', e.detail);
    };
    window.addEventListener('quick-track', handleQuickTrack);
    return () => window.removeEventListener('quick-track', handleQuickTrack);
  }, []);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const isRtl = currentLang.dir === 'rtl';

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !country.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setChatMessages([]);
    setActualCostsInput([]);
    setCurrentView('search');

    try {
      const result = await analyzeImport(productName, country, language);
      setAnalysis(result);
      setActualCostsInput(result.costBreakdown.map(c => ({ item: c.item, cost: '' })));
    } catch (err: any) {
      const errStr = err instanceof Error ? err.message : String(err);
      if (err.message === 'QUOTA_EXCEEDED' || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
        setError(language === 'Arabic' 
          ? 'عذراً، لقد تجاوزت حصة الاستخدام اليومية للذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً أو غداً.' 
          : 'Sorry, you have exceeded the daily AI usage quota. Please try again later or tomorrow.');
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred while analyzing.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveResult = () => {
    if (!analysis) return;
    const newSave: SavedResult = {
      id: Date.now().toString(),
      product: productName,
      country: country,
      analysis: analysis,
      date: new Date().toLocaleDateString(language === 'Arabic' ? 'ar-EG' : 'en-US'),
      actualCosts: actualCostsInput.length > 0 ? actualCostsInput : analysis.costBreakdown.map(c => ({ item: c.item, cost: '' }))
    };
    setSavedResults([newSave, ...savedResults]);
  };

  const deleteSaved = (id: string) => {
    setSavedResults(savedResults.filter(s => s.id !== id));
  };

  const loadSaved = (saved: SavedResult) => {
    setAnalysis(saved.analysis);
    setProductName(saved.product);
    setCountry(saved.country);
    setActualCostsInput(saved.actualCosts || saved.analysis.costBreakdown.map(c => ({ item: c.item, cost: '' })));
    setChatMessages([]);
    setCurrentView('search');
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysis) return;

    const userMessage = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const { chatFollowUp } = await import('./services/geminiService');
      const response = await chatFollowUp(chatInput, chatMessages, analysis, language);
      setChatMessages(prev => [...prev, { role: 'model' as const, text: response }]);
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setError(language === 'Arabic' 
          ? 'عذراً، لقد تجاوزت حصة الاستخدام اليومية للدردشة. يرجى المحاولة مرة أخرى لاحقاً.' 
          : 'Sorry, you have exceeded the daily chat quota. Please try again later.');
      } else {
        setError('Chat failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const saveActualCosts = (id: string) => {
    setSavedResults(prev => prev.map(s => 
      s.id === id ? { ...s, actualCosts: actualCostsInput } : s
    ));
  };

  const normalizeStr = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[إأآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
  };

  const handleFetchRates = async (targetCountry: string) => {
    if (!targetCountry.trim()) return;
    setIsFetchingRates(true);
    try {
      const { fetchShippingRates } = await import('./services/geminiService');
      const rates = await fetchShippingRates(targetCountry, language);
      setShippingConstants(prev => {
        const normalizedTarget = normalizeStr(targetCountry);
        const filtered = prev.filter(p => normalizeStr(p.country) !== normalizedTarget);
        return [rates, ...filtered];
      });
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setError(language === 'Arabic' 
          ? 'عذراً، لقد تجاوزت حصة الاستخدام اليومية لتحديث الأسعار. يرجى المحاولة مرة أخرى لاحقاً.' 
          : 'Sorry, you have exceeded the daily quota for updating rates. Please try again later.');
      } else {
        setError('Failed to fetch rates: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    } finally {
      setIsFetchingRates(false);
    }
  };

  const deleteConstant = (countryName: string) => {
    setShippingConstants(shippingConstants.filter(c => normalizeStr(c.country) !== normalizeStr(countryName)));
  };

  const t = {
    title: language === 'Arabic' ? 'استورد من الصين بكل ثقة' : 'Import from China with Confidence',
    subtitle: language === 'Arabic' ? 'أدخل اسم المنتج ودولتك. سيقوم الذكاء الاصطناعي بتحليل أفضل الموردين، وتقدير التكاليف، والتحقق من اللوائح، ورسم خريطة للخدمات اللوجستية حتى باب منزلك.' : 'Enter a product and your country. Our AI will analyze the best suppliers, estimate costs, check regulations, and map out the logistics to your door.',
    productLabel: language === 'Arabic' ? 'ماذا تريد أن تستورد؟' : 'What do you want to import?',
    countryLabel: language === 'Arabic' ? 'دولة الوجهة' : 'Destination Country',
    langLabel: language === 'Arabic' ? 'لغة الرد' : 'Response Language',
    analyzeBtn: language === 'Arabic' ? 'تحليل' : 'Analyze',
    analyzingBtn: language === 'Arabic' ? 'جاري التحليل...' : 'Analyzing...',
    summaryTitle: language === 'Arabic' ? 'ملخص تنفيذي' : 'Executive Summary',
    sourcingTitle: language === 'Arabic' ? 'خيارات التوريد في الصين' : 'Sourcing Options in China',
    logisticsTitle: language === 'Arabic' ? 'رحلة الخدمات اللوجستية' : 'Logistics Journey',
    shippingTitle: language === 'Arabic' ? 'الشحن إلى' : 'Shipping to',
    costTitle: language === 'Arabic' ? 'تفصيل التكاليف' : 'Cost Breakdown',
    customsTitle: language === 'Arabic' ? 'الجمارك والضرائب' : 'Customs & Taxes',
    dutiesLabel: language === 'Arabic' ? 'الرسوم الجمركية' : 'Customs Duties',
    taxesLabel: language === 'Arabic' ? 'الضرائب (ضريبة القيمة المضافة)' : 'Taxes (VAT/GST)',
    regulationsLabel: language === 'Arabic' ? 'اللوائح والقيود' : 'Regulations & Restrictions',
    linksLabel: language === 'Arabic' ? 'روابط رسمية' : 'Official Resources',
    allowed: language === 'Arabic' ? 'الاستيراد مسموح' : 'Import Allowed',
    restricted: language === 'Arabic' ? 'الاستيراد مقيد' : 'Import Restricted',
    estCost: language === 'Arabic' ? 'التكلفة التقديرية' : 'Estimated Cost',
    estTime: language === 'Arabic' ? 'الوقت التقديري' : 'Estimated Time',
    methods: language === 'Arabic' ? 'الطرق المتاحة' : 'Available Methods',
    disclaimer: language === 'Arabic' ? 'إخلاء مسؤولية: هذه تقديرات تم إنشاؤها بواسطة الذكاء الاصطناعي بناءً على بيانات الويب الحالية. قد تختلف الأسعار الفعلية وأوقات الشحن واللوائح الجمركية. استشر دائماً مخلصاً جمركياً مرخصاً أو وكيل شحن قبل إجراء عمليات شراء كبيرة.' : 'Disclaimer: These are AI-generated estimates based on current web data. Actual prices, shipping times, and customs regulations may vary. Always consult with a licensed customs broker or freight forwarder before making large purchases.',
    sourceLabel: language === 'Arabic' ? 'المصدر:' : 'Source:',
    ratingLabel: language === 'Arabic' ? 'تقييم المورد:' : 'Supplier Rating:',
    companyLabel: language === 'Arabic' ? 'تفاصيل الشركة:' : 'Company Details:',
    saveBtn: language === 'Arabic' ? 'حفظ النتيجة' : 'Save Result',
    savedBtn: language === 'Arabic' ? 'النتائج المحفوظة' : 'Saved Results',
    noSaved: language === 'Arabic' ? 'لا توجد نتائج محفوظة بعد.' : 'No saved results yet.',
    backBtn: language === 'Arabic' ? 'العودة للبحث' : 'Back to Search',
    actualCostTitle: language === 'Arabic' ? 'التكاليف الفعلية والمقارنة' : 'Actual Costs & Comparison',
    inputActualBtn: language === 'Arabic' ? 'إدخال التكاليف الفعلية' : 'Input Actual Costs',
    saveActualBtn: language === 'Arabic' ? 'حفظ التكاليف' : 'Save Costs',
    estimatedLabel: language === 'Arabic' ? 'التقديري' : 'Estimated',
    actualLabel: language === 'Arabic' ? 'الفعلي' : 'Actual',
    diffLabel: language === 'Arabic' ? 'الفرق' : 'Difference',
    chatPlaceholder: language === 'Arabic' ? 'اسأل سؤالاً إضافياً...' : 'Ask a follow-up question...',
    chatTitle: language === 'Arabic' ? 'مساعد الاستيراد الذكي' : 'Smart Import Assistant',
    sendBtn: language === 'Arabic' ? 'إرسال' : 'Send',
    constantsBtn: language === 'Arabic' ? 'ثوابت الشحن' : 'Shipping Constants',
    calculatorBtn: language === 'Arabic' ? 'حاسبة الشحن التجاري' : 'Commercial Calculator',
    fetchRatesBtn: language === 'Arabic' ? 'تحديث الأسعار' : 'Update Rates',
    fcl20: language === 'Arabic' ? 'حاوية 20 قدم' : '20ft Container',
    fcl40: language === 'Arabic' ? 'حاوية 40 قدم' : '40ft Container',
    lcl: language === 'Arabic' ? 'شحن جزئي (CBM)' : 'LCL (per CBM)',
    transitTime: language === 'Arabic' ? 'مدة العبور' : 'Transit Time',
    ports: language === 'Arabic' ? 'الموانئ الرئيسية' : 'Major Ports',
    calcTitle: language === 'Arabic' ? 'حاسبة تكاليف الشحن التجاري' : 'Commercial Shipping Calculator',
    selectCountry: language === 'Arabic' ? 'اختر الدولة' : 'Select Country',
    containerType: language === 'Arabic' ? 'نوع الشحن' : 'Shipping Type',
    quantity: language === 'Arabic' ? 'الكمية (عدد الحاويات أو CBM)' : 'Quantity (Containers or CBM)',
    calculateBtn: language === 'Arabic' ? 'احسب التكلفة' : 'Calculate Cost',
    totalShipping: language === 'Arabic' ? 'إجمالي تكلفة الشحن التقديرية' : 'Total Estimated Shipping Cost',
    trackingBtn: language === 'Arabic' ? 'تتبع الحاوية' : 'Track Container',
    lastUpdatedLabel: language === 'Arabic' ? 'آخر تحديث' : 'Last Updated',
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
        savedCount={savedResults.length}
        language={language}
        onLanguageChange={setLanguage}
        languages={LANGUAGES}
        t={t}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32 md:pb-12">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 font-bold">×</button>
            </motion.div>
          )}

          {currentView === 'search' && (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {!analysis && (
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">{t.title}</h1>
                  <p className="text-lg text-slate-600">{t.subtitle}</p>
                </div>
              )}
              
              <SearchForm 
                productName={productName}
                onProductNameChange={setProductName}
                country={country}
                onCountryChange={setCountry}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                t={t}
                isRtl={isRtl}
              />

              {analysis && (
                <AnalysisResult 
                  analysis={analysis}
                  t={t}
                  isRtl={isRtl}
                  actualCostsInput={actualCostsInput}
                  onActualCostChange={(idx, val) => {
                    const newCosts = [...actualCostsInput];
                    newCosts[idx] = { ...newCosts[idx], cost: val };
                    setActualCostsInput(newCosts);
                  }}
                  onSaveActualCosts={() => {
                    const savedResult = savedResults.find(s => s.analysis === analysis);
                    if (savedResult) saveActualCosts(savedResult.id);
                    else saveResult();
                  }}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  onChatInputChange={setChatInput}
                  onChatSubmit={handleChat}
                  isChatLoading={isChatLoading}
                  onSaveResult={saveResult}
                />
              )}
            </motion.div>
          )}

          {currentView === 'saved' && (
            <SavedResults 
              key="saved"
              savedResults={savedResults}
              onLoad={loadSaved}
              onDelete={deleteSaved}
              t={t}
              isRtl={isRtl}
            />
          )}

          {currentView === 'constants' && (
            <ShippingConstants 
              key="constants"
              constants={shippingConstants}
              onFetchRates={handleFetchRates}
              onDelete={deleteConstant}
              isFetching={isFetchingRates}
              countryInput={country}
              onCountryInputChange={setCountry}
              t={t}
              isRtl={isRtl}
            />
          )}

          {currentView === 'calculator' && (
            <ShippingCalculator 
              key="calculator"
              constants={shippingConstants}
              t={t}
              isRtl={isRtl}
            />
          )}

          {currentView === 'tracking' && (
            <ContainerTracking 
              key="tracking"
              language={language}
              t={t}
              isRtl={isRtl}
              savedTracking={savedTracking}
              onSaveTracking={saveTrackingResult}
              onDeleteTracking={deleteTrackingResult}
            />
          )}

          {currentView === 'settings' && (
            <Settings 
              key="settings"
              language={language}
              isRtl={isRtl}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {t.disclaimer}
            </p>
          </div>
          <div className="mt-8 text-center text-slate-400 text-xs font-medium">
            © 2026 GlobalImport AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
