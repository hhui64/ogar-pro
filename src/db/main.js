/**
 * 数据库管理模块 - 这真的是魔法
 * 负责语句查询、拼接生成、连接池管理等数据库相关的逻辑功能
 * @author hhui64 <907322015@qq.com>
 */

import mysql from 'mysql'
import moment from 'moment'
import { common } from '../common/main'
import {
  format
} from 'util'

var pool = null

/**
 * 数据库类
 */
export default class db extends common {
  constructor(options) {
    super()
    this.options = this.config.db.options
    this.tableName = {
      cards: 'cards'
    }
    for (let i in this.tableName) {
      if (i == null || !Object.prototype.hasOwnProperty.call(this.tableName, i)) continue
      this.tableName[i] = this.config.db.meta.table_prefix + this.tableName[i]
    }
  }
  /**
   * 初始化 MySQL 核心引擎
   * @param {Object} [options] mysql options 
   */
  async init(options) {
    const _OPTIONS = options || this.options
    if (!pool) {
      console.info('Connecting to database and creating connect pool...')
      try {
        pool = mysql.createPool(_OPTIONS)
        pool ? console.success('MySQL is connected') : console.error('MySQL is connecting failed')
      } catch (e) {
        console.error(e)
      }
    } else {
      console.info('MySQL has been connected')
      return
    }
    /**
     * @tudo 初始化时检测数据表是否存在, 不存在则创建表
     */
    // const sql = format('SHOW TABLES')
    // let dbInitLog = await Promise.all(
    //   [new Promise((resolve, reject) => {
    //     this.query(sql, (results, fields, error) => {
    //       if (error) throw error
    //       const TABLES = this.results(results).map(TABLE_NAME => TABLE_NAME[`Tables_in_${_OPTIONS.database}`])
    //       let R = []
    //       Object.values(this.tableName).forEach(item => {
    //         if (!TABLES.includes(item)) {
    //           R.push(item)
    //         }
    //       })
    //       // return R
    //       console.info(R)
    //       resolve(R)
    //     })
    //   })]
    // )
  }
  /**
   * 执行查询语句
   * @param {*} sql SQL语句
   * @param {*} callback 回调函数
   */
  query(sql, callback) {
    try {
      pool.getConnection((err, connection) => {
        if (err) throw err
        connection.query(sql, (error, results, fields) => {
          connection.release()
          // if (error) throw error
          callback(results, fields, error)
        })
      })
    } catch (e) {
      console.error(e)
    }
  }
  /**
   * 格式化数据
   * @param {*} results 
   */
  results(results) {
    return results ? JSON.parse(JSON.stringify(results)) : ''
  }
  /**
   * 生成单键多值匹配查询语句 OR
   * @param {String} table - 表名
   * @param {String} key - 键名
   * @param {Array[]} value - 值数组
   * @returns {String} 拼接后的 SQL 语句
   */
  sqlOr(table, key, value) {
    if (!value) return null
    let sql = format("SELECT * FROM `%s` WHERE ", table)
    return format(sql + "`%s` = '" + value.split(',').join("' OR " + format(`%s`, key) + " = '") + "'", key)
  }
  /**
   * 生成 UNION 查询语句
   * @param {String} table - 表
   * @param {String} key - 键
   * @param {Array[]} value - 值数组
   * @returns {String} 拼接后的 SQL 语句
   */
  sqlUnion(table, key, value) {
    if (!value) return null
    let sql = format("SELECT * FROM `%s` WHERE ", table)
    return format(sql + "`%s` = '" + value.split(',').join("' UNION " + sql + format(`%s`, key) + " = '") + "'", key)
  }
}