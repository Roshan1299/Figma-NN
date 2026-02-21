export interface MarketplaceModelSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  authorName: string;
  createdAt: string;
  architecture: Record<string, any>;
  previewImage: string | null;
}

export type MarketplaceModelDetail = MarketplaceModelSummary;

export interface CreateMarketplaceModelRequest {
  name: string;
  description: string;
  tags: string[];
  authorName: string;
  architecture: Record<string, any>;
  previewImage?: string;
}
