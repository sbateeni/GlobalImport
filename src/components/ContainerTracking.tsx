import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Ship, MapPin, Clock, ExternalLink, Calendar, RefreshCw, Anchor, Navigation, Info, Activity, TrendingUp, DollarSign, ShieldCheck, Trash2, History, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { trackContainer, ContainerTrackingInfo } from '../services/gemini';

// Fix for Leaflet default icon issue in Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map view when coordinates change
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface ContainerTrackingProps {
  language: string;
  t: any;
  isRtl: boolean;
  savedTracking: ContainerTrackingInfo[];
  onSaveTracking: (info: ContainerTrackingInfo) => void;
  onDeleteTracking: (containerNumber: string) => void;
}

export const ContainerTracking: React.FC<ContainerTrackingProps> = ({ language, t, isRtl, savedTracking, onSaveTracking, onDeleteTracking }) => {
  const [containerCode, setContainerCode] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<ContainerTrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [alertThreshold, setAlertThreshold] = useState<number>(24); // Default 24 hours
  const [isAlertEnabled, setIsAlertEnabled] = useState(false);

  const isAr = language === 'Arabic';

  // Check for alert condition
  const checkAlert = () => {
    if (!trackingInfo || !isAlertEnabled) return false;
    
    try {
      const etaDate = new Date(trackingInfo.estimatedArrival);
      const now = new Date();
      const diffMs = etaDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      return diffHours > 0 && diffHours <= alertThreshold;
    } catch (e) {
      return false;
    }
  };

  const isAlertTriggered = checkAlert();

  React.useEffect(() => {
    if (retryCountdown > 0) {
      const timer = setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCountdown]);

  React.useEffect(() => {
    if (isAlertTriggered) {
      console.log(`[ETA ALERT] Container ${trackingInfo?.containerNumber} is arriving within ${alertThreshold} hours! ETA: ${trackingInfo?.estimatedArrival}`);
    }
  }, [isAlertTriggered, trackingInfo, alertThreshold]);

  React.useEffect(() => {
    const quickTrack = localStorage.getItem('import_quick_track');
    if (quickTrack) {
      setContainerCode(quickTrack);
      handleTrack(undefined, quickTrack);
      localStorage.removeItem('import_quick_track');
    }
  }, []);

  const handleTrack = async (e?: React.FormEvent, codeToTrack?: string) => {
    if (e) e.preventDefault();
    const code = codeToTrack || containerCode;
    if (!code.trim()) return;

    if (retryCountdown > 0) {
      setError(language === 'Arabic' 
        ? `يرجى الانتظار ${retryCountdown} ثانية قبل المحاولة مرة أخرى.` 
        : `Please wait ${retryCountdown} seconds before trying again.`);
      return;
    }

    setIsTracking(true);
    setError(null);
    if (!codeToTrack) setTrackingInfo(null);

    try {
      const info = await trackContainer(code, language);
      setTrackingInfo(info);
      onSaveTracking(info); // Auto-save on successful track
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setRetryCountdown(30);
        setError(language === 'Arabic' 
          ? 'نظام التتبع العميق (AI) مشغول حالياً. تم تفعيل وضع التقدير التلقائي. يرجى الانتظار 30 ثانية للمحاولة مرة أخرى للحصول على بيانات حية.' 
          : 'The Deep Tracking AI is currently busy. Automatic estimation mode activated. Please wait 30 seconds to try again for live data.');
      } else {
        setError(language === 'Arabic' ? 'فشل تتبع الحاوية. يرجى التأكد من الكود والمحاولة مرة أخرى.' : 'Failed to track container. Please check the code and try again.');
      }
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {isAr ? 'تتبع الحاويات الذكي (AIS)' : 'Smart Container Tracking (AIS)'}
          </h2>
          <p className="text-slate-500">
            {isAr ? 'تتبع حي عبر الأقمار الصناعية وتحليل مسار الرحلة والظروف الجيوسياسية.' : 'Live satellite tracking, route analysis, and geopolitical condition monitoring.'}
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${showHistory ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <History className="w-5 h-5" />
          {isAr ? 'السجل المحفوظ' : 'Saved History'}
          {savedTracking.length > 0 && (
            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
              {savedTracking.length}
            </span>
          )}
        </button>
      </div>

      {showHistory && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {savedTracking.length === 0 ? (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center">
              <Ship className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">{isAr ? 'لا توجد حاويات محفوظة حالياً' : 'No saved containers yet'}</p>
            </div>
          ) : (
            savedTracking.map((saved) => (
              <div key={saved.containerNumber} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900">{saved.containerNumber}</h4>
                    <p className="text-xs text-slate-400">{saved.carrier}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleTrack(undefined, saved.containerNumber)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      title={isAr ? 'تحديث' : 'Refresh'}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteTracking(saved.containerNumber)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    <span className="truncate">{saved.lastLocation}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="w-3 h-3 text-blue-500" />
                    <span>ETA: {saved.estimatedArrival}</span>
                  </div>
                  {saved.isUnloaded && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                        <Anchor className="w-3 h-3" />
                        {isAr ? 'تم التفريغ' : 'Unloaded'}
                      </div>
                      {saved.nextTrackingNumber && (
                        <div className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                          {isAr ? 'رقم تتبع جديد متاح' : 'Next tracking available'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setTrackingInfo(saved);
                    setContainerCode(saved.containerNumber);
                    setShowHistory(false);
                  }}
                  className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  {isAr ? 'عرض التفاصيل' : 'View Details'}
                </button>
              </div>
            ))
          )}
        </motion.div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
              <Ship className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className={`block w-full ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-slate-50`}
              placeholder={isAr ? 'مثلاً: MEDU7626508' : 'e.g., MEDU7626508'}
              value={containerCode}
              onChange={(e) => setContainerCode(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isTracking}
            className="bg-slate-900 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-blue-600 disabled:bg-slate-200 transition-all flex items-center justify-center gap-3"
          >
            {isTracking ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {isAr ? 'بدء التتبع العميق' : 'Start Deep Tracking'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {trackingInfo && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          {isAlertTriggered && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-600 text-white p-6 rounded-3xl shadow-xl flex items-center gap-4 border-2 border-red-400"
            >
              <div className="bg-white/20 p-3 rounded-2xl">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg">
                  {isAr ? 'تنبيه: اقتراب موعد الوصول!' : 'Alert: Arrival Imminent!'}
                </h4>
                <p className="text-red-100 text-sm font-medium">
                  {isAr 
                    ? `الحاوية ستصل خلال أقل من ${alertThreshold} ساعة (الموعد المتوقع: ${trackingInfo.estimatedArrival})` 
                    : `Container is arriving in less than ${alertThreshold} hours (ETA: ${trackingInfo.estimatedArrival})`}
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <Activity className="w-4 h-4 text-blue-600" />
              {isAr ? 'نتائج التتبع لـ:' : 'Tracking results for:'} <span className="text-slate-900 font-bold">{trackingInfo.containerNumber}</span>
              {trackingInfo.isUnloaded && (
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Anchor className="w-3 h-3" />
                  {isAr ? 'تم التفريغ' : 'Unloaded'}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-3 border-r border-slate-100">
                <ShieldCheck className={`w-4 h-4 ${isAlertEnabled ? 'text-green-500' : 'text-slate-300'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{isAr ? 'تنبيه ETA' : 'ETA Alert'}</span>
                <button 
                  onClick={() => setIsAlertEnabled(!isAlertEnabled)}
                  className={`w-10 h-5 rounded-full transition-all relative ${isAlertEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isRtl ? (isAlertEnabled ? 'left-1' : 'right-1') : (isAlertEnabled ? 'right-1' : 'left-1')}`} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 px-2">
                <select 
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                >
                  <option value={12}>12h</option>
                  <option value={24}>24h</option>
                  <option value={48}>48h</option>
                  <option value={72}>72h</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleTrack(undefined, trackingInfo.containerNumber)}
              disabled={isTracking}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTracking ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث البيانات الآن' : 'Refresh Data Now'}
            </button>
          </div>
          {/* Vessel & Voyage Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{isAr ? 'الناقل' : 'Carrier'}</div>
              <div className="text-lg font-bold text-slate-900">{trackingInfo.carrier}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{isAr ? 'اسم السفينة' : 'Vessel Name'}</div>
              <div className="text-lg font-bold text-blue-600">{trackingInfo.shipName}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{isAr ? 'رقم الرحلة' : 'Voyage No.'}</div>
              <div className="text-lg font-bold text-slate-900">{trackingInfo.voyageNumber}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{isAr ? 'الحالة' : 'Status'}</div>
              <div className="text-lg font-bold text-green-600">{trackingInfo.status}</div>
            </div>
            {trackingInfo.isUnloaded && (
              <div className="bg-green-600 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-center">
                <div className="text-[10px] font-bold text-green-100 uppercase mb-1">{isAr ? 'حالة الحمولة' : 'Cargo Status'}</div>
                <div className="text-lg font-bold flex items-center gap-2">
                  <Anchor className="w-5 h-5" />
                  {isAr ? 'تم تفريغ الحمولة' : 'Cargo Unloaded'}
                </div>
                {trackingInfo.unloadedDate && (
                  <div className="text-xs text-green-100 mt-1">{trackingInfo.unloadedDate}</div>
                )}
                {trackingInfo.nextTrackingNumber && (
                  <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
                    <div className="text-[10px] font-bold text-green-200 uppercase mb-1">
                      {isAr ? `رقم تتبع جديد (${trackingInfo.nextTrackingType})` : `New Tracking Number (${trackingInfo.nextTrackingType})`}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm tracking-widest">{trackingInfo.nextTrackingNumber}</span>
                      <button 
                        onClick={() => {
                          setContainerCode(trackingInfo.nextTrackingNumber!);
                          handleTrack(undefined, trackingInfo.nextTrackingNumber);
                        }}
                        className="px-3 py-1 bg-white text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-50 transition-all"
                      >
                        {isAr ? 'تتبع الآن' : 'Track Now'}
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Post-Port Details */}
                {(trackingInfo.customsStatus || trackingInfo.terminalName || trackingInfo.portStorageDays !== undefined) && (
                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                    {trackingInfo.customsStatus && (
                      <div>
                        <div className="text-[9px] font-bold text-green-200 uppercase">{isAr ? 'حالة الجمارك' : 'Customs Status'}</div>
                        <div className="text-xs font-bold">{trackingInfo.customsStatus}</div>
                      </div>
                    )}
                    {trackingInfo.terminalName && (
                      <div>
                        <div className="text-[9px] font-bold text-green-200 uppercase">{isAr ? 'المحطة' : 'Terminal'}</div>
                        <div className="text-xs font-bold">{trackingInfo.terminalName}</div>
                      </div>
                    )}
                    {trackingInfo.portStorageDays !== undefined && (
                      <div>
                        <div className="text-[9px] font-bold text-green-200 uppercase">{isAr ? 'أيام التخزين' : 'Storage Days'}</div>
                        <div className="text-xs font-bold">{trackingInfo.portStorageDays} {isAr ? 'أيام' : 'days'}</div>
                      </div>
                    )}
                    {trackingInfo.freeTimeRemaining && (
                      <div>
                        <div className="text-[9px] font-bold text-green-200 uppercase">{isAr ? 'الوقت المجاني المتبقي' : 'Free Time Left'}</div>
                        <div className="text-xs font-bold text-amber-300">{trackingInfo.freeTimeRemaining}</div>
                      </div>
                    )}
                  </div>
                )}
                
                {trackingInfo.finalDestinationETA && (
                  <div className="mt-4 p-3 bg-blue-600/50 rounded-xl border border-blue-400/30">
                    <div className="text-[9px] font-bold text-blue-100 uppercase mb-1">{isAr ? 'الوصول المتوقع للمستودع' : 'Final Warehouse ETA'}</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {trackingInfo.finalDestinationETA}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AIS Real-time Data */}
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">{isAr ? 'بيانات AIS اللحظية' : 'Live AIS Data'}</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">{isAr ? 'الموقع الحالي' : 'Current Location'}</div>
                  <div className="text-lg font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    {trackingInfo.lastLocation}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">{isAr ? 'السرعة الحالية' : 'Current Speed'}</div>
                  <div className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    {trackingInfo.currentSpeed}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">{isAr ? 'الاتجاه' : 'Heading'}</div>
                  <div className="text-lg font-bold flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-400" />
                    {trackingInfo.currentHeading}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">{isAr ? 'الوصول المتوقع' : 'ETA'}</div>
                  <div className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {trackingInfo.estimatedArrival}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Map Tracking */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                {isAr ? 'الخارطة الملاحية الحية (AIS)' : 'Live Maritime Map (AIS)'}
              </h3>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {trackingInfo.lastLocation}
              </div>
            </div>
            <div className="h-[400px] w-full relative z-0">
              {trackingInfo.coordinates ? (
                <MapContainer 
                  center={[trackingInfo.coordinates.lat, trackingInfo.coordinates.lng]} 
                  zoom={5} 
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <ChangeView center={[trackingInfo.coordinates.lat, trackingInfo.coordinates.lng]} zoom={5} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[trackingInfo.coordinates.lat, trackingInfo.coordinates.lng]}>
                    <Popup>
                      <div className="text-center">
                        <div className="font-bold text-blue-600 mb-1">{trackingInfo.shipName}</div>
                        <div className="text-[10px] text-slate-500">{trackingInfo.lastLocation}</div>
                        <div className="text-[10px] font-bold mt-1 text-slate-900">{trackingInfo.status}</div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
                  {isAr ? 'جاري تحميل الخارطة...' : 'Loading map...'}
                </div>
              )}
            </div>
          </div>

          {/* Route Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8">
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-2xl">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{isAr ? 'تحليل المسار والظروف الحالية' : 'Route Analysis & Current Conditions'}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{trackingInfo.routeNotes}</p>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {isAr ? 'إجمالي مدة الرحلة:' : 'Total Duration:'} <span className="text-blue-600">{trackingInfo.totalDuration}</span>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {isAr ? 'المسافة المقطوعة:' : 'Distance Covered:'} <span className="text-blue-600">{trackingInfo.totalDistance}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500 text-white p-3 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{isAr ? 'تنبيهات ومعوقات محتملة' : 'Potential Alerts & Obstacles'}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{trackingInfo.alerts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Estimates */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
            <div className="flex items-start gap-4">
              <div className="bg-slate-900 text-white p-3 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{isAr ? 'تقدير التكاليف الواقعية (2026)' : 'Realistic Cost Estimates (2026)'}</h3>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-slate-600 text-sm leading-relaxed">
                  {trackingInfo.costEstimates}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Past Events */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  {isAr ? 'سجل التتبع (الماضي)' : 'Tracking History (Past)'}
                </h3>
              </div>
              <div className="p-8">
                <div className="relative space-y-8">
                  <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-slate-100" />
                  {trackingInfo.events.map((event, idx) => (
                    <div key={idx} className="relative flex gap-6 group">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-slate-400 z-10">
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col mb-1">
                          <h4 className="font-bold text-slate-700 text-sm">{event.description}</h4>
                          <span className="text-[10px] font-bold text-slate-400">{event.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Future Timeline */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-blue-600">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {isAr ? 'الجدول الزمني المتوقع (المستقبل)' : 'Expected Timeline (Future)'}
                </h3>
              </div>
              <div className="p-8">
                <div className="relative space-y-8">
                  <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-blue-50" />
                  {trackingInfo.futureTimeline.map((item, idx) => (
                    <div key={idx} className="relative flex gap-6 group">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center font-bold text-blue-600 z-10">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex flex-col mb-1">
                          <h4 className="font-bold text-slate-900 text-sm">{item.event}</h4>
                          <span className="text-[10px] font-bold text-blue-600">{item.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Anchor className="w-3 h-3" /> {item.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex justify-center">
            <a 
              href={trackingInfo.trackingUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {isAr ? 'فتح التتبع التفصيلي على موقع الناقل الرسمي' : 'Open Detailed Tracking on Carrier Official Site'}
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
