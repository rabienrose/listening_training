// pages/article/article.js
const app = getApp()
Page({
  data: {
    article_info:{},
    choose:[],
    color: ['#000000', '#000000', '#000000'],
    score:"0/0",
    play_text:"开始",
    his_score:'0',
    rank_list:[]
  },

  init_restart: function(){
    this.step = -1
    this.fill_options()
    this.setData({ score: '0/' + this.ques_num.toString() })
    this.points = 0
    this.isPlay = 0
    this.setData({ play_text: "开始" })
  },

  go_study: function () {
    wx.navigateTo({
      url: '/pages/study/study?dataObj=' + JSON.stringify(this.data.article_info) 
    })
  },

  play: function () {
    if (this.isPlay==1){
      this.innerAudioContext.stop()
      this.init_restart()
    } else if (this.isPlay == 0){
      this.setData({ play_text: "下载中" })
      this.isPlay = -1
      this.innerAudioContext.play()
    } else{
      return
    }
  },

  ans: function () {
    var color_t = ['#000000', '#000000', '#000000']
    color_t[this.rand_id] = '#FFA500'
    this.setData({ color: color_t})
    this.rand_id=-1 //after show the ans, no point will be given
  },

  get_his_score: function(){
    if (app.globalData.user_score_info.hasOwnProperty(this.data.article_info.id)) {
      var his_score = parseInt(app.globalData.user_score_info[this.data.article_info.id])
      return his_score
    }else{
      return 0
    }
  },

  click: function(event){
    if (this.step >= this.true_list.length) {
      wx.showToast({
        title: '已回答完所有问题',
        icon: 'none',
        duration: 2000
      })
      return
    }
    var id = event.currentTarget.id
    if (this.rand_id==id){
      this.points = this.points + 1
    }
    this.setData({ score: this.points.toString() + '/' + this.ques_num.toString() })
    if(this.fill_options()==-1){
      if (this.data.article_info.id==null){
        wx.showToast({
          title: '用户id错误',
          icon: 'none',
          duration: 2000
        })
        return
      }
      if (app.globalData.userInfo == null) {
        wx.showToast({
          title: '请授权获取微信用户信息',
          icon: 'none',
          duration: 2000
        })
        return
      }
      if (app.globalData.user_score_info==null){
        wx.showToast({
          title: '用户信息出错',
          icon: 'none',
          duration: 2000
        })
        return
      }
      var his_score = this.get_his_score()
      if (his_score >= this.points){
        console.log("no upload score")
        return
      }
      app.globalData.user_score_info[this.data.article_info.id] = this.points.toString()
      this.setData({ his_score: this.points.toString() })
      wx.request({
        url: app.globalData.server +'update',
        data: { 
          openid: app.globalData.openid,
          score: this.points,
          article_id: this.data.article_info.id,
          name: app.globalData.userInfo.nickName,
          img_src: app.globalData.userInfo.avatarUrl,
         },
        method: 'GET',
        success: function (res) {
        },
        fail: function () {
          wx.showToast({
            title: '上传成绩失败',
            icon: 'none',
            duration: 2000
          })
        },
      })
    }
  },

  fill_options: function(){
    this.step = this.step + 1
    if (this.step >= this.true_list.length){
      return -1
    }
    this.rand_id=Math.floor(Math.random()*3)
    var temp_op=[]
    var fill_one_fake=false
    for(var i=0;i<3;i++){
      if (i == this.rand_id){
        temp_op.push(this.true_list[this.step])
      }else{
        if (fill_one_fake==false){
          temp_op.push(this.fake1_list[this.step])
          fill_one_fake=true
        }else{
          temp_op.push(this.fake2_list[this.step])
        }
      }
    }
    this.setData({ choose: temp_op })
    var color_t = ['#000000', '#000000', '#000000']
    this.setData({ color: color_t })
    return 1
  },

  randomSort2: function(arr){
    var arr2 = arr.slice(0)
    var mixedArr = []
    while (arr2.length > 0){
      var rc = parseInt(Math.random() * arr2.length)
      mixedArr.push(arr2[rc])
      arr2.splice(rc, 1)
    }
    return mixedArr
  },

  onLoad: function (options) {
    var article_info_obj = app.globalData.cur_article_info
    this.setData({ article_info: article_info_obj })
    var rank_list_temp=[]
    for (var i = 0; i < article_info_obj['sorted_name'].length; i++){
      var info_dict={}
      info_dict['name'] = article_info_obj['sorted_name'][i]
      info_dict['score'] = article_info_obj['sorted_score'][i]
      rank_list_temp.push(info_dict)
    }
    this.setData({ rank_list: rank_list_temp})
    
    this.innerAudioContext = wx.createInnerAudioContext()
    this.innerAudioContext.src = this.data.article_info['mp3']
    this.innerAudioContext.onError((res) => {
      wx.showToast({
        title: res.errMsg,
        icon: 'none',
        duration: 2000
      })
    })
    this.innerAudioContext.onPlay((res) => {
      this.setData({ play_text: "停止" })
      this.isPlay = 1
    })
    var that=this
    wx.request({
      url: app.globalData.server + 'article_keyword',
      data: { article_id: this.data.article_info['id'] },
      success: function (res) {
        var keywords = res.data.keywords
        var step_rate = res.data.step_rate
        step_rate = step_rate/0.7
        var start_word = parseInt(Math.random() * 5) + 1
        start_word =Math.floor(start_word*step_rate)
        var kw_list = keywords.split(",")
        var fake_candi_list = that.randomSort2(kw_list)
        var cur_word = start_word
        var last_word = -1
        var temp_counter = 0
        that.true_list = []
        that.fake1_list = []
        that.fake2_list = []
        while (true) {
          that.true_list.push(kw_list[cur_word])
          while (true) {
            var isOK = true
            for (var i = last_word + 1; i <= cur_word; i++) {
              if (fake_candi_list[temp_counter] == kw_list[i]) {
                isOK = false
                break
              }
            }
            if (isOK) {
              break
            }
            temp_counter = temp_counter + 1
            if (temp_counter >= kw_list.length) {
              temp_counter = 0
            }
          }
          that.fake1_list.push(fake_candi_list[temp_counter])
          var firstfake = fake_candi_list[temp_counter]
          while (true) {
            if (fake_candi_list[temp_counter] != firstfake) {
              var isOK = true
              for (var i = last_word + 1; i <= cur_word; i++) {
                if (fake_candi_list[temp_counter] == kw_list[i]) {
                  isOK = false
                  break
                }
              }
              if (isOK) {
                break
              }
            }
            temp_counter = temp_counter + 1
            if (temp_counter >= kw_list.length) {
              temp_counter = 0
            }
          }
          that.fake2_list.push(fake_candi_list[temp_counter])
          last_word = cur_word
          var jump_step = parseInt(Math.random() * 3) + 5
          jump_step = Math.ceil(jump_step * step_rate)
          cur_word = cur_word + jump_step
          if (cur_word >= kw_list.length) {
            break
          }
        }
        that.isPlay = 0
        that.ques_num = that.true_list.length
        that.setData({ his_score: that.get_his_score().toString() })
        that.init_restart()
        that.setData({ play_text: "开始" })
      },
      fail: function () {
        wx.showToast({
          title: '问题获取失败',
          icon: 'none',
          duration: 2000
        })
      },
    })
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.isPlay) {
      this.innerAudioContext.stop()
    }
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})