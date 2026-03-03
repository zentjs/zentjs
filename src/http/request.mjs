import { URL } from 'node:url';

/**
 * Wrapper sobre http.IncomingMessage.
 * Responsabilidade única: leitura e parse dos dados da requisição.
 */
export class ZentRequest {
  /** @type {import('node:http').IncomingMessage} */
  #raw;

  /** @type {URL} */
  #parsedUrl;

  /** @type {Record<string, string>} */
  #params = {};

  /** @type {*} */
  #body = undefined;

  /**
   * @param {import('node:http').IncomingMessage} raw
   */
  constructor(raw) {
    this.#raw = raw;
    this.#parsedUrl = new URL(
      raw.url,
      `http://${raw.headers.host || 'localhost'}`
    );
  }

  /** Objeto IncomingMessage original (escape hatch) */
  get raw() {
    return this.#raw;
  }

  /** @returns {string} Método HTTP em uppercase */
  get method() {
    return this.#raw.method;
  }

  /** @returns {string} URL completa (path + query) */
  get url() {
    return this.#raw.url;
  }

  /** @returns {string} Path sem query string */
  get path() {
    return this.#parsedUrl.pathname;
  }

  /** @returns {Record<string, string>} Query params como objeto */
  get query() {
    return Object.fromEntries(this.#parsedUrl.searchParams);
  }

  /** @returns {import('node:http').IncomingHttpHeaders} */
  get headers() {
    return this.#raw.headers;
  }

  /** @returns {Record<string, string>} Route params populados pelo router */
  get params() {
    return this.#params;
  }

  set params(value) {
    this.#params = value;
  }

  /** @returns {string} IP do cliente */
  get ip() {
    return this.#raw.socket.remoteAddress;
  }

  /** @returns {string} Hostname da requisição */
  get hostname() {
    return this.#parsedUrl.hostname;
  }

  /** @returns {string} 'http' ou 'https' */
  get protocol() {
    return this.#raw.socket.encrypted ? 'https' : 'http';
  }

  /** @returns {*} Body parseado (definido pelo body-parser middleware) */
  get body() {
    return this.#body;
  }

  set body(value) {
    this.#body = value;
  }

  /**
   * Retorna o valor de um header (case-insensitive).
   * @param {string} name
   * @returns {string | undefined}
   */
  get(name) {
    return this.#raw.headers[name.toLowerCase()];
  }

  /**
   * Verifica se o Content-Type bate com o tipo informado.
   * @param {string} type - Ex: 'json', 'application/json'
   * @returns {boolean}
   */
  is(type) {
    const contentType = this.get('content-type') || '';
    return contentType.includes(type);
  }
}
