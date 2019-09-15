import {
  common
} from '../common/manager'
import {
  encrypt as Encrypt
} from '../api/manager'
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
    this.bot = bot
    this.method = new method(bot)
    this.msgQueue = {
      private: [],
      discuss: [],
      group: {}
    }
    this.AT_QQ_CQ_TAG_REG_EXP = new RegExp(/\[CQ:at,qq=([1-9]\d{5,10})\]\s?/g)
    this.QQ_REG_EXP = new RegExp(/[1-9]\d{5,10}/g)
  }
  /**
   * 消息事件
   * @param {CQEvent} event 
   * @param {Object} context 
   * @param {CQTag[]} tags 
   */
  async onMessage(event, context, tags) {
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
    const groupQuestionOptions = [{
      group_id: 179955261,
      answer: ['奶铃', '奶玲', '奶皮玲', '🥛🔔', '灵儿', '玲玲', '玲儿', '灵灵', '仓鼠', '天猫精灵', '690'],
      rejectMessage: '回答不正确，已拒绝加群！'
    }]
    const thisGroupQuestionOptions = groupQuestionOptions[groupQuestionOptions.findIndex(item => item.group_id === context.group_id)]
    if (!thisGroupQuestionOptions) return // 没有在 groupQuestionOptions 中的群号则跳过不处理
    const requestContent = context.comment.split('\n').map(item => item.substr(3, item.length)), // 分割问题和答案内容
      matching = thisGroupQuestionOptions.answer.filter(item => requestContent[1].indexOf(item) !== 0), // 判断回答中是否包含关键词
      isBingoAnswer = matching.length > 0
    this.bot('set_group_add_request', {
      flag: context.flag,
      sub_type: 'add',
      approve: isBingoAnswer,
      reason: !isBingoAnswer ? thisGroupQuestionOptions.rejectMessage : ''
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