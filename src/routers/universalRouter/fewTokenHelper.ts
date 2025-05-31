
import { keccak256, AbiCoder } from "ethers";

interface FewWrappedFactoryConfig {
  fewWrapFactory: string;
  fewWrapInitCodeHash: string;
}

export const FEW_WRAPPED_FACTORY_CONFIGS: Record<number, FewWrappedFactoryConfig> = {
  // Define configuration for each chain
  // Blast mainnet uses different values than other chains
  81457: { // Blast mainnet chainId
    fewWrapFactory: "0x455b20131d59f01d082df1225154fda813e8cee9",
    fewWrapInitCodeHash: "0x075ca97923eddedb5953d92e6c55afa2e88b47caaa7f96d34cc2855679931447"
  }
}

// Default values for all other chains
const DEFAULT_FEW_WRAP_FACTORY = "0x7D86394139bf1122E82FDF45Bb4e3b038A4464DD"
const DEFAULT_FEW_WRAP_INIT_CODE_HASH = "0x2bdba5734ddf754fb149ef1faa937956c52cfd1f24d68163a95f42d08ec06d38"

export const FEW_WRAPPED_TOKEN_FACTORY_ADDRESS = (chainId: number): string => {
  if (chainId in FEW_WRAPPED_FACTORY_CONFIGS)
    return FEW_WRAPPED_FACTORY_CONFIGS[chainId].fewWrapFactory
  return DEFAULT_FEW_WRAP_FACTORY
}

export const FEW_WRAPPED_TOKEN_INIT_CODE_HASH = (chainId: number): string => {
  if (chainId in FEW_WRAPPED_FACTORY_CONFIGS)
    return FEW_WRAPPED_FACTORY_CONFIGS[chainId].fewWrapInitCodeHash
  return DEFAULT_FEW_WRAP_INIT_CODE_HASH
}

export const getFewWrappedTokenAddress = (chainId: number, originalTokenAddress: string): string => {
    const constructorArgumentsEncoded = AbiCoder.defaultAbiCoder().encode(
        [ 'address' ],
        [ originalTokenAddress ],
    );

    const create2Inputs = [
      '0xff',
      FEW_WRAPPED_TOKEN_FACTORY_ADDRESS(chainId),
      // salt
      keccak256(constructorArgumentsEncoded),
      // init code. bytecode + constructor arguments
      FEW_WRAPPED_TOKEN_INIT_CODE_HASH(chainId),
    ];

    const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;
    return `0x${keccak256(sanitizedInputs).slice(-40)}`.toLowerCase();
}
