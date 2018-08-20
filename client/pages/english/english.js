const app = getApp()
Page({
  data: {
    a_list: []
  },

  go: function (event){
    var id = event.currentTarget.id
    for (var i = 0; i < this.data.a_list.length; i++){
      if (this.data.a_list[i].id == id){
        wx.navigateTo({
          url: '/pages/article/article?dataObj=' + JSON.stringify(this.data.a_list[i])
        }) 
      }
    }
  },

  get_his_score: function (article_id) {
    if (app.globalData.user_score_info.hasOwnProperty(article_id.toString())) {
      var his_score = parseInt(app.globalData.user_score_info[article_id])
      return his_score
    } else {
      return 0
    }
  },

  onLoad: function (options) {
    var that=this
    wx.request({
      url: app.globalData.server +'article_list',
      success: function (res) {
        for (var i = 0; i < res.data.length; i++){
          var article_id = res.data[i]['id']
          res.data[i]['score'] = that.get_his_score(article_id).toString()
        }
        that.setData({ a_list: res.data})
      },
      fail: function () {
        wx.showToast({
          title: '文章列表获取失败',
          icon: 'none',
          duration: 2000
        })
      },
    })
  },

  onReady: function () {
  
  },

  onShow: function () {
    for (var i = 0; i < this.data.a_list.length; i++) {
      var article_id = this.data.a_list[i]['id']
      this.data.a_list[i]['score'] = this.get_his_score(article_id).toString()
    }
    this.setData({ a_list: this.data.a_list })
  },

  onHide: function () {
  
  },

  onUnload: function () {
  
  },
  onPullDownRefresh: function () {

  },
  onReachBottom: function () {
  
  },
  onShareAppMessage: function () {
  
  }
})