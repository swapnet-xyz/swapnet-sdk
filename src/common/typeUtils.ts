
export type PartialRecord<K extends string | number | symbol, T> = { [P in K]?: T; };