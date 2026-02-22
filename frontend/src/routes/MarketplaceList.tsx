import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMarketplaceModels } from '../api/marketplace';
import type { MarketplaceModelSummary } from '../types/marketplace';
import { ArchitecturePreview } from '../components/ArchitecturePreview';
import { Identicon } from '../components/Identicon';

export default function MarketplaceList() {
  const [models, setModels] = useState<MarketplaceModelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);
        const data = await listMarketplaceModels();
        setModels(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 opacity-40">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted-foreground">Loading marketplace…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-6xl mx-auto pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {models.length} {models.length === 1 ? 'model' : 'models'} published
          </p>
        </div>

        {models.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-white/5 bg-white/[0.03]">
            <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-base font-medium text-white/40">No models yet</p>
            <p className="text-sm text-white/25 mt-1">Be the first to publish one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: MarketplaceModelSummary }) {
  return (
    <Link
      to={`/marketplace/${model.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-white/8 bg-white/[0.04] hover:border-white/20 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Image — fills most of the card */}
      <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
        {model.previewImage ? (
          <img
            src={model.previewImage}
            alt={model.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-3 py-4">
            <ArchitecturePreview architecture={model.architecture} />
          </div>
        )}

        {/* Hover overlay — slides up from bottom */}
        <div className="absolute inset-0 flex flex-col justify-end translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <div
            className="px-3 pt-6 pb-3 flex flex-col gap-2"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 70%, transparent)' }}
          >
            {model.description && (
              <p className="text-[12px] text-white/75 leading-relaxed line-clamp-3">
                {model.description}
              </p>
            )}

            {model.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {model.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <Identicon name={model.authorName} size={16} />
                <span className="text-[11px] text-white/50 truncate max-w-[90px]">{model.authorName}</span>
              </div>
              <span className="text-[10px] text-white/35 shrink-0">
                {new Date(model.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Title below image */}
      <div className="px-3 py-2.5">
        <p className="text-[13px] font-semibold text-white/90 leading-tight truncate group-hover:text-white transition-colors">
          {model.name}
        </p>
      </div>
    </Link>
  );
}
