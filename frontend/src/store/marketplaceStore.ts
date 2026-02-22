import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MarketplaceStore {
  importedArchitecture: Record<string, any> | null;
  activeModelName: string | null;
  activeModelSource: 'marketplace' | 'local' | null;
  activeModelId: string | null;

  setImportedArchitecture: (arch: Record<string, any>) => void;
  clearImportedArchitecture: () => void;
  setActiveModel: (name: string, source: 'marketplace' | 'local', id?: string) => void;
  clearActiveModel: () => void;
}

export const useMarketplaceStore = create<MarketplaceStore>()(
  persist(
    (set) => ({
      importedArchitecture: null,
      activeModelName: null,
      activeModelSource: null,
      activeModelId: null,

      setImportedArchitecture: (arch) => set({ importedArchitecture: arch }),
      clearImportedArchitecture: () => set({ importedArchitecture: null }),
      setActiveModel: (name, source, id) => set({ activeModelName: name, activeModelSource: source, activeModelId: id ?? null }),
      clearActiveModel: () => set({ activeModelName: null, activeModelSource: null, activeModelId: null }),
    }),
    {
      name: 'marketplace-active-model',
      // Only persist the badge fields — not importedArchitecture (it's transient)
      partialize: (state) => ({
        activeModelName: state.activeModelName,
        activeModelSource: state.activeModelSource,
        activeModelId: state.activeModelId,
      }),
    }
  )
);
