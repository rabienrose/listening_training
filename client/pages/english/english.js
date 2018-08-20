const app = getApp()
Page({
  data: {
    a_list: [],
    order_type: 0
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

  listenCheckboxChange:function(e){
    if (e.detail.value=='0'){
      this.data.order_type = 'score'
    } else if (e.detail.value == '1'){
      this.data.order_type = 'id'
    } else if (e.detail.value == '2'){
      this.data.order_type = 'level'
    }
    this.update_list(this.data.a_list)
  },
    
  get_his_score: function (article_id) {
    if (app.globalData.user_score_info.hasOwnProperty(article_id.toString())) {
      var his_score = parseInt(app.globalData.user_score_info[article_id])
      return his_score
    } else {
      return 0
    }
  },

  update_list: function(data){
    var color_map = { 1: '#000000', 2: '#008000', 3: '#0000FF', 4: '#800080', 5: '#FFA500'}
    for (var i = 0; i < data.length; i++) {
      var article_id = data[i]['id']
      data[i]['score'] = this.get_his_score(article_id).toString()
      data[i]['color'] = color_map[data[i]['level']]
    }
    if (this.data.order_type=='score'){
      data.sort(function (left, right) {
        return parseInt(left['score']) < parseInt(right['score']) ? -1 : 1;
      })
    } else if (this.data.order_type == 'id'){
      data.sort(function (left, right) {
        return parseInt(left['id']) > parseInt(right['id']) ? -1 : 1;
      })
    } else if (this.data.order_type == 'level') {
      data.sort(function (left, right) {
        return left['level'] < right['level'] ? -1 : 1;
      })
    }
    
    this.setData({ a_list: data })
  },

  onLoad: function (options) {
    var that=this
    wx.request({
      url: app.globalData.server +'article_list',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      method: 'POST',
      success: function (res) {
        that.update_list(res.data)
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
    this.update_list(this.data.a_list)
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