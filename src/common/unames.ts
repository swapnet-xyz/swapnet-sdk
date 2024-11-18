

export const ChainId = {
    EthereumMainnet: 1,
    ArbitrumOne: 42161,
    BaseMainnet: 8453,
    BlastMainnet: 81457,
    SuiMainnet: 101,
} as const;

export type ChainId = typeof ChainId[keyof typeof ChainId];

export const availableChainIds = Object.values(ChainId);

export enum LiquiditySourceUname {
    UniswapV2 = "UniswapV2",
    UniswapV3 = "UniswapV3",
    PancakeswapV3 = "PancakeswapV3",
    CurveV1 = "CurveV1",
    Clipper = "Clipper",
    SushiswapV2 = "SushiswapV2",
    SushiswapV3 = "SushiswapV3",
    NativeOrderbook = "Orderbook-Native",
    NativeLimitOrder = "LimitOrder-Native",
    BebopOrderbook = "Orderbook-Bebop",
    BebopLimitOrder = "LimitOrder-Bebop",
    Aerodrome = "Aerodrome",
    ThrusterV2_3k = "ThrusterV2-3k",
    ThrusterV2_10k = "ThrusterV2-10k",
    ThrusterV3 = "ThrusterV3",
    Blasterswap = "Blasterswap",
    RingswapV2 = "RingswapV2",
    Cetus = "Cetus",
};

export const universalRouterUname: string = "universal router";