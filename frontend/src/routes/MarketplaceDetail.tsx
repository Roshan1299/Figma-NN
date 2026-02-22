import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMarketplaceModel } from '../api/marketplace';
import type { MarketplaceModelDetail } from '../types/marketplace';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { Identicon } from '../components/Identicon';

export default function MarketplaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setImportedArchitecture = useMarketplaceStore((state) => state.setImportedArchitecture);

  const [model, setModel] = useState<MarketplaceModelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModel() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getMarketplaceModel(id);
        setModel(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch model details');
      } finally {
        setLoading(false);
      }
    }

    fetchModel();
  }, [id]);

  const setActiveModel = useMarketplaceStore((state) => state.setActiveModel);

  const handleImport = () => {
    if (model) {
      setImportedArchitecture(model.architecture);
      setActiveModel(model.name, 'marketplace', id);
      navigate(`/playground/${id}`); // Navigate to the main builder with the imported model's ID
    }
  };

  if (loading) return <div className="p-4">Loading model details...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!model) return <div className="p-4">Model not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col h-full overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex justify-between items-start mb-8 shrink-0 relative z-10 border border-white/10 p-6 rounded-2xl bg-card/40 backdrop-blur-xl shadow-xl">
        <div>
          <h1 className="text-4xl font-bold mb-3 text-white tracking-tight">{model.name}</h1>
          <p className="text-gray-300 mb-4 text-lg max-w-2xl leading-relaxed">{model.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {model.tags?.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 text-white/90 text-sm rounded-lg backdrop-blur">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Identicon name={model.authorName} size={32} />
            <span>
              Published by <span className="font-medium text-white">{model.authorName}</span> on {new Date(model.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric'})}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleImport}
          className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 bg-primary rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-y-0.5">
            <polyline points="8 17 12 21 16 17"></polyline>
            <line x1="12" y1="12" x2="12" y2="21"></line>
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
          </svg>
          Import to Builder
        </button>
      </div>

      <div className="flex-1 relative z-10 border border-white/10 rounded-2xl bg-[#0a0a0c]/80 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
        {model.previewImage ? (
          <>
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 tracking-wider">Architecture Preview</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-6 bg-black/40">
              <img
                src={model.previewImage}
                alt={`${model.name} architecture`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
              />
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 tracking-wider">architecture.json</h3>
            </div>
            <pre className="flex-1 p-6 text-sm text-gray-300 overflow-auto font-mono selection:bg-primary/30">
              <code className="block">{JSON.stringify(model.architecture, null, 2)}</code>
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
