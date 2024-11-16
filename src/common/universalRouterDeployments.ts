
import { ChainId, LiquiditySourceUname } from "./unames.js";

const notDeployed: LiquiditySourceUname [] = [];
const revision1: LiquiditySourceUname [] = [
    LiquiditySourceUname.UniswapV2,
    LiquiditySourceUname.UniswapV3,
    LiquiditySourceUname.ThrusterV2_3k,
    LiquiditySourceUname.ThrusterV2_10k,
    LiquiditySourceUname.ThrusterV3,
    LiquiditySourceUname.RingswapV2,
];

export const universalRouterDeploymentByChainId: Record<ChainId, LiquiditySourceUname []> = {
    [ChainId.EthereumMainnet]: revision1,
    [ChainId.ArbitrumOne]: revision1,
    [ChainId.BaseMainnet]: revision1,
    [ChainId.BlastMainnet]: revision1,
    [ChainId.SuiMainnet]: notDeployed,
};