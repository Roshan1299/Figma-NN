import type { MarketplaceModelSummary, MarketplaceModelDetail, CreateMarketplaceModelRequest } from '../types/marketplace';

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8080";

export async function createMarketplaceModel(req: CreateMarketplaceModelRequest): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/api/marketplace/models`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create marketplace model: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function listMarketplaceModels(): Promise<MarketplaceModelSummary[]> {
  const response = await fetch(`${API_BASE}/api/marketplace/models`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list marketplace models: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function getMarketplaceModel(id: string): Promise<MarketplaceModelDetail> {
  const response = await fetch(`${API_BASE}/api/marketplace/models/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get marketplace model ${id}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}
