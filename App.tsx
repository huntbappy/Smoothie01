import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings, Share2, Trash2, Globe, Calendar, X, Save, Plus, Trash, 
  FileText, MessageCircle, Send, Copy, Wallet, ShoppingBag, 
  Receipt, Download, Upload, Lock
} from 'lucide-react';
import { INITIAL_ITEMS, TRANSLATIONS } from './constants';
import { ItemConfig, Language, DayData } from './types';
import SmoothieLogo from './components/SmoothieLogo';
import DetailModal from './components/DetailModal';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'EN');
  const [items, setItems] = useState<ItemConfig[]>(() => {
    const saved = localStorage.getItem('items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<Record<string, DayData>>(() => {
    const saved = localStorage.getItem('history');
    return saved ? JSON.parse(saved) : {};
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<'purchase' | 'expense' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => localStorage.setItem('lang', lang), [lang]);
  useEffect(() => localStorage.setItem('items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('history', JSON.stringify(history)), [history]);

  const t = TRANSLATIONS[lang];
  const currentDayData: DayData = history[currentDate] || { 
    quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: ''
  };

  const formattedDisplayDate = useMemo(() => {
    const dateObj = new Date(currentDate);
    return dateObj.toLocaleDateString(lang === 'BN' ? 'bn-BD' : 'en-US', { 
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
    });
  }, [currentDate, lang]);

  const updateDayData = (updates: Partial<DayData>) => {
    setHistory(prev => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || { quantities: {}, purchase: 0, expense: 0, previousBalance: 0, notes: '' }),
        ...updates
      }
    }));
  };

  const updateQty = (itemId: string, size: 'q250' | 'q350', val: string) => {
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

  const cashInHand = totals.grandTotal - (currentDayData.purchase || 0) - (currentDayData.expense || 0);
  const totalBalance = cashInHand + (currentDayData.previousBalance || 0);

  const handleClearAll = () => {
    if(window.confirm(t.clearAll + "?")) {
      // Calculate current total balance to roll it over
      const balanceToRollOver = totalBalance;
      
      setHistory(prev => ({
        ...prev,
        [currentDate]: {
          quantities: {},
          purchase: 0,
          expense: 0,
          purchaseDetails: [],
          expenseDetails: [],
          notes: '',
          previousBalance: balanceToRollOver // The only value kept is the total balance moved to previous
        }
      }));
    }
  };

  const generateSummaryText = () => {
    let text = `📊 *${t.title} - ${formattedDisplayDate}*\n\n`;
    totals.itemsWithTotals.forEach(item => {
      if (item.q250 > 0 || item.q350 > 0) {
        text += `🥤 *${lang === 'BN' ? item.nameBN : item.name}*\n`;
        if (item.q250 > 0) text += `   • 250ml: ${item.q250}\n`;
        if (item.q350 > 0) text += `   • 350ml: ${item.q350}\n`;
        text += `   *Subtotal: ${t.taka}${item.itemTotal}*\n\n`;
      }
    });
    text += `━━━━━━━━━━━━━━━\n`;
    text += `💰 *${t.totalSales}: ${t.taka}${totals.grandTotal}*\n`;
    text += `📥 *${t.purchase}: ${t.taka}${currentDayData.purchase}*\n`;
    text += `💸 *${t.expense}: ${t.taka}${currentDayData.expense}*\n`;
    text += `💵 *${t.cashInHand}: ${t.taka}${cashInHand}*\n`;
    text += `🏦 *${t.previousBalance}: ${t.taka}${currentDayData.previousBalance}*\n`;
    text += `⚖️ *${t.totalBalance}: ${t.taka}${totalBalance}*\n`;
    
    return text;
  };

  return (
    <div className="max-w-xl mx-auto bg-white min-h-screen shadow-2xl flex flex-col relative overflow-hidden text-gray-900 pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <SmoothieLogo className="w-14 h-14" />
             <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight leading-none text-gray-800 uppercase">{t.title}</h1>
                <p className="text-sm font-bold uppercase tracking-widest text-sky-500 mt-1">DAILY SALES</p>
             </div>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-gray-50 text-gray-400 hover:text-sky-500 rounded-2xl transition-all">
            <Settings size={24} />
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-3 bg-sky-500 px-6 py-4 rounded-[2rem] cursor-pointer hover:bg-sky-600 transition-colors relative shadow-xl shadow-sky-100">
          <Calendar size={20} className="text-white" />
          <span className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">{formattedDisplayDate}</span>
          <input type="date" value={currentDate} onChange={(e) => { setCurrentDate(e.target.value); }} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-6 px-4 custom-scrollbar">
        {/* Table Headers */}
        <div className="px-4 mb-3 grid grid-cols-12 gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div className="col-span-5">{t.itemHeader}</div>
          <div className="col-span-2 text-center">{t.q250}</div>
          <div className="col-span-2 text-center">{t.q350}</div>
          <div className="col-span-3 text-right">{t.total}</div>
        </div>
        
        {/* Item Rows */}
        <div className="space-y-3 mb-8">
          {totals.itemsWithTotals.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100">
              <div className="col-span-5">
                <p className="text-sm font-bold text-gray-800 leading-tight">{lang === 'BN' ? item.nameBN : item.name}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{t.taka}{item.price250} | {t.taka}{item.price350}</p>
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  value={item.q250 || ''} 
                  placeholder="0" 
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => updateQty(item.id, 'q250', e.target.value)} 
                  className="qty-input w-full text-center bg-white border border-gray-200 rounded-xl py-2.5 font-black text-gray-800 focus:ring-4 focus:ring-sky-50 focus:border-sky-400 outline-none transition-all" 
                />
              </div>
              <div className="col-span-2">
                <input 
                  type="number" 
                  value={item.q350 || ''} 
                  placeholder="0" 
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => updateQty(item.id, 'q350', e.target.value)} 
                  className="qty-input w-full text-center bg-white border border-gray-200 rounded-xl py-2.5 font-black text-gray-800 focus:ring-4 focus:ring-sky-50 focus:border-sky-400 outline-none transition-all" 
                />
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-black text-sky-600">{t.taka}{item.itemTotal}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Section */}
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
               <span className="text-2xl font-black text-gray-800">{t.taka} {currentDayData.purchase}</span>
             </button>
             <button onClick={() => setDetailModalType('expense')} className="bg-white p-5 rounded-[2rem] border border-gray-100 hover:border-sky-200 transition-all text-left group">
               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1 flex items-center gap-1"><Receipt size={10}/> {t.expense}</label>
               <span className="text-2xl font-black text-gray-800">{t.taka} {currentDayData.expense}</span>
             </button>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${cashInHand < 0 ? 'bg-gray-400' : 'bg-sky-500'}`} />
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.cashInHand}</label>
                <span className={`text-3xl font-black ${cashInHand < 0 ? 'text-gray-400' : 'text-sky-600'}`}>{t.taka} {cashInHand}</span>
              </div>
              <div className={`p-4 rounded-2xl ${cashInHand < 0 ? 'bg-gray-50 text-gray-400' : 'bg-sky-50 text-sky-500'}`}>
                <Wallet size={24} />
              </div>
           </div>

           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden opacity-80">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-gray-300" />
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.previousBalance}</label>
                <span className="text-3xl font-black text-gray-600">{t.taka} {currentDayData.previousBalance}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 text-gray-400">
                <Lock size={24} />
              </div>
           </div>

           {/* Total Balance Field */}
           <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex justify-between items-center relative overflow-hidden opacity-80">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-sky-300" />
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">{t.totalBalance}</label>
                <span className="text-3xl font-black text-sky-600">{t.taka} {totalBalance}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 text-sky-400">
                <Lock size={24} />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={14} />{t.notes}</label>
              <textarea 
                value={currentDayData.notes || ''} 
                onChange={(e) => updateDayData({ notes: e.target.value })} 
                placeholder="..." 
                rows={3} 
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium text-gray-700 outline-none focus:border-sky-400 transition-all resize-none shadow-sm" 
              />
           </div>
        </section>

        <div className="flex gap-4 mb-16">
          <button onClick={handleClearAll} className="flex-1 py-5 bg-gray-200 text-gray-600 font-black rounded-[2rem] shadow-sm flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all text-sm">
            <Trash2 size={20} /> {t.clearAll}
          </button>
          <button onClick={() => setIsShareModalOpen(true)} className="flex-1 py-5 bg-sky-500 text-white font-black rounded-[2rem] shadow-xl shadow-sky-100 flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all text-sm">
            <Share2 size={20} /> {t.share}
          </button>
        </div>
      </main>

      {/* Modals */}
      {detailModalType && (
        <DetailModal 
          type={detailModalType}
          entries={detailModalType === 'purchase' ? (currentDayData.purchaseDetails || []) : (currentDayData.expenseDetails || [])}
          onClose={() => setDetailModalType(null)}
          onSave={(entries) => {
            const total = entries.reduce((sum, e) => sum + e.amount, 0);
            updateDayData({
              [detailModalType === 'purchase' ? 'purchase' : 'expense']: total,
              [detailModalType === 'purchase' ? 'purchaseDetails' : 'expenseDetails']: entries
            });
            setDetailModalType(null);
          }}
          lang={lang}
        />
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-bottom duration-500 flex flex-col pt-[env(safe-area-inset-top)]">
          <header className="p-6 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Settings className="text-sky-500" size={28} />
               <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{t.settings}</h2>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-all"><X size={24} /></button>
          </header>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar pb-32">
            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.languageLabel}</label>
              <button onClick={() => setLang(l => l === 'EN' ? 'BN' : 'EN')} className="w-full py-5 bg-gray-50 rounded-[2rem] flex items-center justify-between px-6 border border-gray-100">
                <div className="flex items-center gap-3"><Globe className="text-sky-500" /> <span className="font-black uppercase tracking-widest">{lang === 'EN' ? 'English' : 'বাংলা'}</span></div>
                <span className="text-sky-500 font-bold underline underline-offset-4">{t.langBtn}</span>
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.previousBalance}</label>
              <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                <input 
                  type="number" 
                  value={currentDayData.previousBalance || ''} 
                  onChange={(e) => updateDayData({ previousBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg font-black focus:border-sky-400 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.editPrice}</label>
              </div>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={item.id} className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 space-y-4 relative">
                    <div className="grid grid-cols-2 gap-3">
                       <input type="text" value={item.name} onChange={(e) => { const n = [...items]; n[idx].name = e.target.value; setItems(n); }} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-sky-400 outline-none" placeholder="Name (EN)" />
                       <input type="text" value={item.nameBN} onChange={(e) => { const n = [...items]; n[idx].nameBN = e.target.value; setItems(n); }} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-sky-400 outline-none" placeholder="Name (BN)" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <input type="number" value={item.price250 || ''} onChange={(e) => { const n = [...items]; n[idx].price250 = parseFloat(e.target.value) || 0; setItems(n); }} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black focus:border-sky-400 outline-none" placeholder="250ml Price" />
                       <input type="number" value={item.price350 || ''} onChange={(e) => { const n = [...items]; n[idx].price350 = parseFloat(e.target.value) || 0; setItems(n); }} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black focus:border-sky-400 outline-none" placeholder="350ml Price" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-gray-900 rounded-[2.5rem] text-center">
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => {
                    const blob = new Blob([JSON.stringify({ history, items, lang })], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `smoothie-backup-${currentDate}.json`; a.click();
                  }} className="py-4 bg-white/10 text-white font-black rounded-2xl border border-white/10 hover:bg-white/20 transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-widest"><Download size={16}/> {t.downloadBackup}</button>
                  <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-white/10 text-white font-black rounded-2xl border border-white/10 hover:bg-white/20 transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-widest"><Upload size={16}/> {t.uploadBackup}</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = (ev) => {
                      try {
                        const d = JSON.parse(ev.target?.result as string);
                        if(d.history) setHistory(d.history);
                        if(d.items) setItems(d.items);
                        alert(t.importSuccess);
                      } catch { alert(t.importError); }
                    };
                    r.readAsText(file);
                  }} />
               </div>
            </div>
          </div>

          <div className="p-6 bg-white border-t border-gray-50">
             <button onClick={() => setIsSettingsOpen(false)} className="w-full py-5 bg-sky-500 text-white font-black rounded-[2rem] shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-3">
               <Save size={20} /> {t.save}
             </button>
          </div>
        </div>
      )}

      {isShareModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom duration-300 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{t.shareVia}</h3>
              <button onClick={() => setIsShareModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(generateSummaryText())}`, '_blank'); setIsShareModalOpen(false); }} className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gray-50 text-sky-600 rounded-3xl flex items-center justify-center group-active:scale-90 transition-all"><MessageCircle size={32} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">WhatsApp</span>
              </button>
              <button onClick={() => { navigator.clipboard.writeText(generateSummaryText()); alert('Summary copied!'); setIsShareModalOpen(false); }} className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gray-50 text-sky-600 rounded-3xl flex items-center justify-center group-active:scale-90 transition-all"><Copy size={32} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Copy Text</span>
              </button>
              <button onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}#report=${btoa(JSON.stringify({date: currentDate, data: currentDayData}))}`;
                navigator.clipboard.writeText(url);
                alert('Link copied!');
                setIsShareModalOpen(false);
              }} className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 bg-gray-50 text-sky-600 rounded-3xl flex items-center justify-center group-active:scale-90 transition-all"><Send size={32} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Magic Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;