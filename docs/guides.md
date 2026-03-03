# Guias Práticos

## Hello World

```js
import { zent } from '@zentjs/zentjs';

const app = zent();

app.get('/', (ctx) => {
  return ctx.res.json({ hello: 'world' });
});

app.listen({ port: 3000 });
```

## CRUD básico

```js
import { NotFoundError, bodyParser, zent } from '@zentjs/zentjs';

const app = zent();
app.use(bodyParser());

const users = new Map();
let nextId = 1;

app.get('/users', (ctx) => ctx.res.json([...users.values()]));

app.get('/users/:id', (ctx) => {
  const user = users.get(Number(ctx.req.params.id));
  if (!user) throw new NotFoundError('User not found');
  return ctx.res.json(user);
});

app.post('/users', (ctx) => {
  const user = { id: nextId++, ...ctx.req.body };
  users.set(user.id, user);
  return ctx.res.status(201).json(user);
});

app.listen({ port: 3000 });
```

## Autenticação por plugin

```js
import { UnauthorizedError, zent } from '@zentjs/zentjs';

async function authPlugin(app) {
  app.decorate('authenticate', async (ctx) => {
    const token = ctx.req.get('authorization');
    if (!token) throw new UnauthorizedError('Missing token');
  });

  app.addHook('preHandler', async (ctx) => {
    await app.authenticate(ctx);
  });
}
```

## Métricas por requisição

```js
import { requestMetrics, zent } from '@zentjs/zentjs';

const app = zent();

const metrics = requestMetrics({
  onRecord: (record) => console.log(record),
});

app.addHook('onRequest', metrics.onRequest);
app.addHook('onResponse', metrics.onResponse);
```

## Testes com inject + Vitest

```js
import { describe, expect, it } from 'vitest';
import { zent } from '@zentjs/zentjs';

describe('API', () => {
  it('should return hello world', async () => {
    const app = zent();
    app.get('/', (ctx) => ctx.res.json({ hello: 'world' }));

    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ hello: 'world' });
  });
});
```

## Exemplos do repositório

- `examples/hello-world.mjs`
- `examples/rest-api.mjs`
- `examples/with-plugins.mjs`
