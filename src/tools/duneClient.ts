import log from "loglevel";
import { DuneClient as DuneSDK, ContentType } from "@duneanalytics/client-sdk";

export interface SwapTransaction {
  tx_hash: string;
  chain_id: number;
  block_number: number;
  block_time: number;
  source: "SwapNet" | "0x" | "UniswapX";
  swapper: string;
}

export interface TradeAmount {
  tx_hash: string;
  trade_index: number;
  input_token_address: string;
  input_token_amount: string;
  output_token_address: string;
  liquidity_source: string | null;
}

export class DuneClient {
  private readonly client: DuneSDK;
  private readonly namespace: string;

  constructor(apiKey: string, namespace: string) {
    if (!apiKey) {
      throw new Error("Dune API key is required");
    }
    if (!namespace) {
      throw new Error("Dune namespace is required");
    }
    this.client = new DuneSDK(apiKey);
    this.namespace = namespace;
  }

  async insertData(tableName: string, data: any[]): Promise<void> {
    log.info(`[DuneClient] Inserting ${data.length} records into ${this.namespace}.${tableName}`);

    try {
      const ndjson = data.map(record => JSON.stringify(record)).join('\n');
      const buffer = Buffer.from(ndjson, "utf-8");

      await this.client.uploads.insert({
          namespace: this.namespace,
        table_name: tableName,
        data: buffer,
        content_type: ContentType.NDJson,
      });

      log.info(`[DuneClient] Data inserted successfully`);
    } catch (error) {
      log.error(`[DuneClient] Error inserting data into ${tableName}:`, error);
      throw error;
    }
  }

  async uploadTransactions(transactions: SwapTransaction[]): Promise<void> {
    if (transactions.length === 0) {
      log.info("[DuneClient] No transactions to upload");
      return;
    }

    await this.insertData("swap_transactions", transactions);
  }

  async uploadTradeAmounts(tradeAmounts: TradeAmount[]): Promise<void> {
    if (tradeAmounts.length === 0) {
      log.info("[DuneClient] No trade amounts to upload");
      return;
    }

    await this.insertData("trade_amounts", tradeAmounts);
  }
}

