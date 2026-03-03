# Framework Benchmark

- generatedAt: 2026-03-03T14:24:52.524Z
- node: v24.14.0
- settings: 50 conn / 5s / pipeline 1

## static_get

| Framework | req/s | avg latency (ms) | p99 latency (ms) | non2xx | errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| zent | 15873.6 | 2.51 | 4 | 0 | 0 |
| fastify | 19374.41 | 2.06 | 3 | 0 | 0 |
| express | 12332 | 3.37 | 5 | 0 | 0 |

## param_get

| Framework | req/s | avg latency (ms) | p99 latency (ms) | non2xx | errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| zent | 15894.4 | 2.71 | 3 | 0 | 0 |
| fastify | 19512 | 2.03 | 3 | 0 | 0 |
| express | 12354.4 | 3.36 | 5 | 0 | 0 |

## json_post

| Framework | req/s | avg latency (ms) | p99 latency (ms) | non2xx | errors |
| --- | ---: | ---: | ---: | ---: | ---: |
| zent | 13405.6 | 3.21 | 5 | 0 | 0 |
| fastify | 12485.6 | 3.37 | 9 | 0 | 0 |
| express | 9866.4 | 4.46 | 6 | 0 | 0 |

