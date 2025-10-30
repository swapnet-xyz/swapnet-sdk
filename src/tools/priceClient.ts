export interface IPriceClient {
  getHistoricalPrice(
    chainId: number,
    tokenAddress: string,
    timestampSeconds: number,
  ): Promise<number | null>;
}
