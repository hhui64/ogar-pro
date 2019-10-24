/**
 * 事件监听器主模块
 * @author hhui64 <907322015@qq.com>
 */

import moment from 'moment'
import {
  common
} from '../common/main'
import {
  encrypt as Encrypt
} from '../api/main'
import {
  liveWatch as LiveWatch
} from '../live/watch'
import {
  CQAt
} from 'cq-websocket'

const encrypt = new Encrypt

class eventHandler extends common {
  constructor(bot) {
    super()
    this.middleware = []
    this.middlewareIndex = 0
    this.bot = bot
    this.method = new method(bot)
    this.msgQueue = {
      private: [],
      discuss: [],
      group: {}
    }
    this.requestMuteQueue = []
    this.AT_QQ_CQ_TAG_REG_EXP = new RegExp(/\[CQ:at,qq=([1-9]\d{5,10})\]\s?/g)
    this.QQ_REG_EXP = new RegExp(/[1-9]\d{5,10}/g)
  }
  /**
   * 添加中间件
   * @param {Function} fn - 回调函数
   */
  use(fn) {
    if (typeof fn !== 'function') throw new TypeError('中间件必须是函数！')
    this.middleware.push(fn)
    return this
  }
  /**
   * 跳转执行下一中间件
   */
  next() {
    if (this.middlewareIndex >= this.middleware) return
    let middleware = this.middleware[this.middlewareIndex++]
    if (!middleware) return
    middleware(this.bot, this.next.bind(this))
  }
  /**
   * 消息事件
   * @param {CQEvent} event 
   * @param {Object} context 
   * @param {CQTag[]} tags 
   */
  async onMessage(event, context, tags) {
    this.middlewareIndex = 0
    this.next()
    switch (context.message_type) {
      case 'private':
        // this.msgQueue.private.indexOf()
        // this.msgQueue.private.push(context.message)
        break
      case 'discuss':
        // this.msgQueue.discuss.push(context.message)
        break
      case 'group':
        context.message_at = this.getAtQQList(context.message)
        this.msgQueue.group[context.group_id] ? this.msgQueue.group[context.group_id].push(context) : this.msgQueue.group[context.group_id] = [context]
        if (context.message_at.includes(this.config.client.qq)) {
          const prefix = `[CQ:at,qq=${this.config.client.qq}] `
          context.message = context.message.replace(prefix, '') // 去除 @ 机器人的 CQAt 码
          context.message_at.remove(this.config.client.qq) // 同上
          /**
           * 直播间开播状态查询
           */
          if (context.message.indexOf('开播了吗') !== -1 || context.message.indexOf('开播了嘛') !== -1) {
            const liveWatch = new LiveWatch(this.bot),
              liveState = await liveWatch.getLiveState(348449290)
            this.bot('send_msg', {
              group_id: context.group_id,
              message: new CQAt(context.sender.user_id) + ' ' + (liveState ? '勤奋的奶铃正在直播！点击进入直播间：https://cc.163.com/348449290/' : '当前没有检测到开播，奶铃正在偷懒中……')
            })
            return
          }
          /**
           * 确认申请禁言方法
           * 这一步一定要在取消申请判断之前处理
           */
          if (context.message.indexOf('确认申请') !== -1) {
            let gruopRequest = this.requestMuteQueue[context.group_id] // 获取该群的申请队列
            if (!gruopRequest) return // 队列为空则返回, 即暂时无人申请禁言
            let __request = gruopRequest.find(item => item.user_id === context.sender.user_id)
            if (__request) { // 判断该群的申请队列中是否存在该用户的申请禁言
              console.log('确认申请禁言成功：', __request.user_id, __request.time)
              // 从队列中删除该用户的申请, 此时已判断为逻辑正确
              this.requestMuteQueue[context.group_id].splice(gruopRequest.findIndex(item => item.user_id === context.sender.user_id), 1)
              /**
               * 调用禁言接口
               */
              this.bot('set_group_ban', {
                group_id: context.group_id,
                user_id: __request.user_id,
                duration: __request.time
              })
              /**
               * 发送消息
               */
              this.bot('send_msg', {
                group_id: context.group_id,
                message: new CQAt(context.sender.user_id) + ' ' + `\n确认申请禁言成功！\n---------------------------\n申请时间：\n${moment(__request._t, 'X').format('YYYY-MM-DD HH:mm:ss')}\n---------------------------\n执行时间：\n${moment().format('YYYY-MM-DD HH:mm:ss')}\n---------------------------\n到期时间：\n${moment().add(__request.c, __request.u).format('YYYY-MM-DD HH:mm:ss')}`
              })
            } else {
              // ... 无请求
            }
            return
          }
          /**
           * 回复任意内容取消请求
           */
          let gruopRequest = this.requestMuteQueue[context.group_id]
          if (gruopRequest) {
            let __requestIndex = this.requestMuteQueue[context.group_id].findIndex(item => item.user_id === context.sender.user_id)
            if (__requestIndex >= 0) {
              console.log('已取消申请禁言：', gruopRequest[__requestIndex].user_id, gruopRequest[__requestIndex].time)
              this.bot('send_msg', {
                group_id: context.group_id,
                message: new CQAt(context.sender.user_id) + ' ' + `\n你已取消你在\n【${moment(gruopRequest[__requestIndex]._t, 'X').format('YYYY-MM-DD HH:mm:ss')}】\n提交的禁言申请！`
              })
              this.requestMuteQueue[context.group_id].splice(__requestIndex, 1)
              return
            } else {
              // 请求队列中没有当前用户的申请禁言请求
              return
            }
          }
          /**
           * 申请禁言指令, 支持指定单位
           */
          if (context.message.indexOf('申请禁言') !== -1) {
            // let __request = this.requestMuteQueue[context.group_id].find(item => item.user_id === context.sender.user_id)
            // if (__request) return // 此用户存在未处理的申请
            /**
             * 获取申请者信息
             */
            const userInfo = await this.bot('get_group_member_info', {
              group_id: context.group_id,
              user_id: context.sender.user_id
            })
            const isAdmin = userInfo.data.role !== 'member'
            if (isAdmin) { // 判断是否群主或管理员
              this.bot('send_msg', {
                group_id: context.group_id,
                message: new CQAt(context.sender.user_id) + ' ' + `不支持群主或管理员申请禁言！`
              })
              return
            }
            /**
             * 分析时间语法
             */
            const _regExpTime = new RegExp(/[\d]+[天|小时|分钟]+/g),
              _regExpNumber = new RegExp(/[\d]+/ig), // 数字
              _regExpChar = new RegExp(/[\u4e00-\u9fa5]+/g) // 汉字
            const _timeStr = _regExpTime.exec(context.message) // 正则过滤的时间字符串
            if (!_timeStr) { // 时间格式错误
              this.bot('send_msg', {
                group_id: context.group_id,
                message: new CQAt(context.sender.user_id) + ' ' + `\n请输入正确的格式！\n如：'@OGAR 申请禁言1小时'\n单位为：天、小时、分钟`
              })
              // return
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
                this.bot('send_msg', {
                  group_id: context.group_id,
                  message: new CQAt(context.sender.user_id) + ' ' + `\n申请禁言时间不正确！\n---------------------------\n最少时间：\n1分钟`
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
                group_id: context.sender.user_id,
                user_id: context.sender.user_id,
                time: __sec,
                _t: moment().unix(),
                c: time.count,
                u: time.unit
              }
              /**
               * 向申请者回复消息
               */
              this.bot('send_msg', {
                group_id: context.group_id,
                message: new CQAt(context.sender.user_id) + ' ' + `\n你确定要申请禁言【${time.count + __u}】吗？\n执行成功后在到期之前将无法以任何理由申请解除禁言！\n---------------------------\n确认申请：\n回复 '@OGAR 确认申请'\n---------------------------\n取消申请：\n回复 '@OGAR [任意内容]'`
              })
              console.log('提交申请禁言：', context.sender.user_id, __sec)
              /**
               * 将请求体 push 至请求队列
               */
              this.requestMuteQueue[context.group_id] ? this.requestMuteQueue[context.group_id].push(__request) : this.requestMuteQueue[context.group_id] = [__request]
            }
            return
          }
          /**
           * 在这里处理处理机器人被 at 事件
           * 这里只简单的实现了一个复读机的功能
           */
          this.bot('send_msg', {
            group_id: context.group_id,
            message: new CQAt(context.sender.user_id) + ' ' + this.clearCQTag(context.message)
          })
          return
        }
        break
      default:
        break
    }
  }
  /**
   * 群文件上傳, 群管變動, 群成員增減, 好友添加...等QQ事件
   * @param {Object} context 
   */
  async onNotice(context) {
    console.info('onNotice', context)
  }
  /**
   * 好友請求, 群請求/群邀請...等QQ事件
   * @param {Object} context - 消息内容
   */
  async onRequest(context) {
    switch (context.request_type) {
      case 'friend':
        // 被申请添加好友...
        break
      case 'group':
        switch (context.sub_type) {
          case 'add':
            this.groupAddRequest(context)
            break
          case 'invite':
            // 被邀请进群...
            break
          default:
            break
        }
        break
      default:
        break
    }
  }
  /**
   * 加群请求自动判断处理方法
   * @param {Object} context 
   */
  groupAddRequest(context) {
    const thisGroupAutoApproveOptions = this.config.groupRules[context.group_id] ? this.config.groupRules[context.group_id].autoApprove : null
    if (!thisGroupAutoApproveOptions) return // 没有在 groupQuestionOptions 中的群号则跳过不处理
    const requestContent = context.comment.split('\n').map(item => item.substr(3, item.length)), // 分割问题和答案内容
      matching = thisGroupAutoApproveOptions.keywords.filter(item => requestContent[1].indexOf(item) !== 0), // 判断回答中是否包含关键词
      isHasKeywords = matching.length > 0
    this.bot('set_group_add_request', {
      flag: context.flag,
      sub_type: 'add',
      approve: isHasKeywords,
      reason: !isHasKeywords ? thisGroupAutoApproveOptions.rejectMessage : ''
    })
  }
  /**
   * 获取 message 中被艾特的成员
   * @param {String} str - 带有原始 CQAt 码的原始字符串内容
   * @returns {Array[]} 被艾特的 QQ 号码数组
   */
  getAtQQList(str) {
    const CQTags = str.match(this.AT_QQ_CQ_TAG_REG_EXP)
    return CQTags ? CQTags.unique().map(item => item.match(this.QQ_REG_EXP).toString()) : []
  }
  /**
   * 清除 message 中的 CQAt 码
   * @param {String} str - 原始字符串内容
   * @returns {String} 处理后的字符串内容
   */
  clearCQTag(str) {
    return str.replace(this.AT_QQ_CQ_TAG_REG_EXP, '')
  }
}

class method extends common {
  constructor(bot) {
    super()
    this.bot = bot
  }
}

// if (context.message.startsWith('我要静静')) {
//   if (context.sender.role === 'member') {
//     bot('set_group_ban', {
//       group_id: context.group_id,
//       user_id: context.sender.user_id,
//       duration: 60 * 30
//     })
//   }
//   bot('send_msg', {
//     group_id: context.group_id,
//     message: new CQAt(context.sender.user_id) + ' ' + '麻烦你冷静冷静！'
//   })
// } else if (context.message.startsWith('干他')) {
//   if (context.message_at.length > 0) {
//     if (context.message_at[0] == context.sender.user_id) {
//       bot('send_msg', {
//         group_id: context.group_id,
//         message: new CQAt(context.sender.user_id) + ' ' + '不可以干你自己'
//       })
//       return
//     }
//     const ganUserInfo = await bot('get_group_member_info', {
//       group_id: context.group_id,
//       user_id: context.message_at[0]
//     })
//     // console.info(ganUserInfo)
//     const chance = 35.7
//     const chance_gan = (100 - chance) * 10
//     const chance_100 = 100 * 10
//     const i = encrypt.getRandomNum(0, chance_100)
//     const muteTime = encrypt.getRandomNum(60, 300)
//     if (ganUserInfo.data.role !== 'member') {
//       bot('send_msg', {
//         group_id: context.group_id,
//         message: `${new CQAt(context.sender.user_id)} 你因涉嫌袭击 ${ ganUserInfo.data.role=='admin' ? '管理员' : '群主'} 而被惩戒禁言 ${muteTime} 秒！`
//       })
//       bot('set_group_ban', {
//         group_id: context.group_id,
//         user_id: context.sender.user_id,
//         duration: muteTime
//       })
//       return
//     }
//     if (i >= chance_gan) {
//       bot('send_msg', {
//         group_id: context.group_id,
//         message: `${new CQAt(context.sender.user_id)} 你使出浑身力量把板砖砸向了 ${new CQAt(context.message_at[0])} 的脑袋，造成了 ${i} 点伤害，对方因没有练好铁头功而被送去医院治疗，已被禁言 ${muteTime} 秒！`
//       })
//       bot('set_group_ban', {
//         group_id: context.group_id,
//         user_id: context.message_at[0],
//         duration: muteTime
//       })
//       return

//     } else {
//       bot('send_msg', {
//         group_id: context.group_id,
//         message: `${new CQAt(context.sender.user_id)} 你使出浑身力量把板砖砸向了 ${new CQAt(context.message_at[0])} 的脑袋，造成了 ${i} 点伤害，但是耶稣帮他挡住了这块板砖，并把你禁言了 ${muteTime*2} 秒！`
//       })
//       bot('set_group_ban', {
//         group_id: context.group_id,
//         user_id: context.sender.user_id,
//         duration: muteTime * 2
//       })
//       return
//     }

//   }

//   return
// } else if (context.message.startsWith('搞他')) {
//   //
// } else {
//   bot('send_msg', {
//     group_id: context.group_id,
//     message: new CQAt(context.sender.user_id) + ' ' + this.clearCQTag(context.message)
//   })
// }

export {
  eventHandler
}