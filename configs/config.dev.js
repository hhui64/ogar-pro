export default {
  db: {
    options: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      database: '',
      connectionLimit: 100
    },
    meta: {
      table_prefix: ''
    }
  },
  client: {
    host: '192.168.1.244',
    port: 6701,
    baseUrl: '',
    enableAPI: true,
    qq: '1458439467',
    accessToken: ''
  },
  baidu_aip: {
    APP_ID: '16920821',
    API_KEY: 'mvpn7EQlfWAH5VhGeK6gNZL3',
    SECRET_KEY: 'IRsYbVBlpUoDm2v7eTiCcF1KKm3ifcmf'
  },
  rules: {
    continuityImage: {
      name: '连续发图',
      count: 3
    },
    tooLongMsg: {
      name: '长消息刷屏',
      lineMinimumLength: 4,
      count: 8
    }
  },
  groupRules: {
    '913073002': {
      card: {
        maximumCards: 5,
        effectiveTime: 4320,
        maximumMuteTime: 1440,
        cardStage: [10, 30, 60, 180, 360]
      },
      autoApprove: {
        keywords: ['奶铃', '奶玲', '奶皮玲', '🥛🔔', '灵儿', '玲玲', '玲儿', '灵灵', '仓鼠', '天猫精灵', '690'],
        rejectMessage: '回答不正确，已拒绝加群'
      }
    }
  },
  middleware: [
    'msgQueueManager',
    'muteRequestQueueManager',
    'autoReply'
  ],
  muteRequestQueueManager: {
    enable: true,
    type: ['group']
  },
  autoReply: {
    enable: true,
    type: ['discuss', 'group']
  }
}