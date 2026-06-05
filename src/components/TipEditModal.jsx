import React, { useState } from 'react';
import { X, Upload, Save } from 'lucide-react';
import { MYDEVIL_URL } from '../firebase';
import RichTextEditor from './RichTextEditor';

const EMPTY_TIP = {
  title: '',
  content: '',
  imageUrl: '',
  videoUrl: '',
};

const TipEditModal = ({ user, initialTip, onClose, onSave }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_TIP,
    ...(initialTip || {}),
  }));
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      return alert('Dozwolone formaty: JPG, PNG, WEBP.');
    if (file.size > 5 * 1024 * 1024)
      return alert('Plik jest za duży. Maksymalny rozmiar to 5 MB.');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(MYDEVIL_URL, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setForm(prev => ({ ...prev, imageUrl: data.url }));
    } catch {
      alert('Błąd uploadu.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputCls =
    'w-full p-4 border-2 border-[var(--border)] rounded-2xl font-bold bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-dim)] outline-none focus:border-[#c8860a] transition-colors';

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in zoom-in-95 duration-200"
      style={{ background: 'var(--bg-overlay)' }}
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[3rem] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-7 right-7 p-2 bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--text)] mb-8 leading-none">
          {initialTip?.id ? 'Edytuj poradę' : 'Nowa porada'}
        </h2>

        <div className="space-y-5 text-left">
          {/* Tytuł */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-3">Tytuł</p>
            <input
              placeholder="Np. Jak dobrze wyrobić ciasto chlebowe"
              className={inputCls}
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Treść */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-3">Treść porady</p>
            <RichTextEditor
              value={form.content}
              onChange={val => setForm(prev => ({ ...prev, content: val }))}
              placeholder="Napisz poradę..."
            />
          </div>

          {/* Link YouTube */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-3">Link do YouTube (opcjonalnie)</p>
            <input
              placeholder="https://youtube.com/watch?v=..."
              className={inputCls}
              value={form.videoUrl}
              onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
            />
          </div>

          {/* Zdjęcie */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-[var(--text-dim)] uppercase ml-3">Zdjęcie (opcjonalnie)</p>
            <div className="bg-[var(--bg)] p-5 rounded-2xl border-2 border-dashed border-[var(--border)] text-center min-h-[110px] flex items-center justify-center relative overflow-hidden text-[var(--text-dim)]">
              {form.imageUrl ? (
                <>
                  <img
                    src={form.imageUrl}
                    className="w-full h-36 object-cover rounded-xl shadow-lg"
                    alt="Podgląd"
                  />
                  <button
                    onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer w-full">
                  <Upload size={32} className="mx-auto mb-2 opacity-30" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {isUploading ? 'Wgrywanie...' : 'Wgraj zdjęcie'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => form.title.trim() && onSave(form)}
          disabled={!form.title.trim()}
          className="w-full mt-6 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white"
          style={form.title.trim() ? { background: '#c8860a', boxShadow: '0 8px 24px rgba(200,134,10,0.35)' } : { background: 'var(--bg-input)', color: 'var(--text-dim)' }}
        >
          <Save className="inline mr-2" size={16} /> Zapisz poradę
        </button>
      </div>
    </div>
  );
};

export default TipEditModal;
