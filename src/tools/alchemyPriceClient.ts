import { axiosWrapper } from "./axiosWrapper.js";
import type { IPriceClient } from "./priceClient.js";

interface AlchemyConfig {
  apiKey: string;
  rateLimit?: number;
}

interface AlchemyHistoricalPriceRequest {
  address?: string;
  symbol?: string;
  startTime: string;
  endTime: string;
}

interface AlchemyPricePoint {
  timestamp: string;
  value: string; // API returns value as string, not number
}

interface AlchemyHistoricalPriceResponse {
  symbol?: string;
  currency?: string;
  data: AlchemyPricePoint[];
}

export class AlchemyPriceClient implements IPriceClient {
  private readonly baseUrl = "https://api.g.alchemy.com/prices/v1";
  private readonly apiKey: string;
  private readonly rateLimit: number;
  private lastRequestTime = 0;

  constructor(config: AlchemyConfig) {
    this.apiKey = config.apiKey;
    this.rateLimit = config.rateLimit || 1000; // Default 1 second between requests
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  async getHistoricalPrice(
    tokenAddress: string,
    chainId: number,
    timestamp: number,
  ): Promise<number | null> {
    await this.enforceRateLimit();

    try {
      // Create a time window around the target timestamp
      const startTime = new Date((timestamp - 3600) * 1000).toISOString(); // 1 hour before
      const endTime = new Date((timestamp + 3600) * 1000).toISOString(); // 1 hour after

      const requestBody: AlchemyHistoricalPriceRequest = {
        address: tokenAddress.toLowerCase(),
        startTime,
        endTime,
      };

      const response = await axiosWrapper.sendAsync({
        method: "post",
        path: `/${this.apiKey}/tokens/historical`,
        baseUrl: this.baseUrl,
        headers: {
          "Content-Type": "application/json",
        },
        params: {},
        body: requestBody,
      });

      if (response.status !== 200) {
        console.warn(`Alchemy API returned status ${response.status} for token ${tokenAddress}`);
        return null;
      }

      const data = response.body as AlchemyHistoricalPriceResponse;

      if (data.data && data.data.length > 0) {
        // Find the price closest to the target timestamp
        let closestPrice = data.data[0];
        let minDiff = Math.abs(new Date(data.data[0].timestamp).getTime() / 1000 - timestamp);

        for (const pricePoint of data.data) {
          const priceTimestamp = new Date(pricePoint.timestamp).getTime() / 1000;
          const diff = Math.abs(priceTimestamp - timestamp);

          if (diff < minDiff) {
            minDiff = diff;
            closestPrice = pricePoint;
          }
        }

        return parseFloat(closestPrice.value);
      }

      return null;
    } catch (error) {
      console.error(
        `Error fetching price for ${tokenAddress} on chain ${chainId}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}
