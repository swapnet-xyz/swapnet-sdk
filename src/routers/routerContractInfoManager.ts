import { type RouterContractInfo } from "./routerContractInfo.js";
import { UNIVERSAL_ROUTER_ADDRESS } from "./universalRouter/constants.js";

export const routerContractInfoByName: Map<string, RouterContractInfo> = new Map();
routerContractInfoByName.set(
    'swapnet', {
        name: 'swapnet',
        address: `0x7392feabE86aabed9001Fe1b38544A04D3D83EdE`,
        codeOverride: undefined,
        usePermit2: false,
    }
);
routerContractInfoByName.set(
    'swapnet-executor', {
        name: 'swapnet-executor',
        address: `0x7392feabE86aabed9001Fe1b38544A04D3D83EdE`,
        codeOverride: undefined,
        usePermit2: false,
    }
);
routerContractInfoByName.set(
    'uniswap', {
        name: 'uniswap',    // modified uniswap universal router
        address: UNIVERSAL_ROUTER_ADDRESS(1),
        codeOverride: undefined,
        usePermit2: true,
    }
);
routerContractInfoByName.set(
    '1inch', {
        name: '1inch',
        address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        codeOverride: undefined,
        usePermit2: false,
    }
);
routerContractInfoByName.set(
    '0x-api', {
        name: '0x-api',
        address: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
        codeOverride: undefined,
        usePermit2: false,
    }
);
routerContractInfoByName.set(
    'paraswap', {
        name: 'paraswap',
        address: '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57',
        tokenProxy: '0x216b4b4ba9f3e719726886d34a177484278bfcae',
        codeOverride: undefined,
        usePermit2: false,
    }
);