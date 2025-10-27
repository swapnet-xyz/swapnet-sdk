export interface IPriceClient {
  getHistoricalPrice(
    tokenAddress: string,
    chainId: number,
    timestamp: number,
  ): Promise<number | null>;
}