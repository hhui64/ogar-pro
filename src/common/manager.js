import consola from 'consola'
import config from '../../configs/config.json'

class common {
  constructor() {
    this.config = config
    Array.prototype.unique = function() {
      return this ? Array.from(new Set(this)) : []
    }
    Array.prototype.remove = function (value) {
      return this.splice(this.indexOf(value), 1)
    }
    Object.assign(console, consola)
  }
  init() {
    // console.info('hello this is common class')
  }
}

export {
  common
}