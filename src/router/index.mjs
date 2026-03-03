import { RadixTree } from './radix-tree.mjs';

const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

/**
 * Router público.
 * Responsabilidade única: API de conveniência para registro e busca de rotas.
 * Delega toda a lógica de armazenamento/lookup para a RadixTree.
 */
export class Router {
  /** @type {RadixTree} */
  #tree;

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.ignoreTrailingSlash=true]
   * @param {boolean} [opts.caseSensitive=false]
   */
  constructor(opts = {}) {
    this.#tree = new RadixTree(opts);
  }

  /**
   * Registra uma rota completa.
   * @param {object} definition
   * @param {string} definition.method - HTTP method
   * @param {string} definition.path
   * @param {Function} definition.handler
   * @param {Function[]} [definition.middlewares]
   * @param {object} [definition.hooks]
   */
  route({ method, path, handler, middlewares = [], hooks = {}, ...meta }) {
    this.#tree.add(method.toUpperCase(), path, {
      handler,
      middlewares,
      hooks,
      ...meta,
    });
  }

  /**
   * Busca rota pelo método e path.
   * @param {string} method
   * @param {string} path
   * @returns {{ route: object, params: Record<string, string> }}
   */
  find(method, path) {
    return this.#tree.find(method, path);
  }

  /**
   * Registra uma rota para todos os métodos HTTP.
   * @param {string} path
   * @param {Function} handler
   * @param {object} [opts]
   */
  all(path, handler, opts = {}) {
    for (const method of HTTP_METHODS) {
      this.route({ method, path, handler, ...opts });
    }
  }

  /**
   * Agrupa rotas sob um prefixo com middlewares/hooks compartilhados.
   * @param {string} prefix - Prefixo do grupo (ex: '/api/v1')
   * @param {object} [opts] - Opções do grupo
   * @param {Function[]} [opts.middlewares] - Middlewares do grupo
   * @param {object} [opts.hooks] - Hooks do grupo
   * @param {Function} callback - Recebe um RouteGroup para registrar rotas
   */
  group(prefix, ...args) {
    const opts = typeof args[0] === 'function' ? {} : args.shift() || {};
    const callback = args[0];

    const routeGroup = new RouteGroup(this, prefix, opts);
    callback(routeGroup);
  }
}

/**
 * Proxy leve para registro de rotas dentro de um grupo.
 * Responsabilidade única: prefixar paths e mesclar middlewares/hooks do grupo.
 */
class RouteGroup {
  /** @type {Router} */
  #router;

  /** @type {string} */
  #prefix;

  /** @type {Function[]} */
  #middlewares;

  /** @type {object} */
  #hooks;

  /**
   * @param {Router} router
   * @param {string} prefix
   * @param {object} opts
   */
  constructor(router, prefix, opts = {}) {
    this.#router = router;
    this.#prefix = prefix.replace(/\/+$/, '');
    this.#middlewares = opts.middlewares || [];
    this.#hooks = opts.hooks || {};
  }

  /**
   * Registra rota no grupo, mesclando prefixo + middlewares + hooks.
   * @param {object} definition
   */
  route({ method, path, handler, middlewares = [], hooks = {} }) {
    this.#router.route({
      method,
      path: this.#prefix + (path === '/' ? '' : path),
      handler,
      middlewares: [...this.#middlewares, ...middlewares],
      hooks: this.#mergeHooks(this.#hooks, hooks),
    });
  }

  /**
   * Registra rota para todos os métodos HTTP.
   * @param {string} path
   * @param {Function} handler
   * @param {object} [opts]
   */
  all(path, handler, opts = {}) {
    for (const method of HTTP_METHODS) {
      this.route({ method, path, handler, ...opts });
    }
  }

  /**
   * Sub-grupo dentro do grupo atual.
   * @param {string} prefix
   * @param  {...any} args
   */
  group(prefix, ...args) {
    const opts = typeof args[0] === 'function' ? {} : args.shift() || {};
    const callback = args[0];

    const fullPrefix = this.#prefix + prefix.replace(/\/+$/, '');
    const mergedOpts = {
      middlewares: [...this.#middlewares, ...(opts.middlewares || [])],
      hooks: this.#mergeHooks(this.#hooks, opts.hooks || {}),
    };

    const subGroup = new RouteGroup(this.#router, fullPrefix, mergedOpts);
    callback(subGroup);
  }

  /**
   * Mescla hooks de dois escopos. Hooks do filho são executados após os do pai.
   * @param {object} parent
   * @param {object} child
   * @returns {object}
   */
  #mergeHooks(parent, child) {
    const merged = { ...parent };
    for (const [key, fns] of Object.entries(child)) {
      merged[key] = [
        ...(merged[key] || []),
        ...(Array.isArray(fns) ? fns : [fns]),
      ];
    }
    return merged;
  }
}

// Gera métodos de conveniência: router.get(), router.post(), etc.
for (const method of HTTP_METHODS) {
  /**
   * @param {string} path
   * @param {Function} handler
   * @param {object} [opts] - { middlewares?, hooks? }
   */
  Router.prototype[method.toLowerCase()] = function (path, handler, opts = {}) {
    this.route({ method, path, handler, ...opts });
  };

  RouteGroup.prototype[method.toLowerCase()] = function (
    path,
    handler,
    opts = {}
  ) {
    this.route({ method, path, handler, ...opts });
  };
}
