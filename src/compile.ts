import { readFileSync, writeFileSync } from "fs";
import { encode94 } from "./base94";
import { Block } from "./common";

function toBlock(str: string, x: number, y: number): Block {
    const args1 = () => {
        const [x1, y1] = str.substring(2)
            .split(',')
            .map(v => parseInt(v))

        const [dx, dy] = [x1 - x, y1 - y];

        return [dy + 11, dx + 11]
            .map((v, i) => v * (24 ** i))
            .reduce((a, b) => a + b);
    }

    const args2 = () => {
        const [x1, y1, x2, y2] = str.substring(2)
            .split(',')
            .map(v => parseInt(v));

        const [dx1, dy1, dx2, dy2] = [x1 - x, y1 - y, x2 - x, y2 - y];

        return [dy1 + 11, dx1 + 11, dy2 + 11, dx2 + 11]
            .map((v, i) => v * (24 ** i))
            .reduce((a, b) => a + b);
    }

    switch (str[0]) {
        case '\'': return encode94(str.charCodeAt(1))
        case '(': return encode94(parseInt(str.substring(1)))
        case '+': return encode94(args2() * 94 + 1);
        case '-': return encode94(args2() * 94 + 2);
        case '=': return encode94(args2() * 94 + 6);
        case 'G': return encode94(args2() * 94 + 8);
        case 'L': return encode94(args2() * 94 + 9);
        case 'O': return encode94(args1() * 94 + 12)
        case 'N': return encode94(args1() * 94 + 20)
        case 'I': return encode94(args1() * 94 + 21);
        case '>': return encode94(14);
        case '<': return encode94(15);
        case 'v': return encode94(16);
        case '^': return encode94(17);
        case 'X': return encode94(19);
        default: return encode94(0);
    }
}

const blocks = readFileSync(process.argv[2], 'utf-8')
    .split('\n')
    .map((line, y) => line.trim().split(/\s+/).map((str, x) => toBlock(str, x, y)))

const program = Array.from({ length: blocks.length * 2 })
    .map((_, y) => Array.from({ length: blocks[0].length * 2 })
        .map((_, x) => blocks[y / 2 | 0][x / 2 | 0][2 * (y % 2) + x % 2])
        .join(''))
    .join('\n')

if (process.argv[3])
    writeFileSync(process.argv[3], program);
else
    console.log(program);