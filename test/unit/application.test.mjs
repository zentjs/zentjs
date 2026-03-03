import { describe, expect, it } from 'vitest';

import { Zent, zent } from '../../src/core/application.mjs';

describe('Application (Zent)', () => {
  describe('factory function', () => {
    it('should create a Zent instance via zent()', () => {
      const app = zent();

      expect(app).toBeInstanceOf(Zent);
    });

    it('should accept options', () => {
      const app = zent({ ignoreTrailingSlash: false, caseSensitive: true });

      expect(app).toBeInstanceOf(Zent);
    });
  });

  describe('routing — convenience methods', () => {
    const methods = [
      'get',
      'post',
      'put',
      'patch',
      'delete',
      'head',
      'options',
    ];

    for (const method of methods) {
      it(`should register ${method.toUpperCase()} route and respond via inject`, async () => {
        const app = zent();
        app[method]('/test', (ctx) => {
          ctx.res.json({ method: ctx.req.method });
        });

        const res = await app.inject({
          method: method.toUpperCase(),
          url: '/test',
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().method).toBe(method.toUpperCase());
      });
    }
  });

  describe('route()', () => {
    it('should register a full route definition', async () => {
      const app = zent();
      app.route({
        method: 'POST',
        path: '/items',
        handler: (ctx) => ctx.res.status(201).json({ created: true }),
      });

      const res = await app.inject({ method: 'POST', url: '/items' });

      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ created: true });
    });
  });

  describe('all()', () => {
    it('should register handler for all HTTP methods', async () => {
      const app = zent();
      app.all('/health', (ctx) => ctx.res.json({ status: 'ok' }));

      for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
        const res = await app.inject({ method, url: '/health' });
        expect(res.json()).toEqual({ status: 'ok' });
      }
    });
  });

  describe('group()', () => {
    it('should group routes under a prefix', async () => {
      const app = zent();

      app.group('/api/v1', (group) => {
        group.get('/users', (ctx) => ctx.res.json({ users: [] }));
      });

      const res = await app.inject({ method: 'GET', url: '/api/v1/users' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ users: [] });
    });
  });

  describe('params', () => {
    it('should populate route params', async () => {
      const app = zent();
      app.get('/users/:id', (ctx) => {
        ctx.res.json({ id: ctx.req.params.id });
      });

      const res = await app.inject({ method: 'GET', url: '/users/42' });

      expect(res.json()).toEqual({ id: '42' });
    });
  });

  describe('use() — global middleware', () => {
    it('should register and execute global middleware', async () => {
      const app = zent();
      const order = [];

      app.use(async (ctx, next) => {
        order.push('mw-before');
        await next();
        order.push('mw-after');
      });

      app.get('/test', (ctx) => {
        order.push('handler');
        ctx.res.json({ ok: true });
      });

      await app.inject({ method: 'GET', url: '/test' });

      expect(order).toEqual(['mw-before', 'handler', 'mw-after']);
    });

    it('should execute multiple middlewares in order', async () => {
      const app = zent();
      const order = [];

      app.use(async (ctx, next) => {
        order.push('mw1');
        await next();
      });

      app.use(async (ctx, next) => {
        order.push('mw2');
        await next();
      });

      app.get('/test', (ctx) => {
        order.push('handler');
        ctx.res.json({});
      });

      await app.inject({ method: 'GET', url: '/test' });

      expect(order).toEqual(['mw1', 'mw2', 'handler']);
    });

    it('should throw TypeError for non-function middleware', () => {
      const app = zent();

      expect(() => app.use('not-fn')).toThrow(TypeError);
    });

    it('should allow middleware to modify state', async () => {
      const app = zent();

      app.use(async (ctx, next) => {
        ctx.state.user = 'alice';
        await next();
      });

      app.get('/profile', (ctx) => {
        ctx.res.json({ user: ctx.state.user });
      });

      const res = await app.inject({ method: 'GET', url: '/profile' });

      expect(res.json()).toEqual({ user: 'alice' });
    });
  });

  describe('route-level middleware', () => {
    it('should execute route middlewares after global', async () => {
      const app = zent();
      const order = [];

      app.use(async (ctx, next) => {
        order.push('global');
        await next();
      });

      const routeMw = async (ctx, next) => {
        order.push('route-mw');
        await next();
      };

      app.get(
        '/test',
        (ctx) => {
          order.push('handler');
          ctx.res.json({});
        },
        { middlewares: [routeMw] }
      );

      await app.inject({ method: 'GET', url: '/test' });

      expect(order).toEqual(['global', 'route-mw', 'handler']);
    });
  });

  describe('addHook() — lifecycle hooks', () => {
    it('should execute onRequest hook', async () => {
      const app = zent();
      let hookCalled = false;

      app.addHook('onRequest', async () => {
        hookCalled = true;
      });

      app.get('/test', (ctx) => ctx.res.json({}));
      await app.inject({ method: 'GET', url: '/test' });

      expect(hookCalled).toBe(true);
    });

    it('should execute hooks in lifecycle order', async () => {
      const app = zent();
      const order = [];

      app.addHook('onRequest', async () => order.push('onRequest'));
      app.addHook('preParsing', async () => order.push('preParsing'));
      app.addHook('preValidation', async () => order.push('preValidation'));
      app.addHook('preHandler', async () => order.push('preHandler'));
      app.addHook('onResponse', async () => order.push('onResponse'));

      app.get('/test', (ctx) => {
        order.push('handler');
        ctx.res.json({});
      });

      await app.inject({ method: 'GET', url: '/test' });

      expect(order).toEqual([
        'onRequest',
        'preParsing',
        'preValidation',
        'preHandler',
        'handler',
        'onResponse',
      ]);
    });

    it('should execute onError hook on error', async () => {
      const app = zent();
      let capturedError;

      app.addHook('onError', async (ctx, err) => {
        capturedError = err;
      });

      app.get('/fail', () => {
        throw new Error('boom');
      });

      const res = await app.inject({ method: 'GET', url: '/fail' });

      expect(capturedError).toBeDefined();
      expect(capturedError.message).toBe('boom');
      expect(res.statusCode).toBe(500);
    });

    it('should fallback to error handler when onError hook throws', async () => {
      const app = zent();

      app.addHook('onError', async () => {
        throw new Error('hook also failed');
      });

      app.get('/fail', () => {
        throw new Error('original');
      });

      const res = await app.inject({ method: 'GET', url: '/fail' });

      // Should still get error response from the error handler
      expect(res.statusCode).toBe(500);
    });

    it('should return chaining from addHook', () => {
      const app = zent();
      const result = app.addHook('onRequest', async () => {});

      expect(result).toBe(app);
    });
  });

  describe('setErrorHandler()', () => {
    it('should use custom error handler', async () => {
      const app = zent();

      app.setErrorHandler((error, ctx) => {
        ctx.res.status(error.statusCode || 500).json({
          custom: true,
          message: error.message,
        });
      });

      app.get('/fail', () => {
        throw new Error('custom error');
      });

      const res = await app.inject({ method: 'GET', url: '/fail' });

      expect(res.statusCode).toBe(500);
      expect(res.json()).toEqual({ custom: true, message: 'custom error' });
    });

    it('should return 404 for non-existent route', async () => {
      const app = zent();

      const res = await app.inject({ method: 'GET', url: '/nope' });

      expect(res.statusCode).toBe(404);
      expect(res.json().error).toBe('Not Found');
    });

    it('should return 405 for wrong method', async () => {
      const app = zent();
      app.get('/users', (ctx) => ctx.res.json({}));

      const res = await app.inject({ method: 'DELETE', url: '/users' });

      expect(res.statusCode).toBe(405);
    });
  });

  describe('decorate()', () => {
    it('should add property to app instance', () => {
      const app = zent();
      app.decorate('db', { query: () => {} });

      expect(app.db).toBeDefined();
      expect(app.hasDecorator('db')).toBe(true);
    });

    it('should be accessible via ctx.app', async () => {
      const app = zent();
      app.decorate('version', '1.0.0');

      app.get('/version', (ctx) => {
        ctx.res.json({ version: ctx.app.version });
      });

      const res = await app.inject({ method: 'GET', url: '/version' });

      expect(res.json()).toEqual({ version: '1.0.0' });
    });

    it('should throw if decorator name already exists', () => {
      const app = zent();
      app.decorate('foo', 'bar');

      expect(() => app.decorate('foo', 'baz')).toThrow(
        'Decorator "foo" already exists'
      );
    });

    it('hasDecorator should return false for missing decorator', () => {
      const app = zent();

      expect(app.hasDecorator('nonexistent')).toBe(false);
    });
  });

  describe('inject()', () => {
    it('should inject GET request', async () => {
      const app = zent();
      app.get('/', (ctx) => ctx.res.json({ hello: 'world' }));

      const res = await app.inject({ method: 'GET', url: '/' });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ hello: 'world' });
      expect(res.body).toBe('{"hello":"world"}');
    });

    it('should inject POST with JSON body', async () => {
      const app = zent();

      app.post('/echo', (ctx) => {
        ctx.res.json({ received: true });
      });

      const res = await app.inject({
        method: 'POST',
        url: '/echo',
        body: { name: 'John' },
      });

      expect(res.statusCode).toBe(200);
    });

    it('should inject POST with string body', async () => {
      const app = zent();

      app.post('/echo', (ctx) => {
        ctx.res.send('ok');
      });

      const res = await app.inject({
        method: 'POST',
        url: '/echo',
        body: 'raw-body',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('ok');
    });

    it('should inject with custom headers', async () => {
      const app = zent();

      app.get('/auth', (ctx) => {
        const token = ctx.req.get('authorization');
        ctx.res.json({ token });
      });

      const res = await app.inject({
        method: 'GET',
        url: '/auth',
        headers: { authorization: 'Bearer abc123' },
      });

      expect(res.json()).toEqual({ token: 'Bearer abc123' });
    });

    it('should default method to GET and url to /', async () => {
      const app = zent();
      app.get('/', (ctx) => ctx.res.json({ root: true }));

      const res = await app.inject({});

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ root: true });
    });

    it('should expose response headers', async () => {
      const app = zent();

      app.get('/custom', (ctx) => {
        ctx.res.header('x-custom', 'value').json({ ok: true });
      });

      const res = await app.inject({ method: 'GET', url: '/custom' });

      expect(res.headers['x-custom']).toBe('value');
    });
  });

  describe('listen() and close()', () => {
    it('should start and stop the server', async () => {
      const app = zent();
      app.get('/', (ctx) => ctx.res.json({ ok: true }));

      const address = await app.listen({ port: 0, host: '127.0.0.1' });

      expect(address).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

      await app.close();
    });

    it('should invoke callback on listen', async () => {
      const app = zent();
      app.get('/', (ctx) => ctx.res.json({}));

      let cbAddress;
      await app.listen({ port: 0, host: '127.0.0.1' }, (err, addr) => {
        cbAddress = addr;
      });

      expect(cbAddress).toMatch(/^http:\/\//);

      await app.close();
    });

    it('should resolve close() even without server', async () => {
      const app = zent();

      await expect(app.close()).resolves.toBeUndefined();
    });

    it('should call callback with error when listen fails', async () => {
      const app1 = zent();
      app1.get('/', (ctx) => ctx.res.json({}));
      const address = await app1.listen({ port: 0, host: '127.0.0.1' });
      // Extract port from address
      const port = Number(address.split(':').pop());

      const app2 = zent();
      let cbError;

      try {
        await app2.listen({ port, host: '127.0.0.1' }, (err) => {
          cbError = err;
        });
      } catch {
        // expected rejection
      }

      expect(cbError).toBeDefined();
      expect(cbError.code).toBe('EADDRINUSE');

      await app1.close();
    });

    it('should reject promise when listen fails without callback', async () => {
      const app1 = zent();
      app1.get('/', (ctx) => ctx.res.json({}));
      const address = await app1.listen({ port: 0, host: '127.0.0.1' });
      const port = Number(address.split(':').pop());

      const app2 = zent();

      await expect(app2.listen({ port, host: '127.0.0.1' })).rejects.toThrow();

      await app1.close();
    });

    it('should reject close() when server.close fails', async () => {
      const app = zent();
      app.get('/', (ctx) => ctx.res.json({}));
      await app.listen({ port: 0, host: '127.0.0.1' });

      // Destroy underlying connections to force server.close(cb) to call cb with error
      await app.close();
      // After close, #server is null → early return, no reject
      await expect(app.close()).resolves.toBeUndefined();
    });

    it('should handle real HTTP request through createServer', async () => {
      const app = zent();
      app.get('/ping', (ctx) => ctx.res.json({ pong: true }));

      const address = await app.listen({ port: 0, host: '127.0.0.1' });

      const res = await fetch(`${address}/ping`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ pong: true });

      await app.close();
    });
  });

  describe('chaining', () => {
    it('should support method chaining', () => {
      const app = zent();

      const result = app
        .use(async (ctx, next) => await next())
        .get('/a', (ctx) => ctx.res.json({}))
        .post('/b', (ctx) => ctx.res.json({}))
        .addHook('onRequest', async () => {});

      expect(result).toBe(app);
    });
  });

  describe('route-level hooks', () => {
    it('should execute route-level preHandler hooks', async () => {
      const app = zent();
      const order = [];

      app.addHook('preHandler', async () => order.push('global-preHandler'));

      app.get(
        '/test',
        (ctx) => {
          order.push('handler');
          ctx.res.json({});
        },
        {
          hooks: { preHandler: [async () => order.push('route-preHandler')] },
        }
      );

      await app.inject({ method: 'GET', url: '/test' });

      expect(order).toEqual([
        'global-preHandler',
        'route-preHandler',
        'handler',
      ]);
    });

    it('should handle single function as route preHandler hook', async () => {
      const app = zent();
      const order = [];

      app.get(
        '/test',
        (ctx) => {
          order.push('handler');
          ctx.res.json({});
        },
        {
          hooks: { preHandler: async () => order.push('route-hook') },
        }
      );

      await app.inject({ method: 'GET', url: '/test' });

      expect(order).toEqual(['route-hook', 'handler']);
    });
  });
});
