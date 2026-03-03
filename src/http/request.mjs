function resolvePathFromUrl(rawUrl) {
  if (!rawUrl) return '/';

  const queryIndex = rawUrl.indexOf('?');
  const path = queryIndex === -1 ? rawUrl : rawUrl.slice(0, queryIndex);

  return path || '/';
}

function resolveQueryFromUrl(rawUrl) {
  if (!rawUrl) return {};

  const queryIndex = rawUrl.indexOf('?');
  if (queryIndex === -1 || queryIndex === rawUrl.length - 1) return {};

  return Object.fromEntries(new URLSearchParams(rawUrl.slice(queryIndex + 1)));
}

function resolveHostnameFromHostHeader(host) {
  if (!host) return 'localhost';

  const rawHost = Array.isArray(host) ? host[0] : host;
  if (!rawHost) return 'localhost';

  if (rawHost.startsWith('[')) {
    const end = rawHost.indexOf(']');
    if (end !== -1) {
      return rawHost.slice(0, end + 1);
    }
  }

  const colonIndex = rawHost.indexOf(':');
  if (colonIndex === -1) return rawHost;

  return rawHost.slice(0, colonIndex);
}

/**
 * Wrapper sobre http.IncomingMessage.
 * Responsabilidade única: leitura e parse dos dados da requisição.
 */
export class ZentRequest {
  /** @type {import('node:http').IncomingMessage} */
  #raw;

  /** @type {string | undefined} */
  #pathCache;

  /** @type {Record<string, string> | undefined} */
  #queryCache;

  /** @type {string | undefined} */
  #hostnameCache;

  /** @type {Record<string, string>} */
  #params = {};

  /** @type {*} */
  #body = undefined;

  /**
   * @param {import('node:http').IncomingMessage} raw
   */
  constructor(raw) {
    this.#raw = raw;
    this.#pathCache = undefined;
    this.#queryCache = undefined;
    this.#hostnameCache = undefined;
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
    if (this.#pathCache === undefined) {
      this.#pathCache = resolvePathFromUrl(this.#raw.url);
    }

    return this.#pathCache;
  }

  /** @returns {Record<string, string>} Query params como objeto */
  get query() {
    if (this.#queryCache === undefined) {
      this.#queryCache = resolveQueryFromUrl(this.#raw.url);
    }

    return this.#queryCache;
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
    if (this.#hostnameCache === undefined) {
      this.#hostnameCache = resolveHostnameFromHostHeader(
        this.#raw.headers.host
      );
    }

    return this.#hostnameCache;
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
