import { ZentRequest } from '../http/request.mjs';
import { ZentResponse } from '../http/response.mjs';

/**
 * Objeto de contexto criado por requisição.
 * Responsabilidade única: agregar req, res, estado e referência ao app.
 * Serve como único argumento para handlers e middlewares.
 */
export class Context {
  /** @type {ZentRequest} */
  req;

  /** @type {ZentResponse} */
  res;

  /** @type {import('./application.mjs').Zent} */
  app;

  /** @type {Record<string, *>} Espaço livre para middlewares e handlers */
  state;

  /**
   * @param {import('node:http').IncomingMessage} rawReq
   * @param {import('node:http').ServerResponse} rawRes
   * @param {import('./application.mjs').Zent} app
   */
  constructor(rawReq, rawRes, app) {
    this.req = new ZentRequest(rawReq);
    this.res = new ZentResponse(rawRes);
    this.app = app;
    this.state = {};
  }
}
