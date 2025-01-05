import { Block } from "./common";

/**
 * Base 94 decode a string (SPACE = 0)
 */
export const decode94 = (block: Block) => [...block].reduce((r, o, _) => 94 * r + (block.charCodeAt(_) - 32), 0);

/**
 * Base 94 encode a number (SPACE = 0)
 */
export const encode94 = (n: number): Block =>
    (Array.from({ length: 4 }) as undefined[])
        .reduce((r: string, o, _): string => String.fromCharCode(32 + (Math.floor(n / 94 ** _) % 94)) + r, "");

