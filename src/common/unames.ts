
// Use chain IDs from: https://docs.expand.network/ids/chain-ids
export const ChainId = {
    Ethereum: 1,
    ArbitrumOne: 42161,
    Base: 8453,
    Blast: 81457,
    Sui: 101,
    Unichain: 130,
    Bsc: 56,
    Polygon: 137,
    Optimism: 10,
    Katana: 747474,
    HyperEvm: 999,
    Solana: 900,
    Plasma: 9745,
    MonadTestnet: 10143,
} as const;

export type ChainName = keyof typeof ChainId;
export type ChainId = typeof ChainId[ChainName];

export const getChainName = (chainId: ChainId): ChainName => {
    const chainNames = Object.keys(ChainId).find(key => { return ChainId[key as ChainName] === chainId; });
    if (chainNames === undefined) {
        throw new Error(`Cannot find chainName for chainId ${chainId}!`);
    }
    return chainNames as ChainName;
};

export const availableChainIds = Object.values(ChainId);

export enum LiquiditySourceUname {
    UniswapV2 = "UniswapV2",
    UniswapV3 = "UniswapV3",
    UniswapV4 = "UniswapV4",
    PancakeswapV3 = "PancakeswapV3",
    CurveV1 = "CurveV1",
    Clipper = "Clipper",
    ClipperLimitOrder = "LimitOrder-Clipper",
    SushiswapV2 = "SushiswapV2",
    SushiswapV3 = "SushiswapV3",
    NativeOrderbook = "Orderbook-Native",
    NativeLimitOrder = "LimitOrder-Native",
    BebopOrderbook = "Orderbook-Bebop",
    BebopLimitOrder = "LimitOrder-Bebop",
    AerodromeV2 = "AerodromeV2",
    AerodromeV3 = "AerodromeV3",
    ThrusterV2_3k = "ThrusterV2-3k",
    ThrusterV2_10k = "ThrusterV2-10k",
    ThrusterV3 = "ThrusterV3",
    Blasterswap = "Blasterswap",
    RingswapV2 = "RingswapV2",
    Cetus = "Cetus",
    HyperswapV2 = "HyperswapV2",
    HyperswapV3 = "HyperswapV3",
    ProjectxV3 = "ProjectxV3",
    RaydiumClmm = "RaydiumClmm",
    RaydiumCpmm = "RaydiumCpmm",
    OrcaClmm = "OrcaClmm",
    HybraV3 = "HybraV3",
    KittenswapV4 = "KittenswapV4",
    GliquidV4 = "GliquidV4",
    UpheavalV3 = "UpheavalV3",
    Fluid = "Fluid",
    BalancerV3 = "BalancerV3",
    UltrasolidV3 = "UltrasolidV3",
    PancakeswapV2 = "PancakeswapV2",
    QuickswapV2 = "QuickswapV2",
    QuickswapV3 = "QuickswapV3",
};

export enum RouterUname {
    Default = "default-router",
    Native = "swapnet-router",
    Executor = "swapnet-executor",
    Universal = "universal-router",
    Clipper = "clipper-router",
    SuiRouter = "sui-router",
    OneInch = "1inch-router",
    ZeroEx = "0x-router",
    Paraswap = "paraswap-router",
};

export const availableRouters = Object.values(RouterUname);