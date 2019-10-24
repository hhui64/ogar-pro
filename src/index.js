import {
  CQWebSocket
} from 'cq-websocket'
import {
  common
} from "./common/main"
import {
  eventHandler as EventHandler
} from './event/handler'
import db from './db/main'

class main extends common {
  constructor() {
    super()
  }
  async init() {
    new db().init() // 连接数据库
    const bot = new CQWebSocket(this.config.client)
    const eventHandler = new EventHandler(bot)

    bot.connect()
      .on('socket.error', console.error)
      .on('socket.connecting', (wsType) => console.info('[%s] 建立连接, 请稍后...', wsType))
      .on('socket.connect', (wsType, sock, attempts) => console.success('[%s] 连接成功 ヽ(✿ﾟ▽ﾟ)ノ 尝试了%d次', wsType, attempts))
      .on('socket.failed', (wsType, attempts) => console.error('[%s] 连接失败 。･ﾟ･(つд`ﾟ)･ﾟ･ 尝试了%d次', wsType, attempts))
      // .on('api.response', (resObj) => console.info('服务器响应: %O', resObj))
      .on('socket.close', (wsType, code, desc) => console.error('[%s] 连接关闭(%d: %s)', wsType, code, desc))
      .on('ready', () => console.success('今天又是复读复读的一天 ｡:.ﾟヽ(*´∀`)ﾉﾟ.:｡'))
      .on('message', (event, context, tags) => {
        eventHandler.onMessage(event, context, tags)
        event.stopPropagation()
      })
      .on('notice', (context) => {
        eventHandler.onNotice(context)
      })
      .on('request', (context) => {
        eventHandler.onRequest(context)
      })
  }
}

new main().init()

export {
  main
}