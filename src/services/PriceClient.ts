export interface TokenPrice {
  tokenAddress: string;
  timestamp: number;
  priceUsd: number;
  error?: string;
}

export class PriceClient {
  constructor() {
    // Mock client, no configuration needed
  }

  async getTokenPriceAtTimestamp(
    _chainId: number,
    _tokenAddress: string,
    _timestamp: number,
  ): Promise<number> {
    // Mock implementation: always return 1
    return 1;
  }

  async getBatchTokenPrices(
    _chainId: number,
    tokens: Array<{ address: string; timestamp: number }>,
  ): Promise<TokenPrice[]> {
    const results: TokenPrice[] = [];

    for (const token of tokens) {
      results.push({
        tokenAddress: token.address,
        timestamp: token.timestamp,
        priceUsd: 1, // Mock price
      });
    }

    return results;
  }
}
