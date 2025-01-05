import fs from "fs";
import deasync from "deasync";

import { Block } from "./common";
import { encode94, decode94 } from "./base94";

/**
 * Source blocks, in [row][column] order
 */
type BlockGrid = Block[][]

/**
 * State of the program at a given moment
 */
type State = [dx: number, dy: number, x: number, y: number, BlockGrid];

/**
 * Parse 2x2 blocks
 */
const decode = (filename: string): BlockGrid => fs
    .readFileSync(filename, "utf-8")
    .split("\n")
    .reduce(
        (acc: string[][], line, index, lines) => (
            index % 2 == 0 && acc.push(Array.from(
                { length: Math.ceil(line.length / 2) },
                (_, i) => lines[index][2 * i] + lines[index][2 * i + 1] + lines[index + 1][2 * i] + lines[index + 1][2 * i + 1])),
            acc),
        []);


let isOutOfBounds = (blocks: BlockGrid, x: number, y: number) =>
    y < 0 || y >= blocks.length || x < 0 || x >= blocks[0].length;

const assertBounds = (blocks: BlockGrid, x: number, y: number) => {
    if (isOutOfBounds(blocks, x, y)) throw Error("Out of bounds.");
}

/**
 * Helper function that converts a function taking a number into the same function but returning the number
 */
const withReturn = (fn: (n: number) => void) => (r: number) => (fn(r), r);

let cur_dx = 1;
let cur_dy = 0;
let cur_x = 0;
let cur_y = 0;
let history: State[] = [];


const run = (blocks: BlockGrid) => {
    for (; !isOutOfBounds(blocks, cur_x, cur_y); cur_x += cur_dx, cur_y += cur_dy) {
        step(blocks);
        history.push([cur_dx, cur_dy, cur_x, cur_y, blocks]);
    }
};

const travelBack = (steps: number) => {
    let blocks: BlockGrid;
    [cur_dx, cur_dy, cur_x, cur_y, blocks] = history[history.length - steps];
    history = history.slice(0, -steps);
    run(blocks);
};

type X = any[] & number[]

/**
 * Convert a function on numbers into one on Blocks using the encoding and decoding functions
 */
const apply = (
    encode: (n: number) => Block,
    decode: (block: Block) => number,
    operation: (...args: number[]) => any) =>
    (...args: Block[]) => encode(operation(...args.map(decode)));

const m24 = (r: number) => [(r % 24) - 11, Math.floor(r / 24)];

const read = () => {
    let buffer: Buffer | null = null;

    for (process.stdin.once("data", data => { buffer = data; }); null === buffer;)
        deasync.runLoopOnce();

    return buffer.toString().trim() as string;
};

const getPos = (blocks: BlockGrid, r: number): [x: number, y: number, number] => {
    let offset_y: number, offset_x: number;

    [offset_y, r] = m24(r);
    [offset_x, r] = m24(r);

    assertBounds(blocks, offset_x + cur_x, offset_y + cur_y);

    return [offset_x + cur_x, offset_y + cur_y, r];
};

const step = (blocks: BlockGrid) => {
    const r = decode94(blocks[cur_y][cur_x]);
    const o = Math.floor(r / 94);

    type BinOp =
        | ((a: number, b: number) => number)
        | ((a: number, b: number) => boolean);

    const createBinaryFn = (fn: BinOp) => () => {
        const [x1, y1, n] = getPos(blocks, o);
        const [x2, y2, _] = getPos(blocks, n);
        blocks[y2][x2] = apply(encode94, decode94, fn)(blocks[y2][x2], blocks[y1][x1]);
    };

    const createUnaryFn = (fn: (n: number) => number) => () => {
        const [x, y, _] = getPos(blocks, o);
        blocks[y][x] = apply(encode94, decode94, fn)(blocks[y][x]);
    };

    const ops: { [key: number]: () => void } = {
        1: createBinaryFn((a, b) => a + b),
        2: createBinaryFn((a, b) => a - b),
        3: createBinaryFn((a, b) => a * b),
        4: createBinaryFn((a, b) => a / b),
        5: createBinaryFn((a, b) => a % b),
        6: createBinaryFn((a, b) => a == b),
        7: createBinaryFn((a, b) => a != b),
        8: createBinaryFn((a, b) => a < b),
        9: createBinaryFn((a, b) => a > b),
        10: createBinaryFn((a, b) => a || b),
        11: createBinaryFn((a, b) => a && b),
        12: createUnaryFn(withReturn(n => process.stdout.write(String.fromCharCode(n)))),
        13: createUnaryFn((_) => read().charCodeAt(0)),
        14: () => { (cur_dx = 1), (cur_dy = 0); },
        15: () => { (cur_dx = -1), (cur_dy = 0); },
        16: () => { (cur_dx = 0), (cur_dy = 1); },
        17: () => { (cur_dx = 0), (cur_dy = -1); },
        18: createUnaryFn(withReturn(n => travelBack(n))),
        19: () => process.exit(0),
        20: createUnaryFn(withReturn(n => process.stdout.write(n.toString()))),
        21: createUnaryFn((_) => parseInt(read()) || 0),
    };
    ops[r % 94]?.();
};

const decoded = decode(process.argv[2]);

const asChar = (opCode: number) => ({
    1: '+',
    2: '-',
    3: '*',
    4: '/',
    5: '%',
    6: '=',
    7: '!',
    8: '<',
    9: '>',
    10: '|',
    11: '&',
    12: 'o',
    13: 'R',
    14: '>',
    15: '<',
    16: 'v',
    17: '^',
    18: 'T',
    19: 'X',
    20: 'N',
    21: 'I'
}[opCode] ?? ' ')

const dbgDecodeOp = (block: Block) => {
    const r = decode94(block)
    const o = Math.floor(r / 94);

    let [offset_y, p] = m24(o);
    let [offset_x, _] = m24(p);

    return [r % 94, offset_x, offset_y]
}

console.log(decoded.map(row => row.map(v => asChar(dbgDecodeOp(v)[0])).join('')).join('\n'))
console.log(decoded.map(row => row.map(dbgDecodeOp)))

run(decoded);

/* ☆ જ⁀➴ meow meow ^-^ ☆૮꒰•༝ •。꒱ა */