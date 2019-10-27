import MiddlewareManager from '../middlewareManager/main'
import {
  CQAt
} from 'cq-websocket'
import CQApi from '../CQApi/main'

const autoReply = (options) => {
  MiddlewareManager.use((ctx, next, ...args) => {
    if (!ctx.atMe) return
    const bot = args[0]
    bot('send_msg', {
      group_id: ctx.group_id,
      message: new CQAt(ctx.sender.user_id) + ' ' + new CQApi().clearCQTag(ctx.message)
    })
  })
}

export {
  autoReply
}