export interface AIQueryRequest {
  query: string;
  filters?: {
    country?: string;
    level?: string;
    field?: string;
    maxTuition?: number;
  };
}

export interface AIQueryResponse {
  answer: string;
  programs: Array<{
    id: string;
    name: string;
    institution_name: string;
    country: string;
    level: string;
    tuition_fees: number;
    currency: string;
    match_score: number;
  }>;
  institutions: Array<{
    id: string;
    name: string;
    country: string;
    city: string;
    rating: number;
  }>;
  confidence: number;
}

export async function queryAI(params: AIQueryRequest): Promise<AIQueryResponse> {
  const response = await fetch('/api/ai-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'AI search failed');
  }
  return response.json();
}
