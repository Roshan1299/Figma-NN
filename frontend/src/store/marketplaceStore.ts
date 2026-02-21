import { create } from 'zustand';

interface MarketplaceStore {
  importedArchitecture: Record<string, any> | null;
  activeModelName: string | null;
  activeModelSource: 'marketplace' | 'local' | null;

  setImportedArchitecture: (arch: Record<string, any>) => void;
  clearImportedArchitecture: () => void;
  setActiveModel: (name: string, source: 'marketplace' | 'local') => void;
  clearActiveModel: () => void;
}

export const useMarketplaceStore = create<MarketplaceStore>((set) => ({
  importedArchitecture: null,
  activeModelName: null,
  activeModelSource: null,

  setImportedArchitecture: (arch) => set({ importedArchitecture: arch }),
  clearImportedArchitecture: () => set({ importedArchitecture: null }),
  setActiveModel: (name, source) => set({ activeModelName: name, activeModelSource: source }),
  clearActiveModel: () => set({ activeModelName: null, activeModelSource: null }),
}));
