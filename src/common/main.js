import configDev from '../../configs/config.dev.js'
import config from '../../configs/config.js'

export default class Common {
  constructor() {
    this.config = process.env.NODE_ENV === 'production' ? config : configDev
    /**
     * 字符串 - 去除首尾空格
     */
    String.prototype.trim = function () {
      return String(this).replace(/^\s+|\s+$/g, '')
    }
    /**
     * 数组 - 去除重复元素
     */
    Array.prototype.unique = function () {
      return this ? Array.from(new Set(this)) : []
    }
    /**
     * 数组 - 删除指定元素
     */
    Array.prototype.remove = function (value) {
      return this.splice(this.indexOf(value), 1)
    }
  }
  init() {
    // console.info('hello this is common class')
  }
}