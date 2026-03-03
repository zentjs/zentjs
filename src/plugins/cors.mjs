/**
 * cors — Middleware built-in para Cross-Origin Resource Sharing (CORS).
 *
 * Suporta:
 *   - Preflight requests (OPTIONS)
 *   - Origens configuráveis (string, array, function, '*')
 *   - Methods, headers, credentials, maxAge, exposedHeaders
 *
 * Sem dependências externas.
 *
 * @module plugins/cors
 */

/**
 * Opções padrão do CORS.
 * @type {object}
 */
const DEFAULTS = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: null,
  exposedHeaders: null,
  credentials: false,
  maxAge: null,
};

/**
 * Resolve o valor de origin a partir da configuração.
 *
 * @param {string|string[]|Function|boolean} origin - Config de origin
 * @param {string} requestOrigin - Origin do request (header)
 * @returns {Promise<string|false>} Header Access-Control-Allow-Origin ou false
 */
async function resolveOrigin(origin, requestOrigin) {
  if (origin === true || origin === '*') {
    return '*';
  }

  if (origin === false) {
    return false;
  }

  if (typeof origin === 'string') {
    return origin;
  }

  if (Array.isArray(origin)) {
    return origin.includes(requestOrigin) ? requestOrigin : false;
  }

  if (typeof origin === 'function') {
    return origin(requestOrigin);
  }

  return false;
}

/**
 * Configura os headers de CORS na resposta.
 *
 * @param {object} ctx - Contexto da requisição
 * @param {object} opts - Opções CORS resolvidas
 * @param {string} allowOrigin - Valor do Access-Control-Allow-Origin
 */
function setCorsHeaders(ctx, opts, allowOrigin) {
  ctx.res.header('Access-Control-Allow-Origin', allowOrigin);

  if (opts.credentials) {
    ctx.res.header('Access-Control-Allow-Credentials', 'true');
  }

  if (opts.exposedHeaders) {
    const value = Array.isArray(opts.exposedHeaders)
      ? opts.exposedHeaders.join(', ')
      : opts.exposedHeaders;
    ctx.res.header('Access-Control-Expose-Headers', value);
  }
}

/**
 * Configura headers adicionais para preflight (OPTIONS).
 *
 * @param {object} ctx - Contexto da requisição
 * @param {object} opts - Opções CORS resolvidas
 */
function setPreflightHeaders(ctx, opts) {
  // Methods
  const methods = Array.isArray(opts.methods)
    ? opts.methods.join(', ')
    : opts.methods;
  ctx.res.header('Access-Control-Allow-Methods', methods);

  // Allowed Headers
  if (opts.allowedHeaders) {
    const headers = Array.isArray(opts.allowedHeaders)
      ? opts.allowedHeaders.join(', ')
      : opts.allowedHeaders;
    ctx.res.header('Access-Control-Allow-Headers', headers);
  } else {
    // Reflect request headers
    const requestHeaders = ctx.req.get('access-control-request-headers');
    if (requestHeaders) {
      ctx.res.header('Access-Control-Allow-Headers', requestHeaders);
    }
  }

  // Max Age
  if (opts.maxAge !== null && opts.maxAge !== undefined) {
    ctx.res.header('Access-Control-Max-Age', String(opts.maxAge));
  }
}

/**
 * Cria o middleware CORS.
 *
 * @param {object} [opts={}]
 * @param {string|string[]|Function|boolean} [opts.origin='*'] - Origens permitidas
 * @param {string|string[]} [opts.methods='GET,HEAD,PUT,PATCH,POST,DELETE'] - Métodos permitidos
 * @param {string|string[]} [opts.allowedHeaders=null] - Headers permitidos (null = reflect)
 * @param {string|string[]} [opts.exposedHeaders=null] - Headers expostos ao browser
 * @param {boolean} [opts.credentials=false] - Permitir cookies cross-origin
 * @param {number} [opts.maxAge=null] - Cache do preflight em segundos
 * @returns {Function} Middleware (ctx, next) => Promise
 *
 * @example
 * import { cors } from 'zentjs';
 *
 * app.use(cors());
 * app.use(cors({ origin: 'https://example.com', credentials: true }));
 * app.use(cors({ origin: ['https://a.com', 'https://b.com'] }));
 */
export function cors(opts = {}) {
  const config = { ...DEFAULTS, ...opts };

  return async function corsMiddleware(ctx, next) {
    const requestOrigin = ctx.req.get('origin') || '';

    const allowOrigin = await resolveOrigin(config.origin, requestOrigin);

    // Origin não permitida — prossegue sem headers CORS
    if (allowOrigin === false) {
      return next();
    }

    // Configura headers base de CORS
    setCorsHeaders(ctx, config, allowOrigin);

    // Vary header para caches
    if (allowOrigin !== '*') {
      ctx.res.header('Vary', 'Origin');
    }

    // Preflight (OPTIONS)
    if (ctx.req.method === 'OPTIONS') {
      setPreflightHeaders(ctx, config);
      return ctx.res.empty(204);
    }

    return next();
  };
}
