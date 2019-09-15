import {
  CQWebSocket
} from 'cq-websocket'
import {
  common
} from "./common/manager"
import config from '../configs/config.json'
import {
  eventHandler as EventHandler
} from './event/handler'
import Axios from 'axios'
import { liveWatch as LiveWatch } from './live/watch'

(async function () {
  const bot = new CQWebSocket(config.client)
  const eventHandler = new EventHandler(bot)
  // new LiveWatch(bot).init()
  bot.connect()
    .on('socket.error', console.error)
    .on('socket.connecting', (wsType) => console.log('[%s] 建立连接, 请稍后...', wsType))
    .on('socket.connect', (wsType, sock, attempts) => console.log('[%s] 连接成功 ヽ(✿ﾟ▽ﾟ)ノ 尝试了%d次', wsType, attempts))
    .on('socket.failed', (wsType, attempts) => console.log('[%s] 连接失败 。･ﾟ･(つд`ﾟ)･ﾟ･ 尝试了%d次', wsType, attempts))
    // .on('api.response', (resObj) => console.log('服务器响应: %O', resObj))
    .on('socket.close', (wsType, code, desc) => console.log('[%s] 连接关闭(%d: %s)', wsType, code, desc))
    .on('ready', () => console.log('今天又是复读复读的一天 ｡:.ﾟヽ(*´∀`)ﾉﾟ.:｡'))
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
})()