import {
  common
} from '../common/manager'
import {
  encrypt as encryptManager
} from '../api/manager'
import {
  CQAt
} from 'cq-websocket'

const encrypt = new encryptManager

class handler extends common {
  constructor() {
    super()
    this.msgQueue = {
      private: [],
      discuss: [],
      group: {}
    }
    this.AT_QQ_CQ_TAG_REG_EXP = new RegExp(/\[CQ:at,qq=([1-9]\d{5,10})\]\s?/g)
    this.QQ_REG_EXP = new RegExp(/[1-9]\d{5,10}/g)
  }
  async onMessage(event, context, tags, bot) {
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
          if (context.message.startsWith('我要静静')) {
            if (context.sender.role === 'member') {
              bot('set_group_ban', {
                group_id: context.group_id,
                user_id: context.sender.user_id,
                duration: 60 * 30
              })
            }
            bot('send_msg', {
              group_id: context.group_id,
              message: new CQAt(context.sender.user_id) + ' ' + '麻烦你冷静冷静！'
            })
          } else if (context.message.startsWith('干他')) {
            if (context.message_at.length > 0) {
              if (context.message_at[0] == context.sender.user_id) {
                bot('send_msg', {
                  group_id: context.group_id,
                  message: new CQAt(context.sender.user_id) + ' ' + '不可以干你自己'
                })
                return
              }
              const ganUserInfo = await bot('get_group_member_info', {
                group_id: context.group_id,
                user_id: context.message_at[0]
              })
              // console.info(ganUserInfo)
              const chance = 35.7
              const chance_gan = (100 - chance) * 10
              const chance_100 = 100 * 10
              const i = encrypt.getRandomNum(0, chance_100)
              const muteTime = encrypt.getRandomNum(60, 300)
              if (ganUserInfo.data.role !== 'member') {
                bot('send_msg', {
                  group_id: context.group_id,
                  message: `${new CQAt(context.sender.user_id)} 你因涉嫌袭击 ${ ganUserInfo.data.role=='admin' ? '管理员' : '群主'} 而被惩戒禁言 ${muteTime} 秒！`
                })
                bot('set_group_ban', {
                  group_id: context.group_id,
                  user_id: context.sender.user_id,
                  duration: muteTime
                })
                return
              }
              if (i >= chance_gan) {
                bot('send_msg', {
                  group_id: context.group_id,
                  message: `${new CQAt(context.sender.user_id)} 你使出浑身力量把板砖砸向了 ${new CQAt(context.message_at[0])} 的脑袋，造成了 ${i} 点伤害，对方因没有练好铁头功而被送去医院治疗，已被禁言 ${muteTime} 秒！`
                })
                bot('set_group_ban', {
                  group_id: context.group_id,
                  user_id: context.message_at[0],
                  duration: muteTime
                })
                return

              } else {
                bot('send_msg', {
                  group_id: context.group_id,
                  message: `${new CQAt(context.sender.user_id)} 你使出浑身力量把板砖砸向了 ${new CQAt(context.message_at[0])} 的脑袋，造成了 ${i} 点伤害，但是耶稣帮他挡住了这块板砖，并把你禁言了 ${muteTime*2} 秒！`
                })
                bot('set_group_ban', {
                  group_id: context.group_id,
                  user_id: context.sender.user_id,
                  duration: muteTime * 2
                })
                return
              }

            }

            return
          } else if (context.message.startsWith('搞他')) {
            //
          } else {
            bot('send_msg', {
              group_id: context.group_id,
              message: new CQAt(context.sender.user_id) + ' ' + this.clearCQTag(context.message)
            })
          }
        }
        break
      default:
        break
    }
  }
  getAtQQList(str) {
    const CQTags = str.match(this.AT_QQ_CQ_TAG_REG_EXP)
    return CQTags ? CQTags.unique().map(item => item.match(this.QQ_REG_EXP).toString()) : []
  }
  clearCQTag(str) {
    return str.replace(this.AT_QQ_CQ_TAG_REG_EXP, '')
  }
}

export {
  handler
}