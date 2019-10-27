import crypto from 'crypto'
import * as CryptoJS from 'crypto-js'
import Common from '../common/main'
import {
  format
} from 'util'

/**
 * 加密算法类
 */
class encrypt extends Common {
  constructor() {
    super()
  }
  /**
   * 取指定范围内随机长度的随机数
   * @param {Number} min - 最小值
   * @param {Number} max - 最大值
   */
  getRandomNum(min, max) {
    let range = max - min,
      rand = Math.random()
    return (min + Math.round(rand * range))
  }
  /**
   * 取随机HEX字符串
   * @param {Number} len - 长度
   * @param {Boolean} [ci=false] - 是否大写
   */
  getRandomStr(len, ci = false) {
    let strArr = ['a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      str = ''
    strArr.sort(() => 0.5 - Math.random())
    for (var i = 0; i < len; i++) {
      str += strArr[this.getRandomNum(0, strArr.length - 1)]
    }
    str = str.split('').sort(() => 0.5 - Math.random()).join('')
    if (!ci) return str.toLowerCase()
    return str
  }
  /**
   * MD5 加密
   * @param {String} str - 原始字符串
   * @param {Boolean} [ci=false] - 是否大写
   */
  MD5(str, ci = false) {
    return {
      enc: 'MD5',
      str: crypto.createHash('md5').update(str).digest('hex')
    }
  }
  /**
   * MD5 盐加密 (推荐)
   * @param {String} str - 原始字符串
   * @param {Object} saltOptions - 盐参数集
   * @param {String} [saltOptions.salt] - 盐字符串 - 使用指定盐字符串加密
   * @param {Number} [saltOptions.length] - 盐字符串长度 - 随机生成盐字符串的长度
   */
  SALTED2MD5(str, saltOptions = {}) {
    let salt = 'salt' in saltOptions ? saltOptions.salt : this.getRandomStr('length' in saltOptions ? saltOptions.length : 8)
    return {
      enc: 'SALTED2MD5',
      salt: salt,
      str: crypto.createHash('md5').update(crypto.createHash('md5').update(str).digest('hex') + salt).digest('hex')
    }
  }
  /**
   * SHA512 盐加密 (推荐)
   * @param {String} str - 原始字符串
   * @param {Object} saltOptions - 盐参数集
   * @param {String} [saltOptions.salt] - 盐字符串 - 使用指定盐字符串加密
   * @param {Number} [saltOptions.length] - 盐字符串长度 - 随机生成盐字符串的长度
   */
  SALTEDSHA512(str, saltOptions = {}) {
    let salt = 'salt' in saltOptions ? saltOptions.salt : this.getRandomStr('length' in saltOptions ? saltOptions.length : 8)
    // TUDO...
  }
  /**
   * SHA256 盐加密 (不推荐)
   * @param {String} str - 原始字符串
   * @param {Object} saltOptions - 盐参数集
   * @param {String} [saltOptions.salt] - 盐字符串 - 使用指定盐字符串加密
   * @param {Number} [saltOptions.length] - 盐字符串长度 - 随机生成盐字符串的长度
   */
  SHA256(str, saltOptions = {}) {
    let salt = 'salt' in saltOptions ? saltOptions.salt : this.getRandomStr('length' in saltOptions ? saltOptions.length : 8)
    return {
      enc: 'SHA256',
      salt: salt,
      str: crypto.createHash('sha256').update(crypto.createHash('sha256').update(str).digest('hex') + salt).digest('hex')
    }
  }
  /**
   * base64 编码
   * @param {String} str - 原始字符串
   */
  BASE64EN(str) {
    return new Buffer(str).toString('base64')
  }
  /**
   * base64 解码
   * @param {String} str - base64 字符串
   */
  BASE64DE(str) {
    return new Buffer(str, 'base64').toString()
  }
  /**
   * AES 加密
   * @param {String} str - 原始字符串
   * @param {String} [secretPassphrase] - 密码
   */
  AESEN(str, secretPassphrase) {
    return CryptoJS.AES.encrypt(str, secretPassphrase).toString()
  }
  /**
   * AES 解密
   * @param {String} str - 原始字符串
   * @param {String} [secretPassphrase] - 密码
   */
  AESDE(str, secretPassphrase) {
    return CryptoJS.AES.decrypt(str, secretPassphrase).toString(CryptoJS.enc.Utf8)
  }
}

/**
 * 参数检查与转换类
 */
class check extends Common {
  constructor() {
    super()
  }
  /**
   * 将字符串中的换行符 \n 替换为 <br />
   * @param {String} str - 原始字符串
   */
  n2br(str) {
    return str ? str.replace(/\n/g, '<br />') : ''
  }
  /**
   * 将字符串中的换行符 <br /> 替换为 \n
   * @param {String} str - 原始字符串
   */
  br2n(str) {
    return str ? str.replace(/<br *\/>/g, '\n') : ''
  }
}

export {
  encrypt,
  check
}