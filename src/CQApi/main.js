import Common from "../common/main"

export default class CQApi extends Common {
  constructor(context) {
    super()
    this.AT_QQ_CQ_TAG_REG_EXP = new RegExp(/\[CQ:at,qq=([1-9]\d{5,10})\]\s?/g)
    this.QQ_REG_EXP = new RegExp(/[1-9]\d{5,10}/g)
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