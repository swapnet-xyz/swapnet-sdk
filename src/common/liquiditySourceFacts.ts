import { ChainId, LiquiditySourceUname } from "./unames.js";


type LiquiditySourceFact<TPerChainFact> = {
    default: Partial<TPerChainFact>;
    overrideByChain: {
        [chainId in ChainId]?: Partial<TPerChainFact>;
    };
};

const liquiditySourceFactByUname: { [liquiditySource in LiquiditySourceUname]: LiquiditySourceFact<any>} = {

    // https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments
    [LiquiditySourceUname.UniswapV2]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.EthereumMainnet]: {
                factoryAddress: "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f",
            },
            [ChainId.ArbitrumOne]: {
                factoryAddress: "0xf1d7cc64fb4452f05c498126312ebe29f30fbcf9",
            },
            [ChainId.BaseMainnet]: {
                factoryAddress: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6",
            },
            [ChainId.BlastMainnet]: {
                factoryAddress: "0x5C346464d33F90bABaf70dB6388507CC889C1070",
            },
        }
    },

    // https://docs.uniswap.org/contracts/v3/reference/deployments/
    [LiquiditySourceUname.UniswapV3]: {
        default: {
            feeTiers: [ 100n, 500n, 3000n, 10000n, ],
        },
        overrideByChain: {
            [ChainId.EthereumMainnet]: {
                factoryAddress: "0x1f98431c8ad98523631ae4a59f267346ea31f984",
            },
            [ChainId.ArbitrumOne]: {
                factoryAddress: "0x1f98431c8ad98523631ae4a59f267346ea31f984",
            },
            [ChainId.BaseMainnet]: {
                factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
            },
            [ChainId.BlastMainnet]: {
                factoryAddress: "0x792edAdE80af5fC680d96a2eD80A44247D2Cf6Fd",
            },
        }
    },

    [LiquiditySourceUname.PancakeswapV3]: {
        default: {
            feeTiers: [ 100n, 500n, 2500n, 10000n, ],
            factoryAddress: "0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865",
            readerContractAddressOffset: 1n,    // necessary for PancakeswapV3
        },
        overrideByChain: {}
    },

    [LiquiditySourceUname.CurveV1]: {
        default: {},
        overrideByChain: {
            [ChainId.EthereumMainnet]: {
                pools: [
                    {
                        address: "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
                        numberOfTokens: 3,
                        stateReaderAbiVersion: 1,
                    },
                    {
                        address: "0xdcef968d416a41cdac0ed8702fac8128a64241a2",
                        numberOfTokens: 2,
                        stateReaderAbiVersion: 1,
                    },
                ]
            },
            [ChainId.ArbitrumOne]: {
                pools: [
                    {
                        address: "0x7f90122bf0700f9e7e1f688fe926940e8839f353",
                        numberOfTokens: 2,
                        stateReaderAbiVersion: 1,
                    },
                ],
            },
        }
    },
    [LiquiditySourceUname.Clipper]: {
        default: {},
        overrideByChain: {
            [ChainId.EthereumMainnet]: {
                pools: [
                    "0x655edce464cc797526600a462a8154650eee4b77",
                ],
            }
        },
    },

    // https://docs.sushi.com/docs/Products/Classic%20AMM/Deployment%20Addresses
    [LiquiditySourceUname.SushiswapV2]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.ArbitrumOne]: {
                factoryAddress: "0xc35dadb65012ec5796536bd9864ed8773abc74c4",
            },
            [ChainId.BaseMainnet]: {
                factoryAddress: "0x71524B4f93c58fcbF659783284E38825f0622859",
            },
        }
    },

    // https://docs.sushi.com/docs/Products/V3%20AMM/Core/Deployment%20Addresses
    [LiquiditySourceUname.SushiswapV3]: {
        default: {
            feeTiers: [ 100n, 500n, 3000n, 10000n, ],
        },
        overrideByChain: {
            [ChainId.ArbitrumOne]: {
                factoryAddress: "0x1af415a1EbA07a4986a52B6f2e7dE7003D82231e",
            },
            [ChainId.BaseMainnet]: {
                factoryAddress: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
            },
        }
    },

    [LiquiditySourceUname.BebopOrderbook]: {
        default: {
            settlementContractAddress: "0xbbbbbbb520d69a9775e85b458c58c648259fad5f",
        },
        overrideByChain: {
            [ChainId.ArbitrumOne]: {
                quoteToken: {
                    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
                    symbol: "USDC.e",
                },
            },
            [ChainId.BaseMainnet]: {
                quoteToken: {
                    address: "0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca",
                    symbol: "USDbC",
                },
            },
        }
    },

    [LiquiditySourceUname.BebopLimitOrder]: {
        default: {},
        overrideByChain: {},
    },

    [LiquiditySourceUname.NativeOrderbook]: {
        default: {},
        overrideByChain: {},
    },

    [LiquiditySourceUname.NativeLimitOrder]: {
        default: {},
        overrideByChain: {},
    },

    // https://aerodrome.finance/security#contracts
    [LiquiditySourceUname.Aerodrome]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.BaseMainnet]: {
                factoryAddress: "0x420dd381b31aef6683db6b902084cb0ffece40da",
            },
        }
    },

    [LiquiditySourceUname.ThrusterV2_3k]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.BlastMainnet]: {
                factoryAddress: "0xb4a7d971d0adea1c73198c97d7ab3f9ce4aafa13",
            },
        }
    },

    [LiquiditySourceUname.ThrusterV2_10k]: {
        default: {
            poolFeeRate: 0.01,
        },
        overrideByChain: {
            [ChainId.BlastMainnet]: {
                factoryAddress: "0x37836821a2c03c171fB1a595767f4a16e2b93Fc4",
            },
        }
    },

    [LiquiditySourceUname.ThrusterV3]: {
        default: {
            feeTiers: [ 500n, 3000n, 10000n, ],
        },
        overrideByChain: {
            [ChainId.BlastMainnet]: {
                factoryAddress: "0x71b08f13b3c3af35aadeb3949afeb1ded1016127",
            },
        }
    },
    [LiquiditySourceUname.Blasterswap]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.BlastMainnet]: {
                factoryAddress: "0x9cc1599d4378ea41d444642d18aa9be44f709ffd",
            },
        }
    },
    [LiquiditySourceUname.RingswapV2]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.BlastMainnet]: {
                factoryAddress: "0x9cc1599d4378ea41d444642d18aa9be44f709ffd",
                ringswapWrapperFactory: "0x455b20131d59f01d082df1225154fda813e8cee9",
            },
        }
    },
    [LiquiditySourceUname.Cetus]: {
        default: {
            poolFeeRate: 0.003,
        },
        overrideByChain: {
            [ChainId.SuiMainnet]: {
                sdkOptions: {
                    fullRpcUrl: "https://fullnode.mainnet.sui.io",
                    simulationAccount: {
                        address: "0x326ce9894f08dcaa337fa232641cc34db957aec9ff6614c1186bc9a7508df0bb",
                    },
                    cetus_config: {
                        package_id:"0x95b8d278b876cae22206131fb9724f701c9444515813042f54f0a426c9a3bc2f",
                        published_at:"0x95b8d278b876cae22206131fb9724f701c9444515813042f54f0a426c9a3bc2f",
                        config: {
                            coin_list_id: "0x8cbc11d9e10140db3d230f50b4d30e9b721201c0083615441707ffec1ef77b23",
                            launchpad_pools_id: "0x1098fac992eab3a0ab7acf15bb654fc1cf29b5a6142c4ef1058e6c408dd15115",
                            clmm_pools_id: "0x15b6a27dd9ae03eb455aba03b39e29aad74abd3757b8e18c0755651b2ae5b71e",
                            admin_cap_id: "0x39d78781750e193ce35c45ff32c6c0c3f2941fa3ddaf8595c90c555589ddb113",
                            global_config_id: "0x0408fa4e4a4c03cc0de8f23d0c2bbfe8913d178713c9a271ed4080973fe42d8f",
                            coin_list_handle: "0x49136005e90e28c4695419ed4194cc240603f1ea8eb84e62275eaff088a71063",
                            launchpad_pools_handle: "0x5e194a8efcf653830daf85a85b52e3ae8f65dc39481d54b2382acda25068375c",
                            clmm_pools_handle: "0x37f60eb2d9d227949b95da8fea810db3c32d1e1fa8ed87434fc51664f87d83cb",
                        },
                    },
                    clmm_pool: {
                        package_id:"0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb",
                        published_at:"0xfa36bcb799278bddaf295991b2d3ce039013b1dd60dfd7183dee135fdadbc4be",
                        config: {
                            pools_id: "0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0",
                            global_config_id: "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
                            global_vault_id: "0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b",
                            admin_cap_id: "0x89c1a321291d15ddae5a086c9abc533dff697fde3d89e0ca836c41af73e36a75",
                        },
                    },
                    integrate: {
                        package_id: "0x996c4d9480708fb8b92aa7acf819fb0497b5ec8e65ba06601cae2fb6db3312c3",
                        published_at: "0x996c4d9480708fb8b92aa7acf819fb0497b5ec8e65ba06601cae2fb6db3312c3",
                    },
                    deepbook: {
                        package_id: "0x000000000000000000000000000000000000000000000000000000000000dee9",
                        published_at: "0x000000000000000000000000000000000000000000000000000000000000dee9",
                    },
                    deepbook_endpoint_v2: {
                        package_id: "0xac95e8a5e873cfa2544916c16fe1461b6a45542d9e65504c1794ae390b3345a7",
                        published_at: "0xac95e8a5e873cfa2544916c16fe1461b6a45542d9e65504c1794ae390b3345a7",
                    },
                    aggregatorUrl: "https://api-sui.cetus.zone/router",
                },
            },
        }
    }
};


export const getLiquiditySourceFactOnChain = (liquiditySource: LiquiditySourceUname, chainId: ChainId) => {
    const fact = liquiditySourceFactByUname[liquiditySource];

    if (fact === undefined) {
        throw new Error(`Unknown liquidity source: ${liquiditySource}`);
    }

    const { default: defaultFact, overrideByChain } = fact;
    return {
        ...defaultFact,
        ...overrideByChain[chainId],
    };
}