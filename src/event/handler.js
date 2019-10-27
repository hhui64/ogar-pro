/**
 * 事件监听器主模块
 * @author hhui64 <907322015@qq.com>
 */

import moment from 'moment'
import Common from '../common/main.js'
import {
  encrypt as Encrypt
} from '../api/main'
import CQApi from '../CQApi/main.js'

const encrypt = new Encrypt

class EventHandler extends Common {
  constructor(middlewareManager, bot) {
    super()
    this.middlewareManager = middlewareManager
    this.bot = bot
    this.AT_QQ_CQ_TAG_REG_EXP = new RegExp(/\[CQ:at,qq=([1-9]\d{5,10})\]\s?/g)
    this.QQ_REG_EXP = new RegExp(/[1-9]\d{5,10}/g)
  }
  /**
   * 消息事件
   * @param {CQEvent} event 
   * @param {Object} context 
   * @param {CQTag[]} tags 
   */
  onMessage(event, context, tags) {
    if (['discuss', 'group'].includes(context.message_type)) {
      context.message_at = new CQApi().getAtQQList(context.message)
      if (context.message_at.includes(this.config.client.qq)) {
        context.atMe = this.config.client.qq
      }
    }
    this.middlewareManager.go(context, this.bot)
  }
  /**
   * 群文件上傳, 群管變動, 群成員增減, 好友添加...等QQ事件
   * @param {Object} context 
   */
  async onNotice(context) {
    // console.info('onNotice', context)
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
      matching = thisGroupAutoApproveOptions.keywords.filter(item => requestContent[1].indexOf(item) > -1), // 判断回答中是否包含关键词
      isHasKeywords = matching.length > 0
    this.bot('set_group_add_request', {
      flag: context.flag,
      sub_type: 'add',
      approve: isHasKeywords,
      reason: !isHasKeywords ? thisGroupAutoApproveOptions.rejectMessage : ''
    })
  }
}

export {
  EventHandler
}