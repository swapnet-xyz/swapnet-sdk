import { RouterContractInfo } from "./routerContractInfo";
import { UNIVERSAL_ROUTER_ADDRESS } from "./universalRouter/constants";

export const routerContractInfoByName: Map<string, RouterContractInfo> = new Map();
routerContractInfoByName.set(
    'swapnetRouter', {
        name: 'swapnetRouter',
        address: `0x7392feabE86aabed9001Fe1b38544A04D3D83EdE`,
        codeOverride: undefined,
        usePermit2: false,
    }
);
routerContractInfoByName.set(
    'swapnetExecutor', {
        name: 'swapnetExecutor',
        address: `0x7392feabE86aabed9001Fe1b38544A04D3D83EdE`,
        codeOverride: undefined,
        usePermit2: false,
    }
);
routerContractInfoByName.set(
    'universalRouter', {
        name: 'universalRouter',    // modified uniswap universal router
        address: UNIVERSAL_ROUTER_ADDRESS(1),
        codeOverride: undefined,
        usePermit2: true,
    }
);