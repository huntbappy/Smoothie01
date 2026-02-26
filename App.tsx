
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, Share2, Globe, Calendar, X, Save, Plus, 
  FileText, Copy, Wallet, ShoppingBag, 
  Receipt, Lock, Unlock, Layers, LayoutGrid, ChevronRight, Check, ShieldCheck, Cloud, AlertCircle, Key, ToggleRight, ToggleLeft
} from 'lucide-react';
import { INITIAL_ITEMS, STOCK_ITEMS, TRANSLATIONS } from './constants';
import { ItemConfig, StockItemConfig, Language, DayData, ViewMode, MonthStockData } from './types';
import SmoothieLogo from './components/SmoothieLogo';
import DetailModal from './components/DetailModal';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const getNextDateString = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  
  const [currentDate, setCurrentDate] = useState(() => getLocalDateString());
  
  const [history, setHistory] = useState<Record<string, DayData>>(() => {
    const saved = localStorage.getItem('history');
    return saved ? JSON.parse(saved) : {};
  });
  const [stockHistory, setStockHistory] = useState<Record<string, MonthStockData>>(() => {
    const saved = localStorage.getItem('stockHistory');
    return saved ? JSON.parse(saved) : {};
  });

  const [securityPin, setSecurityPin] = useState(() => localStorage.getItem('security_pin') || '0000');
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
  
  const [changePinStep, setChangePinStep] = useState<'verify' | 'new'>('verify');
  const [pinForm, setPinForm] = useState({ old: '', new: '', confirm: '' });
  const [changePinError, setChangePinError] = useState('');

  const [detailModalType, setDetailModalType] = useState<'purchase' | 'expense' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const actualNow = getLocalDateString();
      // If it's a new day, we update currentDate to today if it was previously pointing to the previous "today"
      const prevActualToday = getLocalDateString(); 
      // This is a simple logic to auto-advance date for open apps
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
  const today = getLocalDateString();
  
  const currentDayData: DayData = history[currentDate] || { 
    quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: '', isSynced: false
  };

  const currentStockData: MonthStockData = stockHistory[currentMonthKey] || { items: {}, isSynced: false };

  const isHistorical = currentDate < today;
  const isLocked = (isHistorical || currentDayData.isLocked) && !isUnlockedByPin;

  useEffect(() => {
    // When switching dates, always re-lock if it's history
    setIsUnlockedByPin(false);
  }, [currentDate]);

  const formattedDisplayDate = useMemo(() => {
    const dateObj = new Date(currentDate);
    if (viewMode === 'stock') {
      return dateObj.toLocaleDateString(lang === 'BN' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
    }
    return dateObj.toLocaleDateString(lang === 'BN' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
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

  const handleCloudSync = async () => {
    setIsSyncing(true);
    // Simulating a brief delay for sync feel
    await new Promise(resolve => setTimeout(resolve, 1000));
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

  const generateSummaryText = () => {
    if (viewMode === 'sales') {
      let text = `📊 *${t.title} - ${t.dailySales}*\n📅 ${formattedDisplayDate}\n\n`;
      
      // Table Header
      const subtotalLabel = lang === 'BN' ? 'সাবটোটাল' : 'Subtotal';
      text += `*${t.itemHeader} | ${t.q250} | ${t.q350} | ${subtotalLabel}*\n`;
      text += `--------------------------------\n`;

      // Sales Items
      let hasSales = false;
      totals.itemsWithTotals.forEach(item => {
        if (item.q250 > 0 || item.q350 > 0) {
          hasSales = true;
          const itemName = lang === 'BN' ? item.nameBN : item.name;
          text += `${item.icon || '🥤'} ${itemName} | ${item.q250} | ${item.q350} | ${item.itemTotal}\n`;
        }
      });

      if (!hasSales) {
        text += `(No sales recorded)\n`;
      }
      text += `\n`;

      // Purchase Section
      if ((currentDayData.purchase || 0) > 0) {
        text += `🛒 *${t.purchase} ${lang === 'BN' ? 'বিস্তারিত' : 'Details'}*:\n`;
        if (currentDayData.purchaseDetails && currentDayData.purchaseDetails.length > 0) {
          currentDayData.purchaseDetails.forEach(p => {
            if (p.amount > 0) {
              text += `   • ${p.description || (lang === 'BN' ? 'আইটেম' : 'Item')}: ${t.taka}${p.amount}\n`;
            }
          });
        }
        text += `   *Total ${t.purchase}: ${t.taka}${currentDayData.purchase}*\n\n`;
      }

      // Expense Section
      if ((currentDayData.expense || 0) > 0) {
        text += `💸 *${t.expense} ${lang === 'BN' ? 'বিস্তারিত' : 'Details'}*:\n`;
        if (currentDayData.expenseDetails && currentDayData.expenseDetails.length > 0) {
          currentDayData.expenseDetails.forEach(e => {
            if (e.amount > 0) {
              text += `   • ${e.description || (lang === 'BN' ? 'আইটেম' : 'Item')}: ${t.taka}${e.amount}\n`;
            }
          });
        }
        text += `   *Total ${t.expense}: ${t.taka}${currentDayData.expense}*\n\n`;
      }

      text += `--------------------------------\n`;
      text += `💰 *${t.totalSales}: ${t.taka}${totals.grandTotal}*\n`;
      text += `💵 *${t.cashInHand}: ${t.taka}${cashInHand}*\n`;
      text += `🏦 *${t.previousBalance}: ${t.taka}${currentDayData.previousBalance}*\n`;
      text += `⚖️ *${t.totalBalance}: ${t.taka}${totalBalance}*\n`;
      
      if (currentDayData.notes) {
        text += `\n📝 *${t.notes}*: ${currentDayData.notes}\n`;
      }
      
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

  const handleShareOnly = async () => {
    // 1. Sync to cloud first
    await handleCloudSync();

    // 2. Lock the current day and forward balance
    const balanceToForward = totalBalance;
    const nextDate = getNextDateString(currentDate);

    if (viewMode === 'sales') {
      setHistory(prev => ({
        ...prev,
        [currentDate]: {
          ...(prev[currentDate] || { quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: '' }),
          isLocked: true,
          isSynced: true
        },
        [nextDate]: {
          ...(prev[nextDate] || { quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: '' }),
          previousBalance: balanceToForward
        }
      }));
    }

    // 3. Then share/copy
    const summary = generateSummaryText();
    if (navigator.share) {
      try {
        await navigator.share({ title: t.title, text: summary });
      } catch (err) {
        // Fallback to clipboard if share fails or is cancelled
        navigator.clipboard.writeText(summary);
        alert(lang === 'BN' ? 'ডাটা কপি করা হয়েছে!' : 'Data copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(summary);
      alert(lang === 'BN' ? 'ডাটা কপি করা হয়েছে!' : 'Data copied to clipboard!');
    }
    setIsShareModalOpen(false);
  };

  const addProduct = () => {
    const newItem = viewMode === 'sales' ? { id: Date.now().toString(), name: 'New Item', nameBN: 'নতুন আইটেম', price250: 100, price350: 150, icon: '🥤' } : { id: 's' + Date.now().toString(), name: 'New Stock', nameBN: 'নতুন স্টক' };
    viewMode === 'sales' ? setItems([...items, newItem as ItemConfig]) : setStockItems([...stockItems, newItem as StockItemConfig]);
  };

  const deleteProduct = (id: string) => {
    if (!window.confirm(lang === 'BN' ? 'মুছে ফেলতে চান?' : 'Delete product?')) return;
    viewMode === 'sales' ? setItems(items.filter(i => i.id !== id)) : setStockItems(stockItems.filter(i => i.id !== id));
  };

  const resetPinForm = () => {
    setPinForm({ old: '', new: '', confirm: '' });
    setChangePinStep('verify');
    setChangePinError('');
  };

  const handleChangePinSubmit = () => {
    if (changePinStep === 'verify') {
      if (pinForm.old === securityPin) { setChangePinStep('new'); setChangePinError(''); }
      else { setChangePinError(t.incorrectPin); }
    } else {
      if (pinForm.new.length === 4 && pinForm.new === pinForm.confirm) {
        setSecurityPin(pinForm.new);
        alert(t.pinSuccess);
        setIsChangePinModalOpen(false);
        resetPinForm();
      } else { setChangePinError(t.pinMismatch); }
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden text-black pb-[env(safe-area-inset-bottom)]">
      {/* Syncing Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
           <p className="font-black uppercase tracking-widest text-sky-600 text-sm">{lang === 'BN' ? 'গুগল ড্রাইভে সেভ হচ্ছে...' : 'Syncing to Google Drive...'}</p>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 p-4 pt-[calc(1rem+env(safe-area-inset-top))]`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <SmoothieLogo className="w-14 h-14" />
             <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight leading-none text-black uppercase">{t.title}</h1>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${viewMode === 'sales' ? 'text-sky-500' : 'text-coffee-500'}`}>
                  {viewMode === 'sales' ? t.dailySales : t.monthlyStock}
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-gray-50 text-gray-400 hover:text-sky-500 rounded-2xl transition-all">
              <Settings size={24} />
            </button>
          </div>
        </div>
        
        <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-[2rem] cursor-pointer transition-all relative shadow-xl ${viewMode === 'sales' ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-100' : 'bg-coffee-500 hover:bg-coffee-600 shadow-coffee-100'}`}>
          <Calendar size={20} className="text-white" />
          <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">{formattedDisplayDate}</span>
          <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </div>
        
        {isHistorical && (
            <div className={`mt-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest py-1 rounded-full border transition-all ${isLocked ? 'text-red-400 bg-red-50/50 border-red-100' : 'text-green-500 bg-green-50 border-green-100'}`}>
                {isLocked ? <><AlertCircle size={10} /> {t.lockedMsg}</> : <><Unlock size={10} /> {t.unlockedMsg}</>}
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
                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border border-gray-100 transition-all ${isLocked ? 'opacity-70 grayscale-[0.2]' : 'hover:shadow-lg'}`} style={{ backgroundColor: item.color || '#f9fafb' }}>
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-lg">{item.icon || '🥤'}</span>
                    <div>
                      <p className="text-sm font-bold text-black leading-tight">{lang === 'BN' ? item.nameBN : item.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{t.taka}{item.price250} | {t.taka}{item.price350}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.q250 || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateQty(item.id, 'q250', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black text-black outline-none transition-all ${isLocked ? 'bg-gray-200/50 cursor-not-allowed' : 'bg-white/80 border border-gray-200 focus:ring-4 focus:ring-sky-100'}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.q350 || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateQty(item.id, 'q350', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black text-black outline-none transition-all ${isLocked ? 'bg-gray-200/50 cursor-not-allowed' : 'bg-white/80 border border-gray-200 focus:ring-4 focus:ring-sky-100'}`} />
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
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 text-left flex flex-col justify-between">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><ShoppingBag size={10}/> {t.purchase}</label>
                    <span className="text-2xl font-black text-black">{t.taka} {currentDayData.purchase}</span>
                  </div>
                  <button 
                    onClick={() => setDetailModalType('purchase')}
                    className="mt-3 py-1.5 px-4 bg-gray-50 text-[10px] font-black text-gray-500 rounded-full border border-gray-100 hover:bg-sky-50 hover:text-sky-600 transition-all self-start uppercase tracking-widest"
                  >
                    {lang === 'BN' ? 'বিবরণ' : 'Description'}
                  </button>
                </div>
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 text-left flex flex-col justify-between">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><Receipt size={10}/> {t.expense}</label>
                    <span className="text-2xl font-black text-black">{t.taka} {currentDayData.expense}</span>
                  </div>
                  <button 
                    onClick={() => setDetailModalType('expense')}
                    className="mt-3 py-1.5 px-4 bg-gray-50 text-[10px] font-black text-gray-500 rounded-full border border-gray-100 hover:bg-sky-50 hover:text-sky-600 transition-all self-start uppercase tracking-widest"
                  >
                    {lang === 'BN' ? 'বিবরণ' : 'Description'}
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-sky-500" />
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.cashInHand}</label>
                    <span className="text-3xl font-black text-sky-600">{t.taka} {cashInHand}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-sky-50 text-sky-500"><Wallet size={24} /></div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 opacity-90">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">{t.previousBalance}</label>
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline gap-1 w-full">
                      <span className="text-5xl font-black text-sky-600 tracking-tighter">{t.taka}</span>
                      <span className="text-5xl font-black text-sky-600 tracking-tighter">
                        {currentDayData.previousBalance || 0}
                      </span>
                    </div>
                    <div className="text-gray-300"><Lock size={20} /></div>
                  </div>
                  <p className="text-[8px] font-black uppercase text-gray-300 mt-2 tracking-widest">Edit only in Settings</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 border-l-8 border-l-sky-500">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">{t.totalBalance}</label>
                  <div className="flex justify-between items-end">
                    <span className="text-5xl font-black text-sky-600 tracking-tighter">{t.taka} {totalBalance}</span>
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={14} />{t.notes}</label>
                  <textarea value={currentDayData.notes || ''} readOnly={isLocked} onChange={(e) => updateDayData({ notes: e.target.value })} placeholder="..." rows={3} className={`w-full border rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all resize-none ${isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200 focus:border-sky-400'}`} />
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
                <div key={item.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border border-gray-100 transition-all ${isLocked ? 'bg-gray-100 opacity-70' : 'bg-gray-50 hover:bg-white hover:shadow-xl'}`}>
                  <div className="col-span-5"><p className="text-sm font-bold text-black leading-tight">{lang === 'BN' ? item.nameBN : item.name}</p></div>
                  <div className="col-span-2">
                    <input type="number" value={item.qty || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateStockData(item.id, 'qty', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black outline-none transition-all ${isLocked ? 'bg-gray-200/50 cursor-not-allowed' : 'bg-white border border-gray-200 focus:ring-4 focus:ring-coffee-50'}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" value={item.taka || ''} placeholder="0" readOnly={isLocked} onKeyDown={handleKeyDown} onFocus={(e) => e.currentTarget.select()} onChange={(e) => updateStockData(item.id, 'taka', e.target.value)} className={`qty-input w-full text-center rounded-xl py-2.5 font-black outline-none transition-all ${isLocked ? 'bg-gray-200/50 cursor-not-allowed' : 'bg-white border border-gray-200 focus:ring-4 focus:ring-coffee-50'}`} />
                  </div>
                  <div className="col-span-3 text-right"><span className="text-sm font-black text-coffee-600">{t.taka}{item.itemTotal}</span></div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-4 mb-16">
          <button onClick={handleShareOnly} className={`flex-1 py-5 text-white font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest transition-all text-sm ${viewMode === 'sales' ? 'bg-sky-500 shadow-sky-100 hover:bg-sky-600' : 'bg-coffee-500 shadow-coffee-100 hover:bg-coffee-600'}`}><Share2 size={20} /> {t.share}</button>
        </div>
      </main>

      {/* Floating PIN Unlock Button - Shows when viewing historical data or locked current data */}
      {(isHistorical || currentDayData.isLocked) && (
          <button 
            onClick={() => isLocked ? setIsPinModalOpen(true) : setIsUnlockedByPin(false)}
            className={`fixed bottom-6 right-6 z-[50] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20 transition-all active:scale-90 ${isLocked ? 'bg-red-500 text-white shadow-red-200 animate-bounce' : 'bg-green-500 text-white shadow-green-200'}`}
          >
            {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
          </button>
      )}

      {/* PIN Modal for Unlocking History */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl text-center">
                <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><ShieldCheck size={32} /></div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">{t.enterPin}</h3>
                <div className="flex justify-center gap-4 mb-8">
                    <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && handlePINSubmit()} autoFocus className={`w-32 text-center text-4xl font-black tracking-[1em] py-4 bg-gray-50 border-2 rounded-2xl focus:border-sky-400 outline-none ${pinError ? 'border-red-500' : 'border-gray-100'}`} />
                </div>
                {pinError && <p className="text-red-500 text-[10px] font-black uppercase mb-6">{t.incorrectPin}</p>}
                <div className="flex gap-3">
                    <button onClick={() => { setIsPinModalOpen(false); setPinInput(''); setPinError(false); }} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                    <button onClick={handlePINSubmit} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-sky-100">Unlock</button>
                </div>
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

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-bottom flex flex-col pt-[env(safe-area-inset-top)]">
          <header className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3"><Settings className="text-sky-500" size={28} /><h2 className="text-2xl font-black text-black uppercase tracking-tight">{t.settings}</h2></div>
            <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><X size={24} /></button>
          </header>
          <div className="flex-1 p-6 overflow-y-auto space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.viewMode}</label>
              <div className="flex p-1 bg-gray-100 rounded-[2.5rem]">
                <button onClick={() => setViewMode('sales')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs ${viewMode === 'sales' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400'}`}>Sales</button>
                <button onClick={() => setViewMode('stock')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs ${viewMode === 'stock' ? 'bg-white text-coffee-500 shadow-sm' : 'text-gray-400'}`}>Stock</button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.languageLabel}</label>
              <div className="flex p-1 bg-gray-100 rounded-[2.5rem]">
                <button onClick={() => setLang('EN')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs ${lang === 'EN' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400'}`}>English</button>
                <button onClick={() => setLang('BN')} className={`flex-1 py-4 px-6 rounded-[2rem] font-black uppercase tracking-widest text-xs ${lang === 'BN' ? 'bg-white text-sky-500 shadow-sm' : 'text-gray-400'}`}>বাংলা</button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.previousBalance}</label>
              <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                <input 
                  type="number" 
                  value={currentDayData.previousBalance || ''} 
                  readOnly={isLocked}
                  onChange={(e) => updateDayData({ previousBalance: parseFloat(e.target.value) || 0 })} 
                  className={`w-full border rounded-xl px-4 py-3 text-lg font-black outline-none transition-all ${isLocked ? 'bg-gray-200/50 cursor-not-allowed border-gray-100' : 'bg-white border-gray-200 focus:border-sky-400'}`} 
                  placeholder="0" 
                />
              </div>
            </div>

            <button onClick={() => setIsProductManagementOpen(true)} className="w-full py-5 bg-gray-50 rounded-[2rem] flex items-center justify-between px-6 border border-gray-100">
              <div className="flex items-center gap-3"><LayoutGrid className="text-sky-500" /><span className="font-black uppercase tracking-widest">{t.manageProducts}</span></div>
              <ChevronRight className="text-gray-300" />
            </button>
            <button onClick={() => { setIsChangePinModalOpen(true); setIsSettingsOpen(false); }} className="w-full py-5 bg-gray-50 rounded-[2rem] flex items-center justify-between px-6 border border-gray-100">
              <div className="flex items-center gap-3"><ShieldCheck className="text-sky-500" /><span className="font-black uppercase tracking-widest">{t.securityPin}</span></div>
              <ChevronRight className="text-gray-300" />
            </button>
          </div>
          <div className="p-6 border-t"><button onClick={() => setIsSettingsOpen(false)} className="w-full py-5 bg-sky-500 text-white font-black rounded-[2rem] uppercase">Done</button></div>
        </div>
      )}

      {/* Change PIN Modal */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-[110] bg-gray-900/80 flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-black uppercase tracking-tight mb-4">{t.changePin}</h3>
            <div className="space-y-4 mb-8">
              {changePinStep === 'verify' ? (
                <input type="password" maxLength={4} value={pinForm.old} onChange={(e) => setPinForm({...pinForm, old: e.target.value.replace(/\D/g, '')})} className="w-full text-center text-2xl font-black py-3 bg-gray-50 rounded-2xl" placeholder="Old PIN" />
              ) : (
                <>
                  <input type="password" maxLength={4} value={pinForm.new} onChange={(e) => setPinForm({...pinForm, new: e.target.value.replace(/\D/g, '')})} className="w-full text-center text-2xl font-black py-3 bg-gray-50 rounded-2xl" placeholder="New PIN" />
                  <input type="password" maxLength={4} value={pinForm.confirm} onChange={(e) => setPinForm({...pinForm, confirm: e.target.value.replace(/\D/g, '')})} className="w-full text-center text-2xl font-black py-3 bg-gray-50 rounded-2xl" placeholder="Confirm PIN" />
                </>
              )}
            </div>
            {changePinError && <p className="text-red-500 text-[10px] uppercase mb-4">{changePinError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setIsChangePinModalOpen(false); resetPinForm(); }} className="flex-1 py-4 bg-gray-100 font-black rounded-2xl">Cancel</button>
              <button onClick={handleChangePinSubmit} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Management Modal */}
      {isProductManagementOpen && (
        <div className="fixed inset-0 z-[70] bg-white animate-in slide-in-from-bottom flex flex-col pt-[env(safe-area-inset-top)]">
          <header className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3"><LayoutGrid className="text-sky-500" size={28} /><h2 className="text-2xl font-black text-black uppercase tracking-tight">{t.manageProducts}</h2></div>
            <button onClick={() => setIsProductManagementOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><X size={24} /></button>
          </header>
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <button onClick={addProduct} className="w-full py-5 font-black rounded-[2rem] border-2 border-dashed border-sky-200 text-sky-500 bg-sky-50 flex items-center justify-center gap-2">
              <Plus size={20} /> Add New
            </button>
            {viewMode === 'sales' ? items.map((item, idx) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-3xl relative">
                <div className="flex gap-3 mb-2">
                   <input type="text" value={item.icon} onChange={(e) => { const n = [...items]; n[idx].icon = e.target.value; setItems(n); }} className="w-12 h-12 text-center bg-white rounded-xl border border-gray-200" />
                   <input type="text" value={item.name} onChange={(e) => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} className="flex-1 bg-white rounded-xl border border-gray-200 px-3 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">{t.q250}</label>
                    <input 
                      type="number" 
                      value={item.price250} 
                      onChange={(e) => { const n = [...items]; n[idx].price250 = parseInt(e.target.value) || 0; setItems(n); }} 
                      className="w-full bg-white rounded-xl border border-gray-200 p-2 text-center font-bold outline-none focus:ring-4 focus:ring-sky-50" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1">{t.q350}</label>
                    <input 
                      type="number" 
                      value={item.price350} 
                      onChange={(e) => { const n = [...items]; n[idx].price350 = parseInt(e.target.value) || 0; setItems(n); }} 
                      className="w-full bg-white rounded-xl border border-gray-200 p-2 text-center font-bold outline-none focus:ring-4 focus:ring-sky-50" 
                    />
                  </div>
                </div>
              </div>
            )) : stockItems.map((item, idx) => (
              <div key={item.id} className="bg-gray-50 p-4 rounded-3xl relative flex justify-between">
                <input type="text" value={item.name} onChange={(e) => { const n = [...stockItems]; n[idx].name = e.target.value; setStockItems(n); }} className="bg-white rounded-xl border border-gray-200 px-3 py-2 font-bold w-full" />
              </div>
            ))}
          </div>
          <div className="p-6 border-t"><button onClick={() => setIsProductManagementOpen(false)} className="w-full py-5 bg-sky-500 text-white font-black rounded-[2rem]">Save & Close</button></div>
        </div>
      )}
    </div>
  );
};

export default App;
