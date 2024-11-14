
import { ChainId, LiquiditySourceUname } from "./unames.js";


// // move to Swap API app configs
// export const swapApiSupportedLiquiditySourcesByChainId: Record<ChainId, LiquiditySourceUname []> = {
//     [ChainId.EthereumMainnet]: [
//         LiquiditySourceUname.UniswapV2,
//         LiquiditySourceUname.UniswapV3,
//         LiquiditySourceUname.PancakeswapV3,
//         LiquiditySourceUname.CurveV1,
//         LiquiditySourceUname.Clipper,
//     ],
//     [ChainId.ArbitrumOne]: [
//         LiquiditySourceUname.UniswapV2,
//         LiquiditySourceUname.UniswapV3,
//         LiquiditySourceUname.PancakeswapV3,
//         LiquiditySourceUname.SushiswapV2,
//         LiquiditySourceUname.SushiswapV3,
//         LiquiditySourceUname.CurveV1,
//         LiquiditySourceUname.BebopOrderbook,
//     ],
//     [ChainId.BaseMainnet]: [
//         LiquiditySourceUname.Aerodrome,
//         LiquiditySourceUname.UniswapV2,
//         LiquiditySourceUname.UniswapV3,
//         LiquiditySourceUname.PancakeswapV3,
//         LiquiditySourceUname.SushiswapV2,
//         LiquiditySourceUname.SushiswapV3,
//         LiquiditySourceUname.BebopOrderbook,
//     ],
//     [ChainId.BlastMainnet]: [
//         LiquiditySourceUname.ThrusterV2_3k,
//         LiquiditySourceUname.ThrusterV2_10k,
//         LiquiditySourceUname.ThrusterV3,
//         LiquiditySourceUname.Blasterswap,
//         LiquiditySourceUname.RingswapV2,
//         LiquiditySourceUname.UniswapV2,
//         LiquiditySourceUname.UniswapV3,
//     ],
//     [ChainId.SuiMainnet]: [
//         LiquiditySourceUname.Cetus,
//     ],
// };

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