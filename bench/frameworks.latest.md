# Framework Benchmark

- generatedAt: 2026-03-03T14:20:23.088Z
- node: v24.14.0
- settings: 50 conn / 5s / pipeline 1

## static_get

| Framework | req/s | avg latency (ms) | p99 latency (ms) | non2xx | errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| zent | 14516 | 3.14 | 4 | 0 | 0 |
| fastify | 19035.2 | 2.07 | 3 | 0 | 0 |
| express | 12445.6 | 3.31 | 5 | 0 | 0 |

## param_get

| Framework | req/s | avg latency (ms) | p99 latency (ms) | non2xx | errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| zent | 14986.4 | 3.02 | 3 | 0 | 0 |
| fastify | 19051.2 | 2.03 | 3 | 0 | 0 |
| express | 12349.6 | 3.44 | 5 | 0 | 0 |

## json_post

| Framework | req/s | avg latency (ms) | p99 latency (ms) | non2xx | errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| zent | 12866.4 | 3.23 | 4 | 0 | 0 |
| fastify | 12565.6 | 3.34 | 9 | 0 | 0 |
| express | 10160.8 | 4.27 | 6 | 0 | 0 |

