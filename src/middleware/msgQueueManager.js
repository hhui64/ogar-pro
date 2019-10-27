import MiddlewareManager from '../middlewareManager/main'

const msgQueue = {
  private: {},
  discuss: {},
  group: {}
}

const msgQueueManager = (options) => {
  MiddlewareManager.use((ctx, next, ...args) => {
    msgQueue.group[ctx.group_id] ? msgQueue.group[ctx.group_id].push(ctx) : msgQueue.group[ctx.group_id] = [ctx]
    next()
  })
}

export {
  msgQueueManager,
  msgQueue
}