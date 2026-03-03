/**
 * PluginManager — Gerencia registro e carregamento de plugins.
 *
 * Cada plugin é uma função assíncrona que recebe uma instância
 * encapsulada do app e opções. Plugins podem registrar rotas,
 * hooks, middlewares e decorators sem vazar para o escopo pai.
 *
 * Inspirado no sistema de plugins do Fastify.
 *
 * @module plugins/manager
 */

/**
 * @typedef {object} PluginEntry
 * @property {Function} fn - Função do plugin: async (app, opts) => {}
 * @property {object} opts - Opções passadas ao plugin
 */

/**
 * Gerenciador de plugins com suporte a encapsulamento de escopo.
 * Responsabilidade única: registrar, ordenar e carregar plugins.
 */
export class PluginManager {
  /** @type {PluginEntry[]} */
  #queue;

  /** @type {boolean} */
  #loaded;

  constructor() {
    this.#queue = [];
    this.#loaded = false;
  }

  /**
   * Indica se os plugins já foram carregados.
   * @returns {boolean}
   */
  get loaded() {
    return this.#loaded;
  }

  /**
   * Registra um plugin para ser carregado posteriormente.
   *
   * @param {Function} fn - async (app, opts) => {}
   * @param {object} [opts={}] - Opções do plugin (prefix, etc.)
   * @throws {TypeError} Se fn não for uma função
   * @throws {Error} Se plugins já foram carregados
   */
  register(fn, opts = {}) {
    if (typeof fn !== 'function') {
      throw new TypeError(`Plugin must be a function, got ${typeof fn}`);
    }

    if (this.#loaded) {
      throw new Error(
        'Cannot register plugins after they have been loaded. ' +
          'Call register() before listen().'
      );
    }

    this.#queue.push({ fn, opts });
  }

  /**
   * Carrega todos os plugins registrados sequencialmente.
   * Cada plugin recebe uma instância encapsulada via `createScope`.
   *
   * @param {Function} createScope - (opts) => encapsulatedApp
   * @throws {TypeError} Se createScope não for uma função
   * @throws {Error} Se já foi carregado anteriormente
   */
  async load(createScope) {
    if (typeof createScope !== 'function') {
      throw new TypeError('createScope must be a function');
    }

    if (this.#loaded) {
      throw new Error('Plugins have already been loaded');
    }

    for (const entry of this.#queue) {
      const scopedApp = createScope(entry.opts);

      await entry.fn(scopedApp, entry.opts);
    }

    this.#loaded = true;
  }

  /**
   * Retorna o número de plugins registrados.
   * @returns {number}
   */
  get size() {
    return this.#queue.length;
  }
}
