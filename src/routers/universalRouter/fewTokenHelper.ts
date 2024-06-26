
import { keccak256, AbiCoder } from "ethers";

const fewFactoryAddress = "0x455b20131d59f01d082df1225154fda813e8cee9";
const fewWrappedTokenInitCodeHash = "0x075ca97923eddedb5953d92e6c55afa2e88b47caaa7f96d34cc2855679931447";

export const getFewWrappedTokenAddress = (originalTokenAddress: string): string => {
    const constructorArgumentsEncoded = AbiCoder.defaultAbiCoder().encode(
        [ 'address' ],
        [ originalTokenAddress ],
    );

    const create2Inputs = [
      '0xff',
      fewFactoryAddress,
      // salt
      keccak256(constructorArgumentsEncoded),
      // init code. bytecode + constructor arguments
      fewWrappedTokenInitCodeHash,
    ];

    const sanitizedInputs = `0x${create2Inputs.map((i) => i.slice(2)).join('')}`;
    return `0x${keccak256(sanitizedInputs).slice(-40)}`.toLowerCase();
}
