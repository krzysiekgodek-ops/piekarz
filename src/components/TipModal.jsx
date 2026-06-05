import React from 'react';
import DOMPurify from 'dompurify';
import { ArrowLeft, Edit3, Trash2, Lightbulb } from 'lucide-react';

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    let videoId = null;
    if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v');
    } else if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1);
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  } catch {}
  return null;
};

const TIP_CONTENT_STYLES = `
  .tip-content h1 {
    font-size: 1.25rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    margin: 1rem 0 0.5rem;
    color: var(--text);
  }
  .tip-content h2 {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0.875rem 0 0.375rem;
    color: var(--text);
  }
  .tip-content p {
    margin-bottom: 0.5rem;
    line-height: 1.75;
    color: var(--text);
  }
  .tip-content ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .tip-content ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
  .tip-content li {
    margin-bottom: 0.25rem;
    color: var(--text);
    line-height: 1.6;
  }
  .tip-content strong { font-weight: 800; }
  .tip-content em { font-style: italic; }
  .tip-content u { text-decoration: underline; }
`;

const TipModal = ({ tip, userProfile, onBack, onEdit, onDelete }) => {
  if (!tip) return null;

  const embedUrl = getYouTubeEmbedUrl(tip.videoUrl);
  const sanitizedContent = DOMPurify.sanitize(tip.content || '');

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <style>{TIP_CONTENT_STYLES}</style>

      {/* Nagłówek */}
      <div className="bg-[var(--bg)] px-4 pt-4 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[var(--text-dim)] text-[11px] font-black uppercase tracking-wider mb-4"
        >
          <ArrowLeft size={14} /> Wróć do porad
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb size={13} style={{ color: '#c8860a' }} className="flex-none" />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#c8860a' }}>
                Porada
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-[var(--text)] leading-tight break-words">
              {tip.title}
            </h1>
          </div>

          {/* Przyciski admina */}
          {userProfile?.isAdmin && (
            <div className="flex gap-2 flex-none mt-1">
              <button
                onClick={() => onEdit(tip)}
                className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => onDelete(tip)}
                className="p-2.5 rounded-xl bg-red-600/10 border border-red-900/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zdjęcie */}
      {tip.imageUrl && (
        <div className="w-full aspect-video overflow-hidden">
          <img
            src={tip.imageUrl}
            alt={tip.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Treść */}
      <div className="px-4 py-5">
        {sanitizedContent ? (
          <div
            className="tip-content text-sm"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        ) : (
          <p className="text-[var(--text-dim)] text-sm italic">Brak treści</p>
        )}
      </div>

      {/* Embed YouTube */}
      {embedUrl && (
        <div className="px-4 pb-6">
          <div className="rounded-2xl overflow-hidden border border-[var(--border)] aspect-video">
            <iframe
              src={embedUrl}
              title={tip.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TipModal;
