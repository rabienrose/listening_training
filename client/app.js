App({
  onLaunch: function () {
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    userInfo: null,
    openid:null,
    server:'https://weixin.zili-wang.com:21070/',
    //server: 'http://rabienrose.iicp.net:21070/',
    user_score_info:null
  }
})