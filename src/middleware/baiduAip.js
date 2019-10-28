import MiddlewareManager from '../middlewareManager/main'
import Common from '../common/main'
import {
  contentCensor
} from 'baidu-aip-sdk'
import {
  CQAt
} from 'cq-websocket'
import CQApi from '../CQApi/main'

const baiduAip = (options) => {
  const baiduAipClient = new BaiduAipClient
  MiddlewareManager.use(async (ctx, next, ...args) => {
    const bot = args[0]
    const response = await baiduAipClient.antiSpam(ctx.message)
    let labelTextArray = {
      reject: [],
      review: [],
      pass: []
    }
    response.result.reject.forEach(value => {
      labelTextArray.reject.push({
        label: baiduAipClient.labelText[value.label - 1],
        score: (value.score * 100).toFixed(2)
      })
    })
    if (labelTextArray.reject.findIndex(item => item.label === '恶意推广') > -1) {
      bot('send_msg', {
        group_id: ctx.group_id,
        message: new CQAt(ctx.sender.user_id) + ' ' + `不要发小广告！`
      })
      return
    }
    next()
  })
}

class BaiduAipClient extends Common {
  constructor() {
    super()
    this.client = new contentCensor(this.config.baidu_aip.APP_ID, this.config.baidu_aip.API_KEY, this.config.baidu_aip.SECRET_KEY)
    this.labelText = ['暴恐违禁', '文本色情', '政治敏感', '恶意推广', '低俗辱骂', '低质灌水']
  }
  antiSpam(text) {
    return new Promise((resolve, reject) => {
      this.client.antiSpam(text)
        .then(data => {
          data ? resolve(JSON.parse(JSON.stringify(data))) : reject('error')
        })
    })
  }
}

export {
  baiduAip,
  BaiduAipClient
}