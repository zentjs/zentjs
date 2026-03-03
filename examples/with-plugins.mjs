import { bodyParser, cors, zent } from '../src/index.mjs';

const app = zent();

app.register(
  async (scope) => {
    scope.use(cors({ origin: 'http://localhost:5173', credentials: true }));
    scope.use(bodyParser({ limit: 512 * 1024 }));

    scope.get('/health', (ctx) => {
      ctx.res.json({ ok: true });
    });

    scope.post('/echo', (ctx) => {
      ctx.res.json({ body: ctx.req.body });
    });
  },
  { prefix: '/api' }
);

const address = await app.listen({ port: 3000, host: '127.0.0.1' });
console.log(`Plugin example running at ${address}`);
