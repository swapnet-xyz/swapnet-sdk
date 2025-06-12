import type { AllChainsFact } from "../../common/typeUtils.js";
import { ChainId } from "../../common/unames.js";
import type { SettlementContractFactType } from "../types.js";


export const universalContractAllChainsFact: AllChainsFact<SettlementContractFactType> = {
    default: {
        tokenProxy: "0x000000000022d473030f116ddee9f6b43ac78ba3",
    },
    overrideByChain: {
        [ChainId.EthereumMainnet]: {
            address: "0x907F8f9BD32549F874e50608cF96829f1D851909",
        },
        [ChainId.ArbitrumOne]: {
            address: "0x59BF0A0823D79bd3a3082Fb8Bd953828ed36EA12",
        },
        [ChainId.BaseMainnet]: {
            address: "0x1f352ecdc178ef919849EeaA6ad3301337fb9CFB",
        },
        [ChainId.BlastMainnet]: {
            address: "0x2C8754B44865002415dD5CEBa6Cd67258D1eCe2e",
        },
    },
};