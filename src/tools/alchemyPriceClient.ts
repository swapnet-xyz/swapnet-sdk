import { axiosWrapper } from "./axiosWrapper.js";
import type { IPriceClient } from "./priceClient.js";

interface AlchemyConfig {
  apiKey: string;
  rateLimit?: number;
}

interface AlchemyHistoricalPriceRequest {
  network?: string;
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

  private getNetworkName(chainId: number): string {
    const networkMap: Record<number, string> = {
      1: "eth-mainnet",
      10: "opt-mainnet",
      137: "polygon-mainnet",
      42161: "arb-mainnet",
      8453: "base-mainnet",
    };
    return networkMap[chainId] || "eth-mainnet";
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
    chainId: number,
    tokenAddress: string,
    timestampSeconds: number,
  ): Promise<number | null> {
    await this.enforceRateLimit();

    try {
      // Convert timestamp to number if it's a string
      const timestampNum = typeof timestampSeconds === 'string' ? parseInt(timestampSeconds, 10) : timestampSeconds;
      
      // Validate timestamp
      if (!timestampNum || timestampNum <= 0 || isNaN(timestampNum)) {
        console.error(
          `Invalid timestamp ${timestampSeconds} for token ${tokenAddress} on chain ${chainId}`,
        );
        return null;
      }
      
      // Alchemy returns prices at start of day (00:00:00Z) only
      // Create a time window that spans at least 2 different days
      const targetDate = new Date(timestampNum * 1000);
      
      // Get start of the day before target
      const dayBefore = new Date(targetDate);
      dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
      dayBefore.setUTCHours(0, 0, 0, 0);
      
      // Get start of the day after target
      const dayAfter = new Date(targetDate);
      dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
      dayAfter.setUTCHours(0, 0, 0, 0);
      
      const startTime = dayBefore.toISOString();
      const endTime = dayAfter.toISOString();

      const requestBody: AlchemyHistoricalPriceRequest = {
        network: this.getNetworkName(chainId),
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
        let minDiff = Math.abs(new Date(data.data[0].timestamp).getTime() / 1000 - timestampNum);

        for (const pricePoint of data.data) {
          const priceTimestamp = new Date(pricePoint.timestamp).getTime() / 1000;
          const diff = Math.abs(priceTimestamp - timestampNum);

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
