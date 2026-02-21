export interface MarketplaceModelSummary {
  id: string;
  name: string;
  description: string;
  tags: string[];
  authorName: string;
  createdAt: string;
}

export interface MarketplaceModelDetail extends MarketplaceModelSummary {
  architecture: Record<string, any>;
}

export interface CreateMarketplaceModelRequest {
  name: string;
  description: string;
  tags: string[];
  authorName: string;
  architecture: Record<string, any>;
}
