/**
 * Nó da Radix Tree.
 * Responsabilidade única: armazenar um fragmento do path e seus filhos/handlers.
 */
export class Node {
  /** @type {string} Fragmento do path */
  prefix;

  /** @type {Map<string, Node>} Filhos indexados pelo primeiro char */
  children;

  /** @type {Node | null} Filho de parâmetro (:param) */
  paramChild;

  /** @type {string | null} Nome do parâmetro (ex: 'id') */
  paramName;

  /** @type {Node | null} Filho wildcard (*) */
  wildcardChild;

  /** @type {string | null} Nome do wildcard */
  wildcardName;

  /** @type {Map<string, object>} Handlers por método HTTP */
  handlers;

  /**
   * @param {string} [prefix='']
   */
  constructor(prefix = '') {
    this.prefix = prefix;
    this.children = new Map();
    this.paramChild = null;
    this.paramName = null;
    this.wildcardChild = null;
    this.wildcardName = null;
    this.handlers = new Map();
  }

  /**
   * Adiciona um handler para um método HTTP.
   * @param {string} method
   * @param {object} route - { handler, hooks, middlewares }
   */
  addHandler(method, route) {
    this.handlers.set(method, route);
  }

  /**
   * Busca o handler para um método HTTP.
   * @param {string} method
   * @returns {object | undefined}
   */
  getHandler(method) {
    return this.handlers.get(method);
  }

  /**
   * @returns {boolean} Nó possui pelo menos um handler registrado
   */
  get hasHandlers() {
    return this.handlers.size > 0;
  }

  /**
   * Retorna os métodos HTTP registrados neste nó.
   * @returns {string[]}
   */
  get allowedMethods() {
    return [...this.handlers.keys()];
  }
}
