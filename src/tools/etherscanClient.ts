import crypto from "crypto";
import log from "loglevel";
import { axiosWrapper, type IRequest } from "./axiosWrapper.js";
import { sleep } from "../utils.js";

type ResolveFunc = (etherScanResult: any) => void;
type RejectFunc = (error: Error) => void;

export interface AssetTransferData {
  uid: string;
  chainId: number;
  blockNumber: number;
  timestamp: number;
  txHash: string;
  from: string;
  to: string | null;
  category: "external" | "erc20" | "internal";
  asset: {
    value: string;
    address: string | null;
    decimals: number;
    displayName: string;
  };
}

export interface TransactionData {
  chainId: number;
  hash: string;
  from: string;
  nonce: number;
  blockNumber: number;
  indexInBlock: number;
  timestamp: number;
  to: string | null;
  value: string;
  inputData: string;
  status: number;
  gasUsed: string;
  gasPrice: string;
  contractAddress: string | null;
}

type EtherScanErc20Transfer = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
};

type EtherScanInternalTransfer = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  input: string;
  type: string;
  gas: string;
  gasUsed: string;
  traceId: string;
  isError: string;
  errCode: string;
};

type EtherScanTransaction = {
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  methodId: string;
  functionName: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  txreceipt_status: string;
  gasUsed: string;
  confirmations: string;
  isError: string;
};

const convertEtherScanInternalTransferToAssetTransferData = (
  chainId: number,
  internalTransfer: EtherScanInternalTransfer,
): AssetTransferData | null => {
  const { blockNumber, timeStamp, hash, from, to, value, isError, traceId } = internalTransfer;

  if (isError !== "0") {
    return null;
  }

  return {
    uid: `${hash.toLowerCase()}:internal:${traceId}`,
    chainId,
    blockNumber: Number(blockNumber),
    timestamp: Number(timeStamp),
    txHash: hash.toLowerCase(),
    from: from.toLowerCase(),
    to: to === "" ? null : to.toLowerCase(),
    category: "internal",
    asset: {
      value: value.toString(),
      address: null,
      decimals: 18,
      displayName: "ETH",
    },
  };
};

const convertEtherScanErc20TransferToAssetTransferData = (
  chainId: number,
  uid: string,
  erc20TransferData: EtherScanErc20Transfer,
): AssetTransferData => {
  const {
    blockNumber,
    timeStamp,
    hash,
    from,
    to,
    value,
    contractAddress,
    tokenSymbol,
    tokenDecimal,
  } = erc20TransferData;

  return {
    uid,
    chainId,
    blockNumber: Number(blockNumber),
    timestamp: Number(timeStamp),
    txHash: hash.toLowerCase(),
    from: from.toLowerCase(),
    to: to === "" ? null : to.toLowerCase(),
    category: "erc20",
    asset: {
      value: value.toString(),
      address: contractAddress.toLowerCase(),
      decimals: Number(tokenDecimal),
      displayName: tokenSymbol,
    },
  };
};

const convertEtherScanTxToTransactionData = (
  chainId: number,
  txData: EtherScanTransaction,
): [TransactionData, AssetTransferData | null] => {
  const txEntity: TransactionData = {
    chainId,
    hash: txData.hash.toLowerCase(),
    from: txData.from.toLowerCase(),
    nonce: Number(txData.nonce),
    blockNumber: Number(txData.blockNumber),
    indexInBlock: Number(txData.transactionIndex),
    timestamp: Number(txData.timeStamp),
    to: txData.to === "" ? null : txData.to.toLowerCase(),
    value: txData.value,
    inputData: txData.input,
    status: Number(txData.txreceipt_status),
    gasUsed: txData.gasUsed,
    gasPrice: txData.gasPrice,
    contractAddress: txData.contractAddress === "" ? null : txData.contractAddress.toLowerCase(),
  };

  let assetTransfer: AssetTransferData | null = null;
  if (BigInt(txEntity.value) > 0n && txEntity.status === 1) {
    assetTransfer = {
      uid: `${txEntity.hash}:external`,
      chainId,
      blockNumber: txEntity.blockNumber,
      timestamp: txEntity.timestamp,
      txHash: txEntity.hash,
      from: txEntity.from,
      to: txEntity.to,
      category: "external",
      asset: {
        value: txEntity.value,
        address: null,
        decimals: 18,
        displayName: "ETH",
      },
    };
  }

  return [txEntity, assetTransfer];
};

const calculatePartialUid = (erc20TransferData: EtherScanErc20Transfer): string => {
  const { hash, from, contractAddress, to, value } = erc20TransferData;

  const transferHash = crypto
    .createHash("sha1")
    .update(
      `${from.toLowerCase()}:${contractAddress.toLowerCase()}:${to.toLowerCase()}:${value.toLowerCase()}`,
    )
    .digest("hex");
  return `${hash.toLowerCase()}:erc20:${transferHash.slice(0, 8)}`;
};

export class EtherscanClient {
  private readonly _requestQueue: [IRequest, ResolveFunc, RejectFunc][] = [];
  private _isProcessing: boolean = false;

  constructor(
    private readonly _baseUrl: string,
    private readonly _apiKey: string,
    private readonly _waitIntervalMs: number = 250,
    private readonly _maxRetries: number = 3,
  ) {}

  private async _startProcessingQueueAsync(): Promise<void> {
    if (this._isProcessing) {
      throw new Error("Already processing the queue.");
    }

    this._isProcessing = true;

    while (this._requestQueue.length > 0) {
      const [request, resolve, reject] = this._requestQueue.shift()!;
      try {
        const { status: httpStatus, body } = await axiosWrapper.sendAsync(request);
        if (httpStatus !== 200) {
          reject(new Error(`EtherScan request failed with HTTP status ${httpStatus}`));
          continue;
        }

        if (body === undefined) {
          reject(new Error("EtherScan response body is undefined"));
          continue;
        }

        const { status, message, result } = body;
        
        // For proxy module endpoints, status and message might be undefined
        // Just check if result exists
        if (result === undefined) {
          reject(new Error("EtherScan response result is undefined"));
          continue;
        }
        
        // If status/message are present, validate them
        if (status !== undefined && message !== undefined) {
          if (status !== "1" || message !== "OK") {
            if (
              status !== "0" &&
              message !== "No transactions found" &&
              !(Array.isArray(result) && result.length === 0)
            ) {
              reject(
                new Error(
                  `EtherScan request failed with status ${status}: ${message} ${JSON.stringify(result)}`,
                ),
              );
              continue;
            }

            // Normalize "No transactions found" to empty array
            if (status === "0" && message === "No transactions found") {
              resolve([]);
              continue;
            }
          }
        }

        resolve(result);
      } catch (error) {
        reject(error as Error);
      }
      await sleep(this._waitIntervalMs);
    }

    this._isProcessing = false;
  }

  private async _sendAsync(params: Record<string, any>): Promise<any> {
    // Routescan already includes /v2/ in the base URL, so only append /api
    const path = this._baseUrl.includes('/v2/') ? '/api' : '/v2/api';
    
    const request: IRequest = {
      method: "get",
      baseUrl: this._baseUrl,
      path, 
      headers: {
        accept: "application/json",
      },
      params: {
        ...params,
        apikey: this._apiKey,
      },
    };

    const promise: Promise<any> = new Promise<any>((resolve, reject) => {
      this._requestQueue.push([request, resolve, reject]);
    });

    if (!this._isProcessing) {
      this._startProcessingQueueAsync();
    }

    return promise;
  }

  private async _retrySendAndValidateAsync(
    params: Record<string, any>,
    validate: (result: any) => void,
  ): Promise<any> {
    for (let i = 0; i < this._maxRetries; i++) {
      try {
        const result = await this._sendAsync(params);
        validate(result);
        return result;
      } catch (error) {
        if (i === this._maxRetries - 1) {
          throw error;
        }
        const secondsToWait = 2 ** i;
        log.debug(`[EtherScan] Retrying after ${secondsToWait} seconds on error ${error}...`);
        await sleep(1000 * secondsToWait);
      }
    }
  }

  private async _getTransfersForAccountAsync(
    chainId: number,
    accountAddress: string,
    startBlockInclusive: number,
    endBlockExclusive: number,
    action: "tokentx" | "txlistinternal" | "txlist",
    validateTransfer: (transfer: any) => void,
  ): Promise<any[]> {
    if (startBlockInclusive < 0 || endBlockExclusive < 0 || startBlockInclusive >= endBlockExclusive) {
      throw new Error(`Invalid block range [${startBlockInclusive}, ${endBlockExclusive})`);
    }

    if (startBlockInclusive === 0) {
      throw new Error(
        `Start block ${startBlockInclusive} is not allowed as EtherScan API might behave unexpectedly`,
      );
    }

    if (!(await this.isBlockIndexedAsync(chainId, endBlockExclusive))) {
      throw new Error(`End block ${endBlockExclusive} might not be fully indexed`);
    }

    let transfersName: string;
    switch (action) {
      case "tokentx":
        transfersName = "ERC20Transfers";
        break;
      case "txlistinternal":
        transfersName = "InternalTransfers";
        break;
      case "txlist":
        transfersName = "Transactions";
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    const offset = 10000;
    const result = [];
    let nextStartBlock = startBlockInclusive;

    while (true) {
      let pageResult: any[];

      try {
        pageResult = await this._retrySendAndValidateAsync(
          {
            chainId,
            module: "account",
            action,
            address: accountAddress,
            startblock: nextStartBlock,
            endblock: endBlockExclusive - 1,
            page: 1,
            offset,
            sort: "asc",
          },
          (rawResult) => {
            if (!Array.isArray(rawResult)) {
              throw new Error(`${transfersName} list is not an array`);
            }

            rawResult.forEach((transfer) => {
              if (typeof transfer !== "object") {
                throw new Error(`${transfersName} item is not an object`);
              }

              const blockNumber = Number(transfer.blockNumber);
              if (
                isNaN(blockNumber) ||
                blockNumber < startBlockInclusive ||
                blockNumber >= endBlockExclusive
              ) {
                throw new Error(
                  `Invalid block number ${blockNumber} for ${transfersName} item: ${transfer.hash}`,
                );
              }

              validateTransfer(transfer);
            });
          },
        );
      } catch (error) {
        // If result is not an array (API returned error string/object), treat as no data and return empty array
        if (error instanceof Error && error.message.includes('list is not an array')) {
          log.warn(`[EtherScan] ${error.message}, treating as empty result for range [${nextStartBlock}, ${endBlockExclusive})`);
          pageResult = [];
        } else {
          throw error;
        }
      }

      if (pageResult.length < offset) {
        result.push(...pageResult);
        log.debug(
          `[EtherScan] Retrieved ${pageResult.length} ${transfersName} for account ${accountAddress} (all blocks scanned)`,
        );
        break;
      }

      nextStartBlock = Number(pageResult[pageResult.length - 1].blockNumber);
      pageResult = pageResult.filter((transfer) => Number(transfer.blockNumber) < nextStartBlock);
      result.push(...pageResult);
      const blocksRatio =
        (nextStartBlock - startBlockInclusive) / (endBlockExclusive - startBlockInclusive);
      log.debug(
        `[EtherScan] Retrieved ${pageResult.length} ${transfersName} for account ${accountAddress} (${(blocksRatio * 100).toFixed(4)}% blocks scanned)`,
      );
    }

    log.info(
      `[EtherScan] Got ${result.length} ${transfersName} for account ${accountAddress} between blocks [${startBlockInclusive}, ${endBlockExclusive}) on chain ${chainId}`,
    );
    return result;
  }

  public async getErc20TransfersForAccountAsync(
    chainId: number,
    accountAddress: string,
    startBlockInclusive: number,
    endBlockExclusive: number,
  ): Promise<AssetTransferData[]> {
    const erc20TransfersByPartialUid = (
      await this._getTransfersForAccountAsync(
        chainId,
        accountAddress,
        startBlockInclusive,
        endBlockExclusive,
        "tokentx",
        (erc20transfer) => {
          const requiredFields = [
            "blockNumber",
            "timeStamp",
            "hash",
            "nonce",
            "blockHash",
            "from",
            "contractAddress",
            "to",
            "value",
            "tokenName",
            "tokenSymbol",
            "tokenDecimal",
            "transactionIndex",
            "gas",
            "gasPrice",
            "gasUsed",
            "cumulativeGasUsed",
            "input",
            "confirmations",
          ];

          for (const field of requiredFields) {
            if (typeof erc20transfer[field] !== "string") {
              throw new Error(`Invalid ERC20 transfer: ${JSON.stringify(erc20transfer)}`);
            }
          }
        },
      )
    ).reduce<Map<string, EtherScanErc20Transfer[]>>(
      (dataByPartialUid, erc20TransferData) => {
        const partialUid: string = calculatePartialUid(erc20TransferData);
        if (!dataByPartialUid.has(partialUid)) {
          dataByPartialUid.set(partialUid, []);
        }
        dataByPartialUid.get(partialUid)!.push(erc20TransferData);
        return dataByPartialUid;
      },
      new Map<string, EtherScanErc20Transfer[]>(),
    );

    return Array.from(erc20TransfersByPartialUid.entries())
      .map(([partialUid, erc20Transfers]) => {
        return erc20Transfers.map((erc20Transfer, index) => {
          let uid: string = partialUid;
          if (index > 0) {
            uid = `${partialUid}:${index}`;
          }
          return convertEtherScanErc20TransferToAssetTransferData(chainId, uid, erc20Transfer);
        });
      })
      .flat();
  }

  public async getInternalTransfersForAccountAsync(
    chainId: number,
    accountAddress: string,
    startBlockInclusive: number,
    endBlockExclusive: number,
  ): Promise<AssetTransferData[]> {
    const internalTransfers = await this._getTransfersForAccountAsync(
      chainId,
      accountAddress,
      startBlockInclusive,
      endBlockExclusive,
      "txlistinternal",
      (internalTransfer) => {
        const requiredFields = [
          "blockNumber",
          "timeStamp",
          "hash",
          "from",
          "to",
          "value",
          "contractAddress",
          "input",
          "type",
          "gas",
          "gasUsed",
          "traceId",
          "isError",
          "errCode",
        ];

        for (const field of requiredFields) {
          if (typeof internalTransfer[field] !== "string") {
            throw new Error(`Invalid internal transfer: ${JSON.stringify(internalTransfer)}`);
          }
        }
      },
    );

    return internalTransfers
      .map((internalTransferData) =>
        convertEtherScanInternalTransferToAssetTransferData(chainId, internalTransferData),
      )
      .filter((assetTransfer) => assetTransfer !== null) as AssetTransferData[];
  }

  public async getTransactionsForAccountAsync(
    chainId: number,
    accountAddress: string,
    startBlockInclusive: number,
    endBlockExclusive: number,
  ): Promise<[TransactionData, AssetTransferData | null][]> {
    const txs = await this._getTransfersForAccountAsync(
      chainId,
      accountAddress,
      startBlockInclusive,
      endBlockExclusive,
      "txlist",
      (transaction) => {
        const requiredFields = [
          "blockNumber",
          "blockHash",
          "timeStamp",
          "hash",
          "nonce",
          "transactionIndex",
          "from",
          "to",
          "value",
          "gas",
          "gasPrice",
          "input",
          "methodId",
          "functionName",
          "contractAddress",
          "cumulativeGasUsed",
          "txreceipt_status",
          "gasUsed",
          "confirmations",
          "isError",
        ];

        for (const field of requiredFields) {
          if (typeof transaction[field] !== "string") {
            throw new Error(`Invalid transaction: ${JSON.stringify(transaction)}`);
          }
        }
      },
    );

    return txs.map((txData) => convertEtherScanTxToTransactionData(chainId, txData));
  }

  public async getBlockNumberForTimestampAsync(chainId: number, timestamp: number): Promise<number> {
    const blockNumberStr = await this._retrySendAndValidateAsync(
      {
        chainId,
        module: "block",
        action: "getblocknobytime",
        timestamp,
        closest: "after",
      },
      (result) => {
        const blockNumber = Number(result);
        if (isNaN(blockNumber)) {
          throw new Error(`Invalid block number: ${result}`);
        }
      },
    );

    log.debug(`[EtherScan] Got blockNumber for timestamp ${timestamp}: ${blockNumberStr}`);
    return Number(blockNumberStr);
  }

  public async isBlockIndexedAsync(chainId: number, blockNumber: number): Promise<boolean> {
    log.info(`[EtherScan] Checking if block ${blockNumber} is indexed on chain ${chainId}...`);
    try {
      const blockNumberHex = `0x${blockNumber.toString(16)}`;
      log.debug(`[EtherScan] Block ${blockNumber} hex: ${blockNumberHex}`);
      
      const result = await this._retrySendAndValidateAsync(
        {
          chainId,
          module: "proxy",
          action: "eth_getBlockByNumber",
          tag: blockNumberHex,
          boolean: "true", // Return full transaction objects
        },
        (result) => {
          // If block is not indexed, result will be null
          if (result === null) {
            // This is the ONLY case where we should return false
            // Don't throw here, handle it below
            log.debug(`[EtherScan] API returned null for block ${blockNumber}`);
            return;
          }
          if (typeof result !== "object") {
            log.warn(`[EtherScan] Invalid result type for block ${blockNumber}: ${typeof result}`);
            throw new Error(
              `Invalid block object for block ${blockNumber}: ${JSON.stringify(result)}`,
            );
          }
          log.debug(`[EtherScan] Block ${blockNumber} data received successfully`);
        },
      );

      // If result is null, block is not indexed yet
      if (result === null) {
        log.warn(`[EtherScan] ⚠️ Block ${blockNumber} is NOT indexed yet on chain ${chainId}`);
        return false;
      }

      // Verify the block number matches
      const returnedBlockNumber = parseInt(result.number, 16);
      log.debug(`[EtherScan] Returned block number: ${returnedBlockNumber}, requested: ${blockNumber}`);

      if (returnedBlockNumber !== blockNumber) {
        log.error(`[EtherScan] Block number mismatch: requested ${blockNumber}, got ${returnedBlockNumber}`);
        throw new Error(
          `Block number mismatch: requested ${blockNumber}, got ${returnedBlockNumber}`,
        );
      }
      
      log.info(`[EtherScan] ✅ Block ${blockNumber} is indexed on chain ${chainId}`);
      return true;
    } catch (error) {
      // Re-throw errors that are NOT about block not being indexed
      // (e.g., network errors, API errors, rate limits, etc.)
      log.error(`[EtherScan] ❌ Error checking if block ${blockNumber} is indexed on chain ${chainId}: ${error}`);
      throw error;
    }
  }

  public async getLatestBlockNumberAsync(chainId: number): Promise<number> {
    // Use V2 API: module=proxy&action=eth_blockNumber
    const blockNumberStr = await this._retrySendAndValidateAsync(
      {
        chainId,
        module: "proxy",
        action: "eth_blockNumber",
      },
      (result) => {
        if (typeof result !== "string" || !result.startsWith("0x")) {
          throw new Error(`Invalid block number format: ${result}`);
        }
      },
    );

    const blockNumber = parseInt(blockNumberStr, 16);
    if (isNaN(blockNumber)) {
      throw new Error(`Failed to parse block number: ${blockNumberStr}`);
    }

    log.debug(`[EtherScan] Got latest block number: ${blockNumber}`);
    return blockNumber;
  }

  /**
   * Get token info (symbol, decimals) from Etherscan
   * Uses the token module endpoint: module=token&action=tokeninfo
   */
  public async getTokenInfoAsync(
    chainId: number,
    contractAddress: string,
  ): Promise<{ symbol: string; decimals: number } | null> {
    try {
      console.log("getting token info for", contractAddress);
      const result = await this._retrySendAndValidateAsync(
        {
          chainId,
          module: "token",
          action: "tokeninfo",
          contractaddress: contractAddress,
        },
        (result) => {
          // Tokeninfo returns an array with one item
          if (!Array.isArray(result) || result.length === 0) {
            throw new Error(`Token info not found for ${contractAddress}`);
          }
        },
      );

      console.log("token info", result);

      if (Array.isArray(result) && result.length > 0) {
        const tokenInfo = result[0];
        
        // Skip NFTs (ERC721, ERC1155) - they have 0 decimals which breaks price calculations
        const tokenType = tokenInfo.tokenType || "";
        if (tokenType === "ERC721" || tokenType === "ERC1155") {
          log.debug(`[EtherScan] Skipping NFT token ${contractAddress} (type: ${tokenType})`);
          return null;
        }

        const symbol = tokenInfo.symbol || tokenInfo.tokenName || "UNKNOWN";
        // divisor field contains the decimals (as string)
        const decimalsStr = tokenInfo.divisor || tokenInfo.decimals || "18";
        const decimals = parseInt(decimalsStr, 10);
        
        // If decimals is 0 or invalid (likely NFT or error), default to 18
        const finalDecimals = !isNaN(decimals) && decimals > 0 ? decimals : 18;

        log.debug(
          `[EtherScan] Got token info for ${contractAddress}: ${symbol} (${finalDecimals} decimals)`,
        );

        return { symbol, decimals: finalDecimals };
      }

      return null;
    } catch (error) {
      console.log("failed to get token info for", contractAddress, error);
      log.debug(`[EtherScan] Failed to get token info for ${contractAddress}:`, error);
      return null;
    }
  }
}

