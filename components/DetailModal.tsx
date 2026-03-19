import React, { useRef, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { DetailEntry } from '../types';

interface DetailModalProps {
  type: 'purchase' | 'expense' | 'adjustAmount';
  entries: DetailEntry[];
  onClose: () => void;
  onSave: (entries: DetailEntry[]) => void;
  lang: 'EN' | 'BN';
  readOnly?: boolean;
}

const DetailModal: React.FC<DetailModalProps> = ({ type, entries, onClose, onSave, lang, readOnly = false }) => {
  const [localEntries, setLocalEntries] = React.useState<DetailEntry[]>(
    entries.length > 0 ? entries : [{ id: '1', description: '', amount: 0 }]
  );

  const firstInputRef = useRef<HTMLInputElement>(null);

  const getTitle = () => {
    if (lang === 'EN') {
      if (type === 'purchase') return 'Inventory Details';
      if (type === 'expense') return 'Expense Details';
      return 'Adjustment Details';
    } else {
      if (type === 'purchase') return 'ইনভেন্টরি ডিটেইলস';
      if (type === 'expense') return 'ব্যয় ডিটেইলস';
      return 'অ্যাডজাস্টমেন্ট ডিটেইলস';
    }
  };

  useEffect(() => {
    if (!readOnly) {
      const timer = setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [readOnly]);

  const addRow = () => {
    if (readOnly) return;
    setLocalEntries([...localEntries, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  const removeRow = (id: string) => {
    if (readOnly) return;
    setLocalEntries(localEntries.filter(e => e.id !== id));
  };

  const updateRow = (id: string, field: keyof DetailEntry, value: any) => {
    if (readOnly) return;
    setLocalEntries(localEntries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('.detail-input')) as HTMLInputElement[];
      const currentIndex = inputs.indexOf(e.currentTarget);
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
        inputs[currentIndex + 1].select();
      } else if (currentIndex === inputs.length - 1) {
        addRow();
        setTimeout(() => {
          const newInputs = Array.from(document.querySelectorAll('.detail-input')) as HTMLInputElement[];
          newInputs[currentIndex + 1].focus();
        }, 50);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="water-drop w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-black uppercase tracking-tight text-white neon-text-white">
            {getTitle()}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/20">
            <X size={24} className="text-white/40" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {localEntries.map((entry, index) => (
            <div key={entry.id} className="flex gap-2 items-center">
              <input
                ref={index === 0 ? firstInputRef : null}
                type="text"
                value={entry.description}
                readOnly={readOnly}
                onKeyDown={handleKeyDown}
                onChange={(e) => updateRow(entry.id, 'description', e.target.value)}
                placeholder={lang === 'EN' ? 'Description' : 'বিবরণ'}
                className={`detail-input flex-1 water-drop-field px-4 py-3 font-medium outline-none transition-all text-center ${readOnly ? 'opacity-50 cursor-not-allowed' : 'focus:border-sky-400'}`}
              />
              <input
                type="number"
                value={entry.amount || ''}
                readOnly={readOnly}
                onKeyDown={handleKeyDown}
                onChange={(e) => updateRow(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={`detail-input w-24 water-drop-field px-4 py-3 font-black text-center outline-none transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : 'focus:border-sky-400'}`}
              />
              {!readOnly && (
                <button onClick={() => removeRow(entry.id)} className="p-3 text-white/20 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-white/40 font-bold hover:border-sky-500/50 hover:text-sky-400 transition-all flex items-center justify-center gap-2 bg-white/5">
              <Plus size={20} /> <span className="neon-text-white opacity-60">{lang === 'EN' ? 'Add Row' : 'নতুন রো'}</span>
            </button>
          )}
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-white/5 border border-white/10 text-white/60 font-black rounded-2xl hover:bg-white/10 transition-all">
            <span className="neon-text-white opacity-80">{readOnly ? (lang === 'EN' ? 'Close' : 'বন্ধ করুন') : (lang === 'EN' ? 'Cancel' : 'বাতিল')}</span>
          </button>
          {!readOnly && (
            <button onClick={() => onSave(localEntries)} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:bg-sky-600 transition-all flex items-center justify-center gap-2">
              <Save size={20} /> <span className="neon-text-white">{lang === 'EN' ? 'Save' : 'সেভ করুন'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;