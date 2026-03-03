# Arquitetura

## Visão geral

O ZentJS é uma framework HTTP para Node.js com foco em simplicidade e desempenho:

- Core sem dependências de runtime
- ESM nativo
- Roteamento por Radix Tree
- Middlewares assíncronos com modelo onion
- Hooks de ciclo de vida
- Sistema de plugins com encapsulamento

## Componentes principais

- `Application` (`src/core/application.mjs`): orquestra servidor, router, hooks, plugins e middlewares.
- `Router` (`src/router/*`): resolve rotas estáticas, parâmetros e wildcard.
- `Request` (`src/http/request.mjs`): wrapper de `IncomingMessage`.
- `Response` (`src/http/response.mjs`): wrapper fluente de `ServerResponse`.
- `Pipeline` (`src/middleware/pipeline.mjs`): composição de middlewares `async (ctx, next)`.
- `Lifecycle` (`src/hooks/lifecycle.mjs`): gerência de hooks globais e por rota.
- `Plugin Manager` (`src/plugins/manager.mjs`): registro, carregamento e escopo encapsulado.
- `Error Handler` (`src/errors/*`): padronização de erros HTTP.

## Fluxo de requisição

Ordem geral (quando a rota existe):

1. `onRequest`
2. `preParsing`
3. `preValidation`
4. Pipeline de middlewares
5. `preHandler`
6. Handler da rota
7. `onSend` (quando aplicável)
8. `onResponse`

Em caso de erro:

1. `onError` global
2. `onError` da rota
3. `setErrorHandler()` customizado ou fallback padrão

## Encapsulamento de plugins

No runtime atual:

- Pai → filho: herda decorators, hooks, middlewares e prefixo.
- Filho → pai: não propaga estado.
- Irmãos: não compartilham estado local.

Isso permite composição modular sem vazamento de comportamento entre escopos.
