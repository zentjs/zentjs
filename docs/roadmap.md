# Roadmap e ADRs

## Status geral

- Fases 1–5 implementadas.
- Planejamento incremental mantido em `docs/DOCUMENTATION_TODO.md`.

## Próximas frentes

### Fase 6 — Paridade API x Runtime

- Executar `onSend` no dispatch com transformação de payload.
- Suporte completo a `app.use('/prefix', middleware)`.
- Implementar `setNotFoundHandler()` na aplicação.
- Cobrir hooks de rota além de `preHandler`.

### Fase 7 — Encapsulamento de plugins

- Isolamento real de decorators por escopo.
- Isolamento e herança controlada de hooks/middlewares.
- Garantia de não-vazamento entre plugins irmãos.

### Fase 8 — Robustez HTTP/erros

- Evitar respostas duplicadas em falhas.
- Consolidar erros de parsing de body.
- Alinhar comportamento entre `inject()` e servidor real.

### Fase 9 — Qualidade de documentação e DX

- Revisar markdown lint.
- Garantir docs alinhadas ao runtime.
- Padronizar exemplos críticos.

### Fase 10 — Performance e observabilidade

- Benchmark básico de roteamento/pipeline.
- Métricas mínimas por requisição via hooks.
- Baseline para regressão de performance.

## ADRs (resumo)

- **ADR-001:** ESM only.
- **ADR-002:** Zero dependências de runtime.
- **ADR-003:** Radix Tree para roteamento.
- **ADR-004:** Context object (`ctx`).
- **ADR-005:** Async-first em handlers/middlewares.
- **ADR-006:** Encapsulamento de plugins.
- **ADR-007:** Lazy body parsing.
