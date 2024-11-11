import { ChainId, LiquiditySourceUname } from "./unames.js";

export const swapApiSupportedLiquiditySourcesByChainId: { [chainId in ChainId]: LiquiditySourceUname [] } = {
    [ChainId.EthereumMainnet]: [
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
        LiquiditySourceUname.PancakeswapV3,
        LiquiditySourceUname.CurveV1,
        LiquiditySourceUname.Clipper,
    ],
    [ChainId.ArbitrumOne]: [
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
        LiquiditySourceUname.PancakeswapV3,
        LiquiditySourceUname.SushiswapV2,
        LiquiditySourceUname.SushiswapV3,
        LiquiditySourceUname.CurveV1,
        LiquiditySourceUname.Orderbook_Bebop,
    ],
    [ChainId.BaseMainnet]: [
        LiquiditySourceUname.Aerodrome,
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
        LiquiditySourceUname.PancakeswapV3,
        LiquiditySourceUname.SushiswapV2,
        LiquiditySourceUname.SushiswapV3,
        LiquiditySourceUname.Orderbook_Bebop,
    ],
    [ChainId.BlastMainnet]: [
        LiquiditySourceUname.ThrusterV2_3k,
        LiquiditySourceUname.ThrusterV2_10k,
        LiquiditySourceUname.ThrusterV3,
        LiquiditySourceUname.Blasterswap,
        LiquiditySourceUname.RingswapV2,
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
    ],
    [ChainId.SuiMainnet]: [
        LiquiditySourceUname.Cetus,
    ],
};

export const universalRouterDeployedChainIds = [
    ChainId.EthereumMainnet,
    ChainId.ArbitrumOne,
    ChainId.BaseMainnet,
    ChainId.BlastMainnet,
];

export const universalRouterSupportedLiquiditySourcesByChainId: { [chainId: number]: LiquiditySourceUname [] } = {
    [ChainId.EthereumMainnet]: [
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
    ],
    [ChainId.ArbitrumOne]: [
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
    ],
    [ChainId.BaseMainnet]: [
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
    ],
    [ChainId.BlastMainnet]: [
        LiquiditySourceUname.ThrusterV2_3k,
        LiquiditySourceUname.ThrusterV2_10k,
        LiquiditySourceUname.ThrusterV3,
        LiquiditySourceUname.RingswapV2,
        LiquiditySourceUname.UniswapV2,
        LiquiditySourceUname.UniswapV3,
    ],
};