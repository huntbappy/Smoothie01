import React, { useRef, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { DetailEntry } from '../types';

interface DetailModalProps {
  type: 'purchase' | 'expense';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black uppercase tracking-tight text-black">
            {lang === 'EN' ? (type === 'purchase' ? 'Inventory Details' : 'Expense Details') : (type === 'purchase' ? 'ইনভেন্টরি ডিটেইলস' : 'ব্যয় ডিটেইলস')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-gray-200">
            <X size={24} className="text-gray-400" />
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
                className={`detail-input flex-1 border border-gray-200 rounded-2xl px-4 py-3 font-medium outline-none transition-all text-black ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:ring-4 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              <input
                type="number"
                value={entry.amount || ''}
                readOnly={readOnly}
                onKeyDown={handleKeyDown}
                onChange={(e) => updateRow(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={`detail-input w-24 border border-gray-200 rounded-2xl px-4 py-3 font-black text-center outline-none transition-all text-black ${readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:ring-4 focus:ring-sky-100 focus:border-sky-400'}`}
              />
              {!readOnly && (
                <button onClick={() => removeRow(entry.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <button onClick={addRow} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-lemongreen-300 hover:text-lemongreen-500 transition-all flex items-center justify-center gap-2">
              <Plus size={20} /> {lang === 'EN' ? 'Add Row' : 'নতুন রো'}
            </button>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-gray-200 text-black font-black rounded-2xl hover:bg-gray-100 transition-all">
            {readOnly ? (lang === 'EN' ? 'Close' : 'বন্ধ করুন') : (lang === 'EN' ? 'Cancel' : 'বাতিল')}
          </button>
          {!readOnly && (
            <button onClick={() => onSave(localEntries)} className="flex-1 py-4 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-2">
              <Save size={20} /> {lang === 'EN' ? 'Save' : 'সেভ করুন'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;