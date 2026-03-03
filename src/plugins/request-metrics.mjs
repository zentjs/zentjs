/**
 * requestMetrics — Plugin de observabilidade mínima baseado em hooks.
 *
 * Registra hooks de onRequest/onResponse para capturar:
 * - method
 * - path
 * - statusCode
 * - durationMs
 *
 * @module plugins/request-metrics
 */

/**
 * @typedef {object} RequestMetricRecord
 * @property {string} method
 * @property {string} path
 * @property {number} statusCode
 * @property {number} durationMs
 */

/**
 * @typedef {object} RequestMetricsOptions
 * @property {(record: RequestMetricRecord, ctx: object) => void | Promise<void>} [onRecord]
 * @property {() => bigint} [clock]
 * @property {string} [stateKey]
 */

/**
 * Cria hooks para coletar métricas por requisição.
 *
 * @param {RequestMetricsOptions} [opts={}]
 * @returns {{ onRequest: Function, onResponse: Function }}
 */
export function requestMetrics(opts = {}) {
  const onRecord = opts.onRecord || (async () => {});
  const clock = opts.clock || process.hrtime.bigint;
  const stateKey = opts.stateKey || '__zent_request_metrics_start';

  return {
    async onRequest(ctx) {
      ctx.state[stateKey] = clock();
    },

    async onResponse(ctx) {
      const start = ctx.state[stateKey];
      if (typeof start !== 'bigint') return;

      const durationMs = Number(clock() - start) / 1_000_000;

      const record = {
        method: ctx.req.method,
        path: ctx.req.path,
        statusCode: ctx.res.statusCode,
        durationMs,
      };

      await onRecord(record, ctx);
    },
  };
}

/**
 * Cria plugin escopado para registrar hooks de requestMetrics.
 * @param {RequestMetricsOptions} [opts={}]
 * @returns {(app: object) => Promise<void>}
 */
export function requestMetricsPlugin(opts = {}) {
  const hooks = requestMetrics(opts);

  return async function registerRequestMetrics(app) {
    app.addHook('onRequest', hooks.onRequest);
    app.addHook('onResponse', hooks.onResponse);
  };
}
