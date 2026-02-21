import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMarketplaceModels } from '../api/marketplace';
import type { MarketplaceModelSummary } from '../types/marketplace';

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

  if (loading) return <div className="p-4">Loading marketplace...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Model Marketplace</h1>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card/30 backdrop-blur-md rounded-2xl border border-white/5">
          <p className="text-lg">No models found in the marketplace.</p>
          <p className="text-sm mt-2 opacity-80">Be the first to publish one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {models.map((model) => (
            <Link 
              key={model.id} 
              to={`/marketplace/${model.id}`}
              className="group flex flex-col p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:border-primary/50 hover:shadow-[0_8px_32px_0_rgba(139,92,246,0.2)] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
              
              <h2 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors pr-8">
                {model.name}
              </h2>
              
              <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>

              <p className="text-sm text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                {model.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {model.tags?.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white/80 text-xs rounded-lg backdrop-blur shadow-[inset_0_1px_rgba(255,255,255,0.1)] group-hover:border-primary/30 transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="text-xs text-gray-400 flex items-center justify-between mt-auto pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-[10px] text-white font-bold opacity-80">
                    {model.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[120px]">{model.authorName}</span>
                </div>
                <span className="whitespace-nowrap shrink-0 opacity-70">
                  {new Date(model.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
