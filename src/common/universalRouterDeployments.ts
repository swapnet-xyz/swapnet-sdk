
import { type ChainIdType, LiquiditySourceUname } from "./unames.js";

const notDeployed: LiquiditySourceUname [] = [];
const revision1: LiquiditySourceUname [] = [
    LiquiditySourceUname.UniswapV2,
    LiquiditySourceUname.UniswapV3,
    LiquiditySourceUname.ThrusterV2_3k,
    LiquiditySourceUname.ThrusterV2_10k,
    LiquiditySourceUname.ThrusterV3,
    LiquiditySourceUname.RingswapV2,
];

export const universalRouterDeploymentByChainId: Record<ChainIdType, LiquiditySourceUname []> = {
    1: revision1,
    42161: revision1,
    8453: revision1,
    81457: revision1,
    101: notDeployed,
};