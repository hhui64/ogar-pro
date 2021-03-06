import Common from '../common/main.js'

let middleware = []

export default class MiddlewareManager extends Common {
  constructor() {
    super()
    this.middlewareIndex = 0
    this.config.middleware.map(thisMiddleware => {
      try {
        const thisMiddlewareFn = require('../middleware/' + thisMiddleware)[thisMiddleware]
        thisMiddlewareFn(this.config[thisMiddleware])
        return thisMiddleware
      } catch (error) {
        console.error(error)
      }
    })
  }
  /**
   * 添加消息处理中间件
   * @param {String} type - 消息类型
   * @param {Function} fn - 中间件函数
   */
  static use(...fn) {
    middleware = middleware.concat(fn.filter(thisFn => typeof thisFn === 'function'))
    return this
  }
  /**
   * 开始执行首个中间件
   */
  go(ctx, ...args) {
    this.middlewareIndex = 0
    this.next(ctx, ...args)
  }
  /**
   * 跳转执行下一中间件
   */
  next(ctx, ...args) {
    if (this.middlewareIndex >= middleware.length && this.middlewareIndex !== 0) return
    const thisMiddleware = middleware[this.middlewareIndex++]
    if (!thisMiddleware) return
    const thisMiddlewareOptions = this.config[this.config.middleware[this.middlewareIndex - 1]]
    if (!thisMiddlewareOptions || thisMiddlewareOptions.type && !thisMiddlewareOptions.type.includes(ctx.message_type)) {
      this.next(ctx, ...args)
      return
    }
    thisMiddleware(ctx, this.next.bind(this, ctx, ...args), ...args)
    return thisMiddleware
  }
}