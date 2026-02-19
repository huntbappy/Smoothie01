
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, Share2, Trash2, Globe, Calendar, X, Save, Plus, Trash, 
  FileText, MessageCircle, Send, Copy, Wallet, ShoppingBag, 
  Receipt, Lock, Unlock, Layers, LayoutGrid, ChevronRight, Check, ShieldCheck, Cloud, AlertCircle, Key, ToggleRight, ToggleLeft,
  Facebook, Sparkles, Loader2
} from 'lucide-react';
import { INITIAL_ITEMS, STOCK_ITEMS, TRANSLATIONS } from './constants';
import { ItemConfig, StockItemConfig, Language, DayData, ViewMode, MonthStockData } from './types';
import SmoothieLogo from './components/SmoothieLogo';
import DetailModal from './components/DetailModal';
import { analyzeDailySales } from './services/geminiService';

// Mock Cloud Storage Key
const CLOUD_MOCK_KEY = 'cloud_drive_history';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'EN');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('viewMode') as ViewMode) || 'sales');
  const [items, setItems] = useState<ItemConfig[]>(() => {
    const saved = localStorage.getItem('items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  const [stockItems, setStockItems] = useState<StockItemConfig[]>(() => {
    const saved = localStorage.getItem('stockItems');
    return saved ? JSON.parse(saved) : STOCK_ITEMS;
  });
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<Record<string, DayData>>(() => {
    const saved = localStorage.getItem('history');
    return saved ? JSON.parse(saved) : {};
  });
  const [stockHistory, setStockHistory] = useState<Record<string, MonthStockData>>(() => {
    const saved = localStorage.getItem('stockHistory');
    return saved ? JSON.parse(saved) : {};
  });

  // PIN State - Default is 0000
  const [securityPin, setSecurityPin] = useState(() => localStorage.getItem('security_pin') || '0000');
  
  // Cloud Sync Toggle State (Defaults to true/ON)
  const [isCloudSyncEnabled, setIsCloudSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('isCloudSyncEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProductManagementOpen, setIsProductManagementOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  
  const [pinInput, setPinInput] = useState('');
  const [isUnlockedByPin, setIsUnlockedByPin] = useState(false);
  const [pinError, setPinError] = useState(false);
  
  // Change PIN states
  const [changePinStep, setChangePinStep] = useState<'verify' | 'new'>('verify');
  const [pinForm, setPinForm] = useState({ old: '', new: '', confirm: '' });
  const [changePinError, setChangePinError] = useState('');

  const [detailModalType, setDetailModalType] = useState<'purchase' | 'expense' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => localStorage.setItem('lang', lang), [lang]);
  useEffect(() => localStorage.setItem('viewMode', viewMode), [viewMode]);
  useEffect(() => localStorage.setItem('items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('stockItems', JSON.stringify(stockItems)), [stockItems]);
  useEffect(() => localStorage.setItem('history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('stockHistory', JSON.stringify(stockHistory)), [stockHistory]);
  useEffect(() => localStorage.setItem('security_pin', securityPin), [securityPin]);
  useEffect(() => localStorage.setItem('isCloudSyncEnabled', JSON.stringify(isCloudSyncEnabled)), [isCloudSyncEnabled]);

  const t = TRANSLATIONS[lang];
  const currentMonthKey = currentDate.substring(0, 7);
  const today = new Date().toISOString().split('T')[0];
  
  const isHistorical = currentDate < today;
  const isLocked = isHistorical && !isUnlockedByPin;

  useEffect(() => {
    setIsUnlockedByPin(false);
  }, [currentDate]);

  const currentDayData: DayData = history[currentDate] || { 
    quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: '', isSynced: false
  };

  const currentStockData: MonthStockData = stockHistory[currentMonthKey] || { items: {}, isSynced: false };

  const formattedDisplayDate = useMemo(() => {
    const dateObj = new Date(currentDate);
    if (viewMode === 'stock') {
      return dateObj.toLocaleDateString(lang === 'BN' ? 'bn-BD' : 'en-US', { 
        month: 'long', year: 'numeric'
      });
    }
    return dateObj.toLocaleDateString(lang === 'BN' ? 'bn-BD' : 'en-US', { 
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
    });
  }, [currentDate, lang, viewMode]);

  const updateDayData = (updates: Partial<DayData>) => {
    if (isLocked) return;
    setHistory(prev => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || { quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: '' }),
        ...updates
      }
    }));
  };

  const updateStockData = (itemId: string, field: 'qty' | 'taka', value: string) => {
    if (isLocked) return;
    const num = parseFloat(value) || 0;
    setStockHistory(prev => ({
      ...prev,
      [currentMonthKey]: {
        items: {
          ...(prev[currentMonthKey]?.items || {}),
          [itemId]: {
            ...(prev[currentMonthKey]?.items[itemId] || { qty: 0, taka: 0 }),
            [field]: num
          }
        }
      }
    }));
  };

  const updateQty = (itemId: string, size: 'q250' | 'q350', val: string) => {
    if (isLocked) return;
    const num = parseInt(val) || 0;
    const currentQties = currentDayData.quantities || {};
    updateDayData({
      quantities: {
        ...currentQties,
        [itemId]: {
          ...(currentQties[itemId] || { q250: 0, q350: 0 }),
          [size]: num
        }
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputs = Array.from(document.querySelectorAll('.qty-input')) as HTMLInputElement[];
      const index = inputs.indexOf(e.currentTarget);
      if (index !== -1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
        inputs[index + 1].select();
      } else {
        e.currentTarget.blur();
      }
    }
  };

  const totals = useMemo(() => {
    let grandTotal = 0;
    const itemsWithTotals = items.map(item => {
      const q = currentDayData.quantities[item.id] || { q250: 0, q350: 0 };
      const itemTotal = (q.q250 * item.price250) + (q.q350 * item.price350);
      grandTotal += itemTotal;
      return { ...item, q250: q.q250, q350: q.q350, itemTotal };
    });
    return { itemsWithTotals, grandTotal };
  }, [items, currentDayData]);

  const stockTotals = useMemo(() => {
    let grandTotal = 0;
    const stockItemsWithTotals = stockItems.map(item => {
      const entry = currentStockData.items[item.id] || { qty: 0, taka: 0 };
      const itemTotal = entry.qty * entry.taka;
      grandTotal += itemTotal;
      return { ...item, ...entry, itemTotal };
    });
    return { stockItemsWithTotals, grandTotal };
  }, [currentStockData, stockItems]);

  const cashInHand = totals.grandTotal - (currentDayData.purchase || 0) - (currentDayData.expense || 0);
  const totalBalance = cashInHand + (currentDayData.previousBalance || 0);

  const handlePINSubmit = () => {
    if (pinInput === securityPin) {
      setIsUnlockedByPin(true);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleChangePinSubmit = () => {
    if (changePinStep === 'verify') {
      if (pinForm.old === securityPin) {
        setChangePinStep('new');
        setChangePinError('');
      } else {
        setChangePinError(t.incorrectPin);
      }
    } else {
      if (pinForm.new.length === 4 && pinForm.new === pinForm.confirm) {
        setSecurityPin(pinForm.new);
        alert(t.pinSuccess);
        setIsChangePinModalOpen(false);
        resetPinForm();
      } else if (pinForm.new !== pinForm.confirm) {
        setChangePinError(t.pinMismatch);
      } else {
        setChangePinError(lang === 'BN' ? 'পিন অবশ্যই ৪ সংখ্যার হতে হবে।' : 'PIN must be 4 digits.');
      }
    }
  };

  const resetPinForm = () => {
    setPinForm({ old: '', new: '', confirm: '' });
    setChangePinStep('verify');
    setChangePinError('');
  };

  const handleCloudSync = async () => {
    if (!isCloudSyncEnabled) return;
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const cloudHistory = JSON.parse(localStorage.getItem(CLOUD_MOCK_KEY) || '{}');
    if (viewMode === 'sales') {
        cloudHistory[currentDate] = currentDayData;
        updateDayData({ isSynced: true });
    } else {
        cloudHistory[currentMonthKey] = currentStockData;
        setStockHistory(prev => ({
            ...prev,
            [currentMonthKey]: { ...currentStockData, isSynced: true }
        }));
    }
    localStorage.setItem(CLOUD_MOCK_KEY, JSON.stringify(cloudHistory));
    setIsSyncing(false);
  };

  const handleClearAll = () => {
    if (isLocked) return;
    const confirmMsg = lang === 'BN' ? 'আপনি কি নিশ্চিত যে আপনি সব মুছতে চান?' : 'Are you sure you want to clear everything?';
    if (!window.confirm(confirmMsg)) return;
    
    if (viewMode === 'sales') {
      const balanceToForward = totalBalance;
      updateDayData({
        quantities: {},
        purchase: 0,
        expense: 0,
        purchaseDetails: [],
        expenseDetails: [],
        notes: '',
        isSynced: false,
        previousBalance: balanceToForward
      });
    } else {
      setStockHistory(prev => ({
        ...prev,
        [currentMonthKey]: { items: {}, isSynced: false }
      }));
    }
  };

  const generateSummaryText = () => {
    if (viewMode === 'sales') {
      let text = `📊 *${t.title} - ${t.dailySales}*\n📅 ${formattedDisplayDate}\n\n`;
      let hasEntries = false;
      totals.itemsWithTotals.forEach(item => {
        if (item.q250 > 0 || item.q350 > 0) {
          hasEntries = true;
          text += `${item.icon || '🥤'} *${lang === 'BN' ? item.nameBN : item.name}*\n`;
          if (item.q250 > 0) text += `   • 250ml: ${item.q250}\n`;
          if (item.q350 > 0) text += `   • 350ml: ${item.q350}\n`;
          text += `   *Subtotal: ${t.taka}${item.itemTotal}*\n\n`;
        }
      });
      if (!hasEntries) text += `(No sales recorded yet)\n\n`;
      text += `━━━━━━━━━━━━━━━\n💰 *${t.totalSales}: ${t.taka}${totals.grandTotal}*\n\n━━━━━━━━━━━━━━━\n💵 *${t.cashInHand}: ${t.taka}${cashInHand}*\n🏦 *${t.previousBalance}: ${t.taka}${currentDayData.previousBalance}*\n⚖️ *${t.totalBalance}: ${t.taka}${totalBalance}*\n`;
      return text;
    } else {
      let text = `📦 *${t.title} - ${t.monthlyStock}*\n📅 ${formattedDisplayDate}\n\n`;
      stockTotals.stockItemsWithTotals.forEach(item => {
        if (item.itemTotal > 0) {
          text += `🛒 *${lang === 'BN' ? item.nameBN : item.name}*: ${item.qty} x ${item.taka} = ${t.taka}${item.itemTotal}\n`;
        }
      });
      text += `━━━━━━━━━━━━━━━\n💎 *${t.grandTotal}: ${t.taka}${stockTotals.grandTotal}*\n`;
      return text;
    }
  };

  const handleMagicLinkShare = async () => {
    if (viewMode !== 'sales') {
      alert(lang === 'BN' ? 'ম্যাজিক লিংক শুধুমাত্র দৈনিক বিক্রয়ের জন্য প্রযোজ্য।' : 'Magic Link is only available for Daily Sales.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDailySales(items, currentDayData, lang);
      const summaryText = generateSummaryText();
      const magicSummary = `✨ *SMART INSIGHT* ✨\n${analysis.insight}\n\n💡 *SUGGESTION* 💡\n${analysis.suggestion}\n\n📣 *MARKETING HOOK* 📣\n${analysis.marketingHook}\n\n━━━━━━━━━━━━━━━\n${summaryText}`;

      if (navigator.share) {
        await navigator.share({
          title: `Magic Insight - ${formattedDisplayDate}`,
          text: magicSummary,
        });
      } else {
        await navigator.clipboard.writeText(magicSummary);
        alert(lang === 'BN' ? 'ম্যাজিক রিপোর্ট কপি করা হয়েছে!' : 'Magic report copied to clipboard!');
      }
    } catch (error) {
      console.error(error);
      alert('Magic Link analysis failed. Copying basic report instead.');
      navigator.clipboard.writeText(generateSummaryText());
    } finally {
      setIsAnalyzing(false);
      setIsShareModalOpen(false);
    }
  };

  const addProduct = () => {
    if (viewMode === 'sales') {
      const newItem: ItemConfig = {
        id: Date.now().toString(),
        name: 'New Smoothie',
        nameBN: 'নতুন স্মুদি',
        price250: 100,
        price350: 150,
        icon: '🥤',
        color: '#f9fafb'
      };
      setItems([...items, newItem]);
    } else {
      const newItem: StockItemConfig = {
        id: 's' + Date.now().toString(),
        name: 'New Stock',
        nameBN: 'নতুন স্টক'
      };
      setStockItems([...stockItems, newItem]);
    }
  };

  const deleteProduct = (id: string) => {
    if (!window.confirm(lang === 'BN' ? 'আপনি কি এটি মুছতে চান?' : 'Are you sure you want to delete this?')) return;
    if (viewMode === 'sales') {
      setItems(items.filter(i => i.id !== id));
    } else {
      setStockItems(stockItems.filter(i => i.id !== id));
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden text-black pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 p-4 pt-[calc(1rem+env(safe-area-inset-top))]`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <SmoothieLogo className="w-14 h-14" />
             <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight leading-none text-black uppercase">{t.title}</h1>
                <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${viewMode === 'sales' ? 'text-sky-500' : 'text-coffee-500'}`}>
                  {viewMode === 'sales' ? t.dailySales : t.monthlyStock}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            {isHistorical && (
              <button 
                onClick={() => isLocked ? setIsPinModalOpen(true) : setIsUnlockedByPin(false)}
                className={`p-3 rounded-2xl transition-all border ${isLocked ? 'bg-red-50 text-red-500 border-red-100' : 'bg-green-50 text-green-500 border-green-100'}`}
              >
                {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
              </button>
            )}
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-gray-50 text-gray-400 hover:text-sky-500 rounded-2xl transition-all">
              <Settings size={24} />
            </button>
          </div>
        </div>
        
        <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-[2rem] cursor-pointer transition-all relative shadow-xl ${viewMode === 'sales' ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-100' : 'bg-coffee-500 hover:bg-coffee-600 shadow-coffee-100'}`}>
          <Calendar size={20} className="text-white" />
          <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">{formattedDisplayDate}</span>
          <input type="date" value={currentDate} onChange={(e) => { setCurrentDate(e.target.value); }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </div>
        
        {isLocked && (
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-50/50 py-1 rounded-full border border-red-100">
                <AlertCircle size={10} /> {t.lockedMsg}
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-6 px-4 custom-scrollbar">
        {viewMode === 'sales' ? (
          <>
            <div className="px-4 mb-3 grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="col-span-5">{t.itemHeader}</div>
              <div className="col-span-2 text-center">{t.q250}</div>
              <div className="col-span-2 text-center">{t.q350}</div>
              <div className="col-span-3 text-right">{t.total}</div>
            </div>
            
            <div className="space-y-3 mb-8">
              {totals.itemsWithTotals.map((item) => (
                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border border-gray-100 transition-all ${isLocked ? 'opacity-80 grayscale-[0.3]' : 'hover:shadow-lg'}`} style={{ backgroundColor: item.color || '#f9fafb' }}>
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-lg">{item.icon || '🥤'}</span>
                    <div>
                      <p className="text-sm font-bold text-black leading-tight">{lang === 'BN' ? item.nameBN : item.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{t.taka}{item.price250} | {t.taka}{item.price350}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.q250 || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateQty(item.id, 'q250', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black text-black outline-none transition-all ${isLocked ? 'bg-gray-200/50' : 'bg-white/80 border border-gray-200/50 focus:ring-4 focus:ring-white focus:border-sky-400'}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.q350 || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateQty(item.id, 'q350', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black text-black outline-none transition-all ${isLocked ? 'bg-gray-200/50' : 'bg-white/80 border border-gray-200/50 focus:ring-4 focus:ring-white focus:border-sky-400'}`} />
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-sm font-black text-sky-600">{t.taka}{item.itemTotal}</span>
                  </div>
                </div>
              ))}
            </div>

            <section className="bg-gray-50 rounded-[3rem] p-6 mb-8 border border-gray-100 space-y-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">{t.totalSales}</label>
                  <div className="flex justify-between items-end">
                    <span className="text-5xl font-black text-sky-600 tracking-tighter">{t.taka} {totals.grandTotal}</span>
                    <span className="text-[10px] font-black text-gray-300 uppercase mb-2">Revenue</span>
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDetailModalType('purchase')} className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-sky-200 transition-all text-left group">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ShoppingBag size={10}/> {t.purchase}</label>
                  <span className="text-2xl font-black text-black">{t.taka} {currentDayData.purchase}</span>
                </button>
                <button onClick={() => setDetailModalType('expense')} className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-sky-200 transition-all text-left group">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><Receipt size={10}/> {t.expense}</label>
                  <span className="text-2xl font-black text-black">{t.taka} {currentDayData.expense}</span>
                </button>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${cashInHand < 0 ? 'bg-gray-400' : 'bg-sky-500'}`} />
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.cashInHand}</label>
                    <span className={`text-3xl font-black ${cashInHand < 0 ? 'text-gray-400' : 'text-sky-600'}`}>{t.taka} {cashInHand}</span>
                  </div>
                  <div className={`p-4 rounded-2xl ${cashInHand < 0 ? 'bg-gray-50 text-gray-400' : 'bg-sky-50 text-sky-500'}`}><Wallet size={24} /></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden opacity-80">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gray-300" />
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.previousBalance}</label>
                    <span className="text-3xl font-black text-gray-600">{t.taka} {currentDayData.previousBalance}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 text-gray-400"><Lock size={24} /></div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden opacity-80">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-sky-300" />
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.totalBalance}</label>
                    <span className="text-3xl font-black text-sky-600">{t.taka} {totalBalance}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 text-sky-400"><Lock size={24} /></div>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={14} />{t.notes}</label>
                  <textarea value={currentDayData.notes || ''} readOnly={isLocked} onChange={(e) => updateDayData({ notes: e.target.value })} placeholder="..." rows={3} className={`w-full border rounded-2xl px-5 py-4 text-sm font-medium text-black outline-none transition-all resize-none shadow-sm ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 focus:border-sky-400'}`} />
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="px-4 mb-3 grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <div className="col-span-5">{t.itemHeader}</div>
              <div className="col-span-2 text-center">{t.qty}</div>
              <div className="col-span-2 text-center">{t.rate}</div>
              <div className="col-span-3 text-right">{t.total}</div>
            </div>
            <div className="space-y-3 mb-8">
              {stockTotals.stockItemsWithTotals.map((item) => (
                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border border-gray-100 transition-all ${isLocked ? 'bg-gray-50 opacity-80' : 'bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100'}`}>
                  <div className="col-span-5"><p className="text-sm font-bold text-black leading-tight">{lang === 'BN' ? item.nameBN : item.name}</p></div>
                  <div className="col-span-2">
                    <input type="number" value={item.qty || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateStockData(item.id, 'qty', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black text-black outline-none transition-all ${isLocked ? 'bg-gray-200/50' : 'bg-white border border-gray-200 focus:ring-4 focus:ring-coffee-50 focus:border-coffee-400'}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.taka || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateStockData(item.id, 'taka', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black text-black outline-none transition-all ${isLocked ? 'bg-gray-200/50' : 'bg-white border border-gray-200 focus:ring-4 focus:ring-coffee-50 focus:border-coffee-400'}`} />
                  </div>
                  <div className="col-span-3 text-right"><span className="text-sm font-black text-coffee-600">{t.taka}{item.itemTotal}</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-4 mb-16">
          <button onClick={handleClearAll} disabled={isLocked} className={`flex-1 py-5 text-white font-black rounded-[2rem] shadow-sm flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all text-sm ${isLocked ? 'bg-gray-300' : 'bg-gray-500'}`}><Trash2 size={20} /> {t.clearAll}</button>
          <button onClick={() => { handleCloudSync(); setIsShareModalOpen(true); }} className={`flex-1 py-5 text-white font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all text-sm ${viewMode === 'sales' ? 'bg-sky-500 shadow-sky-100' : 'bg-coffee-500 shadow-coffee-100'}`}><Share2 size={20} /> {t.share}</button>
        </div>
      </main>

      {/* PIN Modals */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><ShieldCheck size={32} /></div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t.enterPin}</h3>
                <div className="flex justify-center gap-4 mb-8">
                    <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && handlePINSubmit()} autoFocus className={`w-32 text-center text-4xl font-black tracking-[1em] py-4 bg-gray-50 border-2 rounded-2xl focus:border-sky-400 outline-none transition-all ${pinError ? 'border-red-500 shake' : 'border-gray-100'}`} />
                </div>
                {pinError && <p className="text-red-500 text-[10px] font-black uppercase mb-6">{t.incorrectPin}</p>}
                <div className="flex gap-3">
                    <button onClick={() => { setIsPinModalOpen(false); setPinInput(''); setPinError(false); }} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                    <button onClick={handlePINSubmit} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-sky-100">Unlock</button>
                </div>
            </div>
        </div>
      )}

      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-16 h-16 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mb-6"><Key size={32} /></div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t.changePin}</h3>
            
            <div className="space-y-4 mb-8">
              {changePinStep === 'verify' ? (
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">{t.oldPin}</label>
                  <input type="password" maxLength={4} value={pinForm.old} onChange={(e) => setPinForm({...pinForm, old: e.target.value.replace(/\D/g, '')})} className="w-full text-center text-2xl font-black py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-sky-400 outline-none" placeholder="****" />
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">{t.newPin}</label>
                    <input type="password" maxLength={4} value={pinForm.new} onChange={(e) => setPinForm({...pinForm, new: e.target.value.replace(/\D/g, '')})} className="w-full text-center text-2xl font-black py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-sky-400 outline-none" placeholder="****" />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-2">{t.confirmPin}</label>
                    <input type="password" maxLength={4} value={pinForm.confirm} onChange={(e) => setPinForm({...pinForm, confirm: e.target.value.replace(/\D/g, '')})} className="w-full text-center text-2xl font-black py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-sky-400 outline-none" placeholder="****" />
                  </div>
                </>
              )}
            </div>

            {changePinError && <p className="text-red-500 text-[10px] font-black uppercase mb-6">{changePinError}</p>}

            <div className="flex gap-3">
              <button onClick={() => { setIsChangePinModalOpen(false); resetPinForm(); }} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
              <button onClick={handleChangePinSubmit} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-sky-100">{changePinStep === 'verify' ? 'Next' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col pt-[env(safe-area-inset-top)]">
          <header className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3"><Settings className="text-sky-500" size={28} /><h2 className="text-2xl font-black text-black uppercase tracking-tight">{t.settings}</h2></div>
            <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-all"><X size={24} /></button>
          </header>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar pb-32">
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.viewMode}</label>
              <div className="flex p-1 bg-gray-100 rounded-[2.5rem] border border-gray-200">
                <button onClick={() => setViewMode('sales')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${viewMode === 'sales' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400'}`}><ShoppingBag size={14} /> {t.dailySales}</button>
                <button onClick={() => setViewMode('stock')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${viewMode === 'stock' ? 'bg-white text-coffee-500 shadow-sm' : 'text-gray-400'}`}><Layers size={14} /> {t.monthlyStock}</button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.languageLabel}</label>
              <div className="flex p-1 bg-gray-100 rounded-[2.5rem] border border-gray-200">
                <button onClick={() => setLang('EN')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${lang === 'EN' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400'}`}><Globe size={14} /> English</button>
                <button onClick={() => setLang('BN')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${lang === 'BN' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400'}`}><Globe size={14} /> বাংলা</button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.previousBalance}</label>
              <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                <input type="number" value={currentDayData.previousBalance || ''} readOnly={isLocked} onChange={(e) => updateDayData({ previousBalance: parseFloat(e.target.value) || 0 })} className={`w-full border rounded-xl px-4 py-3 text-lg font-black outline-none transition-all ${isLocked ? 'bg-gray-200/50 cursor-not-allowed border-gray-100' : 'bg-white border-gray-200 focus:border-sky-400'}`} placeholder="0" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">System Controls</label>
              <button onClick={() => setIsProductManagementOpen(true)} className="w-full py-5 bg-gray-50 rounded-[2rem] flex items-center justify-between px-6 border border-gray-100 hover:bg-gray-100 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-3"><LayoutGrid className="text-sky-500" /><span className="font-black uppercase tracking-widest">{t.manageProducts}</span></div>
                <ChevronRight className="text-gray-300" size={24} />
              </button>

              <button onClick={() => setIsChangePinModalOpen(true)} className="w-full py-5 bg-gray-50 rounded-[2rem] flex items-center justify-between px-6 border border-gray-100 hover:bg-gray-100 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-3"><ShieldCheck className="text-sky-500" /><span className="font-black uppercase tracking-widest">{t.securityPin}</span></div>
                <ChevronRight className="text-gray-300" size={24} />
              </button>

              <button onClick={() => setIsCloudSyncEnabled(!isCloudSyncEnabled)} className="w-full py-5 bg-gray-50 rounded-[2rem] flex items-center justify-between px-6 border border-gray-100 hover:bg-gray-100 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-3"><Cloud className={isSyncing ? "text-sky-500 animate-bounce" : "text-sky-500"} /><span className="font-black uppercase tracking-widest">{t.cloudSync}</span></div>
                <div className="flex items-center gap-3">{isCloudSyncEnabled ? <ToggleRight className="text-sky-500" size={40} /> : <ToggleLeft className="text-gray-300" size={40} />}</div>
              </button>
            </div>
          </div>
          <div className="p-6 bg-white border-t border-gray-50"><button onClick={() => setIsSettingsOpen(false)} className={`w-full py-5 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3 ${viewMode === 'sales' ? 'bg-sky-500' : 'bg-coffee-500'}`}><Check size={20} /> {lang === 'EN' ? 'DONE' : 'সম্পন্ন'}</button></div>
        </div>
      )}

      {/* Product Management Modal */}
      {isProductManagementOpen && (
        <div className="fixed inset-0 z-[70] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col pt-[env(safe-area-inset-top)]">
          <header className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3"><LayoutGrid className="text-sky-500" size={28} /><h2 className="text-2xl font-black text-black uppercase tracking-tight">{t.manageProducts}</h2></div>
            <button onClick={() => setIsProductManagementOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-all"><X size={24} /></button>
          </header>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar pb-32">
            <button 
              onClick={addProduct}
              className={`w-full py-5 font-black rounded-[2rem] shadow-sm flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all text-sm border-2 border-dashed ${viewMode === 'sales' ? 'border-sky-200 text-sky-500 bg-sky-50' : 'border-coffee-200 text-coffee-500 bg-coffee-50'}`}
            >
              <Plus size={20} /> {lang === 'EN' ? 'Add New Product' : 'নতুন প্রোডাক্ট যুক্ত করুন'}
            </button>

            {viewMode === 'sales' ? (
              items.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4 relative group">
                  <button onClick={() => deleteProduct(item.id)} className="absolute top-4 right-4 p-3 bg-white text-gray-300 hover:text-red-500 rounded-full border border-gray-100 shadow-sm transition-all"><Trash2 size={16}/></button>
                  <div className="flex items-center gap-4 mb-2">
                    <input 
                      type="text" 
                      value={item.icon} 
                      onChange={(e) => { const n = [...items]; n[idx].icon = e.target.value; setItems(n); }} 
                      className="w-16 h-16 text-2xl text-center bg-white border border-gray-200 rounded-2xl outline-none focus:border-sky-400 transition-all"
                    />
                    <div className="flex-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Smoothie Name (EN)</span>
                      <input type="text" value={item.name} onChange={(e) => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-sky-400 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">নাম (বাংলা)</label><input type="text" value={item.nameBN} onChange={(e) => { const n = [...items]; n[idx].nameBN = e.target.value; setItems(n); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-sky-400 outline-none" /></div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Prices (250 | 350)</label>
                        <div className="flex gap-2">
                          <input type="number" value={item.price250} onChange={(e) => { const n = [...items]; n[idx].price250 = parseInt(e.target.value) || 0; setItems(n); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-center focus:border-sky-400 outline-none" />
                          <input type="number" value={item.price350} onChange={(e) => { const n = [...items]; n[idx].price350 = parseInt(e.target.value) || 0; setItems(n); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-center focus:border-sky-400 outline-none" />
                        </div>
                     </div>
                  </div>
                </div>
              ))
            ) : (
              stockItems.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4 relative group">
                  <button onClick={() => deleteProduct(item.id)} className="absolute top-4 right-4 p-3 bg-white text-gray-300 hover:text-red-500 rounded-full border border-gray-100 shadow-sm transition-all"><Trash2 size={16}/></button>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Stock Name (EN)</label><input type="text" value={item.name} onChange={(e) => { const n = [...stockItems]; n[idx].name = e.target.value; setStockItems(n); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-coffee-400 outline-none" /></div>
                     <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-2">নাম (বাংলা)</label><input type="text" value={item.nameBN} onChange={(e) => { const n = [...stockItems]; n[idx].nameBN = e.target.value; setStockItems(n); }} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-coffee-400 outline-none" /></div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-white border-t border-gray-50">
            <button onClick={() => setIsProductManagementOpen(false)} className={`w-full py-5 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3 ${viewMode === 'sales' ? 'bg-sky-500' : 'bg-coffee-500'}`}>
              <Save size={20} /> {t.save}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modals */}
      {detailModalType && (
        <DetailModal type={detailModalType} entries={detailModalType === 'purchase' ? (currentDayData.purchaseDetails || []) : (currentDayData.expenseDetails || [])} onClose={() => setDetailModalType(null)} readOnly={isLocked} onSave={(entries) => {
            const total = entries.reduce((sum, e) => sum + e.amount, 0);
            updateDayData({ [detailModalType === 'purchase' ? 'purchase' : 'expense']: total, [detailModalType === 'purchase' ? 'purchaseDetails' : 'expenseDetails']: entries });
            setDetailModalType(null);
          }} lang={lang} />
      )}

      {/* Share Selection */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-center mb-8">
              <h3 className={`text-2xl font-black uppercase tracking-tight ${viewMode === 'sales' ? 'text-sky-600' : 'text-coffee-600'}`}>
                {viewMode === 'sales' ? t.shareSalesTitle : t.shareStockTitle}
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <button 
                onClick={handleMagicLinkShare} 
                disabled={isAnalyzing}
                className="flex flex-col items-center gap-3 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-tr from-sky-400 to-indigo-500 rounded-3xl flex items-center justify-center group-active:scale-90 transition-all text-white shadow-lg shadow-sky-100 ${isAnalyzing ? 'animate-pulse' : ''}`}>
                  {isAnalyzing ? <Loader2 className="animate-spin" size={32} /> : <Sparkles size={32} />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {isAnalyzing ? (lang === 'BN' ? 'বিশ্লেষণ...' : 'Analyzing...') : (lang === 'BN' ? 'ম্যাজিক লিংক' : 'Magic Link')}
                </span>
              </button>

              <button onClick={() => { navigator.clipboard.writeText(generateSummaryText()); alert(lang === 'BN' ? 'টেক্সট কপি করা হয়েছে!' : 'Summary copied!'); setIsShareModalOpen(false); }} className="flex flex-col items-center gap-3 group">
                <div className={`w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center group-active:scale-90 transition-all ${viewMode === 'sales' ? 'text-sky-600' : 'text-coffee-600'}`}>
                  <Copy size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t.copyText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <button onClick={() => setViewMode(prev => prev === 'sales' ? 'stock' : 'sales')} className="p-4 bg-lemongreen-400 text-black rounded-full shadow-2xl hover:bg-lemongreen-300 transition-all active:scale-90 border-2 border-black"><Layers size={24} /></button>
      </div>

      <style>{`
        .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default App;
