App({
  onLaunch: function () {
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var that = this
    wx.login({
      success: res => {
        wx.request({
          url: that.globalData.server + 'login',
          data: { code: res.code},
          method: 'GET',
          success: function (res) {
            that.globalData.openid = res.data
            wx.request({
              url: that.globalData.server+ 'get_user_scores',
              data: { openid: that.globalData.openid },
              method: 'GET',
              success: function (res) {
                that.globalData.user_score_info = res.data
              },
              fail: function () {
                wx.showToast({
                  title: '用户信息获取失败',
                  icon: 'none',
                  duration: 2000
                })
              },
            })
          },
          fail: function(){
            wx.showToast({
              title: '用户ID获取失败',
              icon: 'none',
              duration: 2000
            })
          },
        })
      },
      fail: function () {
        wx.showToast({
          title: '登录失败',
          icon: 'none',
          duration: 2000
        })
      },
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            },
            fail: function () {
              wx.showToast({
                title: '微信信息获取失败',
                icon: 'none',
                duration: 2000
              })
            },
          })
        }
      },
    })
  },
  globalData: {
    userInfo: null,
    openid:null,
    server:'https://weixin.zili-wang.com:21070/',
    user_score_info:null
  }
})