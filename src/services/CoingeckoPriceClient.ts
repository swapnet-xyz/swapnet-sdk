import https from "https";
import type { IPriceClient } from "./PriceClient.js";

interface CoingeckoConfig {
  apiKey?: string;
  rateLimit?: number;
}

const CHAIN_ID_TO_PLATFORM: Record<number, string> = {
  1: "ethereum",
  56: "binance-smart-chain",
  137: "polygon-pos",
  42161: "arbitrum-one",
  10: "optimistic-ethereum",
  8453: "base",
  43114: "avalanche",
};

export class CoingeckoPriceClient implements IPriceClient {
  private readonly baseUrl = "https://api.coingecko.com/api/v3";
  private readonly rateLimit: number;
  private lastRequestTime = 0;

  constructor(config?: CoingeckoConfig) {
    this.rateLimit = config?.rateLimit || 1000; // Default 1 second between requests
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimit) {
      await this.sleep(this.rateLimit - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  private getPlatform(chainId: number): string | null {
    return CHAIN_ID_TO_PLATFORM[chainId] || null;
  }

  private httpsGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else if (res.statusCode === 404) {
              resolve("{}");
            } else {
              reject(new Error(`API returned status ${res.statusCode}`));
            }
          });
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  }

  async getHistoricalPrice(
    tokenAddress: string,
    chainId: number,
    timestamp: number,
  ): Promise<number | null> {
    await this.enforceRateLimit();

    const platform = this.getPlatform(chainId);
    if (!platform) {
      console.warn(`Unsupported chain ID: ${chainId}`);
      return null;
    }

    try {
      // CoinGecko requires a time range for historical data
      const from = timestamp - 86400; // 24 hours before
      const to = timestamp + 86400; // 24 hours after

      const url = `${this.baseUrl}/coins/${platform}/contract/${tokenAddress.toLowerCase()}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;

      const data = await this.httpsGet(url);
      const json = JSON.parse(data);

      if (json.prices && json.prices.length > 0) {
        // Find the price closest to the target timestamp
        let closestPrice = json.prices[0];
        let minDiff = Math.abs(json.prices[0][0] / 1000 - timestamp);

        for (const pricePoint of json.prices) {
          const priceTimestamp = pricePoint[0] / 1000; // Convert ms to seconds
          const diff = Math.abs(priceTimestamp - timestamp);

          if (diff < minDiff) {
            minDiff = diff;
            closestPrice = pricePoint;
          }
        }
        console.log("closestPrice", closestPrice);
        return closestPrice[1]; // Price in USD
      }

      return null; // No price data found
    } catch (error) {
      console.error(
        `Error fetching price for ${tokenAddress} on chain ${chainId}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  /**
   * Get current token price (convenience method)
   */
  async getCurrentPrice(tokenAddress: string, chainId: number): Promise<number | null> {
    await this.enforceRateLimit();

    const platform = this.getPlatform(chainId);
    if (!platform) {
      console.warn(`Unsupported chain ID: ${chainId}`);
      return null;
    }

    try {
      const url = `${this.baseUrl}/simple/token_price/${platform}?contract_addresses=${tokenAddress.toLowerCase()}&vs_currencies=usd`;

      const data = await this.httpsGet(url);
      const json = JSON.parse(data);

      const tokenKey = Object.keys(json)[0];
      const price = tokenKey ? json[tokenKey].usd : null;

      return price || null;
    } catch (error) {
      console.error(
        `Error fetching current price for ${tokenAddress} on chain ${chainId}:`,
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }
}

