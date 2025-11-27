import log from "loglevel";
import axios from "axios";
import { DuneClient as DuneSDK, ContentType } from "@duneanalytics/client-sdk";
import fs from "fs/promises";

const DUNE_API_BASE_URL = "https://api.dune.com/api/v1";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  private readonly apiKey: string;

  constructor(apiKey: string, namespace: string) {
    if (!apiKey) {
      throw new Error("Dune API key is required");
    }
    if (!namespace) {
      throw new Error("Dune namespace is required");
    }
    this.client = new DuneSDK(apiKey);
    this.namespace = namespace;
    this.apiKey = apiKey;
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

  async uploadCSV(csvFilePath: string, tableName: string): Promise<void> {
    try {
      const csvContent = await fs.readFile(csvFilePath, "utf8");

      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await this.uploadCSVWithRetry(csvContent, tableName);
          return;
        } catch (error) {
          lastError = error as Error;
          log.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * attempt;
            await sleep(delay);
          }
        }
      }

      throw new Error(`Failed to upload after ${MAX_RETRIES} attempts: ${lastError?.message}`);
    } catch (error) {
      log.error(`Error uploading ${csvFilePath}:`, error);
      throw error;
    }
  }

  private async uploadCSVWithRetry(
    csvContent: string,
    tableName: string,
  ): Promise<void> {
    const url = `${DUNE_API_BASE_URL}/table/upload/csv`;

    const payload = {
      namespace: this.namespace,
      data: csvContent,
      table_name: tableName,
      description: `Analytics data upload - ${new Date().toISOString()}`,
      is_private: false,
    };

    const response = await axios.post(url, payload, {
      headers: {
        "X-DUNE-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000,
    });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(
        `Dune API returned status ${response.status}: ${JSON.stringify(response.data)}`,
      );
    }
  }

  async uploadMultipleCSVs(csvFilePaths: string[], tableName: string): Promise<void> {
    for (let i = 0; i < csvFilePaths.length; i++) {
      const filePath = csvFilePaths[i];
      await this.uploadCSV(filePath, tableName);

      if (i < csvFilePaths.length - 1) {
        await sleep(2000);
      }
    }
  }
}

