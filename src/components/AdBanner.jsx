import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, FileText, X } from 'lucide-react';

const tsToMs = (ts) => {
  if (!ts) return null;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  return null;
};

const AdBanner = ({ ads, calculatorId }) => {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  const now = Date.now();

  const activeAds = useMemo(() => {
    return ads.filter(ad => {
      if (!ad.active) return false;
      if (dismissed.has(ad.id)) return false;
      const start = tsToMs(ad.startDate);
      const end   = tsToMs(ad.endDate);
      if (start && now < start) return false;
      if (end   && now > end)   return false;
      if (calculatorId && ad.calculators?.length > 0 && !ad.calculators.includes(calculatorId)) return false;
      return true;
    });
  }, [ads, dismissed, now, calculatorId]);

  useEffect(() => {
    if (index >= activeAds.length && activeAds.length > 0) setIndex(0);
  }, [activeAds.length]);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % activeAds.length);
        setVisible(true);
      }, 350);
    }, 5000);
    return () => clearInterval(id);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;

  const ad = activeAds[index % activeAds.length];
  const isPdf = ad.targetUrl?.toLowerCase().endsWith('.pdf');
  const hasLink = !!ad.targetUrl;
  const title = ad.title || ad.content || '';

  const handleClick = () => {
    if (hasLink) window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`relative mx-4 mt-3 rounded-2xl overflow-hidden border border-[var(--border)] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'} ${hasLink ? 'cursor-pointer' : ''}`}
      onClick={hasLink ? handleClick : undefined}
      style={{ background: 'var(--bg-card)' }}
    >
      {ad.imageUrl && (
        <div className="relative w-full" style={{ height: '140px' }}>
          <img
            src={ad.imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          {title && (
            <div className="absolute inset-0 flex flex-col justify-end p-4 gap-1">
              <p className="text-sm font-black text-white uppercase tracking-wide leading-tight drop-shadow">{title}</p>
              {hasLink && (
                <div className="flex items-center gap-1 text-[var(--text-dim)] text-[10px] font-bold">
                  {isPdf ? <FileText size={10} /> : <ExternalLink size={10} />}
                  <span>{isPdf ? 'Otwórz PDF' : 'Dowiedz się więcej'}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!ad.imageUrl && (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#c8860a' }} />
          <p className="text-xs font-black uppercase tracking-wide text-[var(--text)] flex-1 leading-tight">{title}</p>
          {hasLink && (
            <span className="text-[var(--text-dim)] shrink-0">
              {isPdf ? <FileText size={13} /> : <ExternalLink size={13} />}
            </span>
          )}
        </div>
      )}

      <button
        onClick={e => { e.stopPropagation(); setDismissed(prev => new Set([...prev, ad.id])); }}
        className="absolute top-2 right-2 p-1 bg-black/40 text-white rounded-full hover:bg-black/70 transition-colors"
      >
        <X size={11} />
      </button>

      {activeAds.length > 1 && (
        <div className="absolute bottom-2 right-8 flex gap-1">
          {activeAds.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === index % activeAds.length ? 'bg-white' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdBanner;
