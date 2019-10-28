import MiddlewareManager from '../middlewareManager/main'
import moment from 'moment'
import {
  CQAt
} from 'cq-websocket'

let muteRequestQueue = []

const muteRequestQueueManager = (options) => {
  MiddlewareManager.use(async (ctx, next, ...args) => {
    if (!ctx.atMe) {
      next()
      return
    }
    const bot = args[0]
    /**
     * 该群的申请队列
     */
    let gruopRequest = muteRequestQueue[ctx.group_id]
    /**
     * 确认申请禁言方法
     * 这一步一定要在取消申请判断之前处理
     */
    if (ctx.message.indexOf('确认申请') > -1) {
      if (!gruopRequest) { // 队列为空则返回, 即暂时无人申请禁言
        next()
        return
      }
      let __request = gruopRequest.find(item => item.user_id === ctx.sender.user_id)
      if (__request) { // 判断该群的申请队列中是否存在该用户的申请禁言
        console.log('确认申请禁言成功：', __request.user_id, __request.time)
        // 从队列中删除该用户的申请, 此时已判断为逻辑正确
        muteRequestQueue[ctx.group_id].splice(gruopRequest.findIndex(item => item.user_id === ctx.sender.user_id), 1)
        /**
         * 调用禁言接口
         */
        bot('set_group_ban', {
          group_id: ctx.group_id,
          user_id: __request.user_id,
          duration: __request.time
        })
        /**
         * 发送消息
         */
        bot('send_msg', {
          group_id: ctx.group_id,
          message: new CQAt(ctx.sender.user_id) + ' ' + `\n确认申请禁言成功！\n---------------------------\n申请时间：\n${ moment(__request._t, 'X').format('YYYY-MM-DD HH:mm:ss') }\n---------------------------\n执行时间：\n${ moment().format('YYYY-MM-DD HH:mm:ss') }\n---------------------------\n到期时间：\n${ moment().add(__request.c, __request.u).format('YYYY-MM-DD HH:mm:ss') }`
        })
      } else {
        bot('send_msg', {
          group_id: ctx.group_id,
          message: new CQAt(ctx.sender.user_id) + ' ' + `\n当前暂无未处理的禁言请求！\n`
        })
      }
      return
    }

    /**
     * 回复任意内容取消请求
     */
    if (gruopRequest) {
      let __requestIndex = muteRequestQueue[ctx.group_id].findIndex(item => item.user_id === ctx.sender.user_id)
      if (__requestIndex > -1) {
        console.log('已取消申请禁言：', gruopRequest[__requestIndex].user_id, gruopRequest[__requestIndex].time)
        bot('send_msg', {
          group_id: ctx.group_id,
          message: new CQAt(ctx.sender.user_id) + ' ' + `\n你已取消你在\n【${moment(gruopRequest[__requestIndex]._t, 'X').format('YYYY-MM-DD HH:mm:ss')}】\n提交的禁言申请！`
        })
        muteRequestQueue[ctx.group_id].splice(__requestIndex, 1)
        return
      }
    }

    /**
     * 申请禁言指令, 支持指定单位
     */
    if (ctx.message.indexOf('申请禁言') > -1) {
      // let __request = muteRequestQueue[ctx.group_id].find(item => item.user_id === ctx.sender.user_id)
      // if (__request) return // 此用户存在未处理的申请
      /**
       * 获取申请者信息
       */
      const userInfo = await bot('get_group_member_info', {
        group_id: ctx.group_id,
        user_id: ctx.sender.user_id
      })
      const isAdmin = userInfo.data.role !== 'member'
      if (isAdmin) { // 判断是否群主或管理员
        bot('send_msg', {
          group_id: ctx.group_id,
          message: new CQAt(ctx.sender.user_id) + ' ' + `不支持群主或管理员申请禁言！`
        })
        return
      }
      /**
       * 分析时间语法
       */
      const _regExpTime = new RegExp(/[\d]+[天|小时|分钟]+/g),
        _regExpNumber = new RegExp(/[\d]+/ig), // 数字
        _regExpChar = new RegExp(/[\u4e00-\u9fa5]+/g) // 汉字
      const _timeStr = _regExpTime.exec(ctx.message) // 正则过滤的时间字符串
      if (!_timeStr) { // 时间格式错误
        bot('send_msg', {
          group_id: ctx.group_id,
          message: new CQAt(ctx.sender.user_id) + ' ' + `\n请输入正确的格式！\n如：'@OGAR 申请禁言1小时'\n单位为：天、小时、分钟`
        })
      } else {
        let __c = _regExpNumber.exec(_timeStr[0])[0], // 时间数字
          __u = _regExpChar.exec(_timeStr[0])[0] // 单位汉字
        let time = {
          count: Number(__c),
          unit: ([{
            n: '天',
            u: 'd'
          }, {
            n: '小时',
            u: 'h'
          }, {
            n: '分钟',
            u: 'm'
          }].find(item => item.n === __u).u) // 映射英文单位标识符
        }
        let __sec = moment.duration(Number(time.count), time.unit).asSeconds() // 获取时间秒数
        /**
         * 判断申请时间是否非法, 即大于30天或小于等于0
         */
        if (__sec <= 0 || !__sec) { // 小于等于0
          bot('send_msg', {
            group_id: ctx.group_id,
            message: new CQAt(ctx.sender.user_id) + ' ' + `\n申请禁言时间不正确！\n---------------------------\n最少时间：\n1分钟`
          })
          return
        }
        if (__sec > 2591999) { // 时间过大
          // 置最长时间处理
          __sec = 2591999
          time.count = 30
          time.unit = 'd'
          __u = '天'
        }
        /**
         * 申请禁言的请求体, 用于放入队列中等待申请者的确认
         */
        const __request = {
          title: '申请禁言',
          group_id: ctx.sender.user_id,
          user_id: ctx.sender.user_id,
          time: __sec,
          _t: moment().unix(),
          c: time.count,
          u: time.unit
        }
        /**
         * 向申请者回复消息
         */
        bot('send_msg', {
          group_id: ctx.group_id,
          message: new CQAt(ctx.sender.user_id) + ' ' + `\n你确定要申请禁言【${time.count + __u}】吗？\n执行成功后在到期之前将无法以任何理由申请解除禁言！\n---------------------------\n确认申请：\n回复 '@OGAR 确认申请'\n---------------------------\n取消申请：\n回复 '@OGAR [任意内容]'`
        })
        console.log('提交申请禁言：', ctx.sender.user_id, __sec)
        /**
         * 将请求体 push 至请求队列
         */
        muteRequestQueue[ctx.group_id] ? muteRequestQueue[ctx.group_id].push(__request) : muteRequestQueue[ctx.group_id] = [__request]
      }
      return
    }

    /**
     * 交给下一个中间件处理
     */
    next()
  })
}

export {
  muteRequestQueueManager,
  muteRequestQueue
}