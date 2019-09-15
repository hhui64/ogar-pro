import {
  common
} from '../common/manager'
import {
  encrypt as Encrypt
} from '../api/manager'
import {
  CQAt
} from 'cq-websocket'
import Axios from 'axios'

var timer = null

class liveWatch extends common {
  constructor(bot) {
    super()
    this.bot = bot
  }
  init() {
    // this.startWatching(348449290, 30 * 1000, state => {
    //   // console.log(state)
    // })
  }
  startWatching(ccUserId, delay = 30 * 1000, callback) {
    timer = setInterval(async () => {
      callback(await this.getLiveState(ccUserId))
    }, delay)
  }
  stopWatching() {
    clearInterval(timer)
  }
  async getLiveState(ccUserId) {
    const html = await Axios.get(`https://cc.163.com/user/${ ccUserId }/`)
    return html.data.indexOf('on-line-con') !== -1
  }
}

export {
  liveWatch
}