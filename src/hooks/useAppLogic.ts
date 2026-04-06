import React, { useState, useEffect } from 'react';
import { analyzeImport, chatFollowUp, fetchShippingRates, findHSCode, ImportAnalysis, ShippingRates, ContainerTrackingInfo, HSCodeResult } from '../services/gemini';
import { SavedResult, AppView } from '../types';

export function useAppLogic(language: string) {
  const [productName, setProductName] = useState('');
  const [country, setCountry] = useState('');
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
  const [hsCodeResult, setHsCodeResult] = useState<HSCodeResult | null>(null);
  const [isSearchingHS, setIsSearchingHS] = useState(false);

  useEffect(() => {
    localStorage.setItem('import_saved', JSON.stringify(savedResults));
  }, [savedResults]);

  useEffect(() => {
    localStorage.setItem('import_tracking', JSON.stringify(savedTracking));
  }, [savedTracking]);

  useEffect(() => {
    localStorage.setItem('import_constants', JSON.stringify(shippingConstants));
  }, [shippingConstants]);

  useEffect(() => {
    setError(null);
  }, [currentView]);

  const saveTrackingResult = (info: ContainerTrackingInfo) => {
    setSavedTracking(prev => {
      const filtered = prev.filter(t => t.containerNumber !== info.containerNumber);
      return [info, ...filtered];
    });
  };

  const deleteTrackingResult = (containerNumber: string) => {
    setSavedTracking(prev => prev.filter(t => t.containerNumber !== containerNumber));
  };

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
      if (err.message === 'QUOTA_EXCEEDED') {
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

    setError(null);
    const userMessage = { role: 'user' as const, text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
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
    setError(null);
    try {
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

  return {
    productName, setProductName,
    country, setCountry,
    isAnalyzing,
    analysis,
    savedResults,
    currentView, setCurrentView,
    error, setError,
    chatMessages,
    chatInput, setChatInput,
    isChatLoading,
    actualCostsInput, setActualCostsInput,
    shippingConstants,
    isFetchingRates,
    savedTracking,
    saveTrackingResult,
    deleteTrackingResult,
    handleAnalyze,
    saveResult,
    deleteSaved,
    loadSaved,
    handleChat,
    saveActualCosts,
    handleFetchRates,
    deleteConstant
  };
}
