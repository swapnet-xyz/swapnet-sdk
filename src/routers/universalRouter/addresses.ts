import type { PartialRecord } from "../../common/typeUtils.js";
import { ChainId } from "../../common/unames.js";

export const deployedAddressesByChainId: PartialRecord<ChainId, string> = {
    [ChainId.EthereumMainnet]: "0x907F8f9BD32549F874e50608cF96829f1D851909",
    [ChainId.ArbitrumOne]: "0x59BF0A0823D79bd3a3082Fb8Bd953828ed36EA12",
    [ChainId.BaseMainnet]: "0x1f352ecdc178ef919849EeaA6ad3301337fb9CFB",
    [ChainId.BlastMainnet]: "0x2C8754B44865002415dD5CEBa6Cd67258D1eCe2e",
};