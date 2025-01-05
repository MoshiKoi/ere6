The program is first divided into 2x2 blocks.

E.g. the program
```
1234
5678
abcd
efgh
```

Has two "lines".

```json
[
    ["1256", "3478"],
    ["abef", "cdgh"]
]
```

In essence, a program is just a grid of base-94 4-digit numbers.