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

  onLoad: function (options) {
    var that=this
    wx.request({
      url: 'https://weixin.zili-wang.com:21070/article_list',
      success: function (res) {
        that.setData({ a_list: res.data})
      },
    })
  },

  onReady: function () {
  
  },

  onShow: function () {
  
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