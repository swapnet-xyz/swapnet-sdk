
export interface RouterContractInfo {
    name: string,
    address: string,
    tokenProxy?: string,
    codeOverride: string | undefined,
    usePermit2: boolean,
};