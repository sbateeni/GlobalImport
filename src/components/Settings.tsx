import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Key, Save, Trash2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  language: string;
  isRtl: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ language, isRtl }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const isAr = language === 'Arabic';

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('user_gemini_api_key', apiKey.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      // Trigger a refresh of the AI instance if needed (though getAI() handles it now)
      window.location.reload(); // Simplest way to ensure all services use the new key
    }
  };

  const handleDelete = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
    window.location.reload();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className={isRtl ? 'text-right' : 'text-left'}>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {isAr ? 'إعدادات النظام' : 'System Settings'}
        </h2>
        <p className="text-slate-500">
          {isAr ? 'تخصيص تجربة الاستخدام وإدارة مفاتيح الوصول الخاصة بك.' : 'Customize your experience and manage your access keys.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Key className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">
            {isAr ? 'مفتاح Gemini API الخاص بك' : 'Your Gemini API Key'}
          </h3>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 leading-relaxed">
              {isAr 
                ? 'استخدام مفتاح API الخاص بك يضمن لك حصة استخدام مستقلة وتجنب قيود الاستخدام المشترك. يتم تخزين المفتاح محلياً في متصفحك فقط.' 
                : 'Using your own API key ensures an independent usage quota and avoids shared usage limits. The key is stored locally in your browser only.'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              {isAr ? 'مفتاح API' : 'API Key'}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`block w-full px-4 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm bg-slate-50 ${isRtl ? 'text-right' : 'text-left'}`}
                placeholder="AIzaSy..."
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className={`absolute inset-y-0 ${isRtl ? 'left-4' : 'right-4'} flex items-center text-slate-400 hover:text-slate-600`}
              >
                {showKey ? <Trash2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-slate-900 text-white py-4 px-8 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
            >
              {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {isAr ? 'حفظ الإعدادات' : 'Save Settings'}
            </button>
            {localStorage.getItem('user_gemini_api_key') && (
              <button
                onClick={handleDelete}
                className="bg-red-50 text-red-600 py-4 px-8 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
              >
                <Trash2 className="w-5 h-5" />
                {isAr ? 'حذف المفتاح' : 'Delete Key'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold text-amber-900">{isAr ? 'كيف تحصل على مفتاح؟' : 'How to get a key?'}</h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            {isAr 
              ? 'يمكنك الحصول على مفتاح API مجاني من Google AI Studio (aistudio.google.com). تأكد من تفعيل الفوترة إذا كنت ترغب في استخدام النماذج المدفوعة أو زيادة الحصص.' 
              : 'You can get a free API key from Google AI Studio (aistudio.google.com). Make sure to enable billing if you want to use paid models or increase quotas.'}
          </p>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold text-amber-900 underline hover:text-amber-700"
          >
            {isAr ? 'انقر هنا للذهاب إلى Google AI Studio' : 'Click here to go to Google AI Studio'}
          </a>
        </div>
      </div>
    </motion.div>
  );
};
