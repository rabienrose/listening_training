// pages/article/article.js
const app = getApp()
Page({
  data: {
    article_info:{},
    choose:[],
    score:"0/0",
    play_text:"PLAY",
    his_score:'0'
  },

  play: function () {
    if (this.isPlay==1){
      this.isPlay=0
      this.setData({ play_text:"PLAY"})
      this.innerAudioContext.pause()
    } else if (this.isPlay == 0){
      this.setData({ play_text: "LOADING" })
      this.isPlay = -1
      this.innerAudioContext.play()
    } else{
      return
    }
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
    console.log(app.globalData.openid)
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
    var start_word = parseInt(Math.random() * 5) + 1
    this.setData({ article_info: JSON.parse(options.dataObj) })
    
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
      this.setData({ play_text: "PAUSE" })
      this.isPlay = 1
    })
    var keywords = this.data.article_info['keywords']
    var kw_list = keywords.split(",")
    var fake_candi_list = this.randomSort2(kw_list)
    var cur_word = start_word
    var last_word=-1
    var temp_counter = 0
    this.true_list = []
    this.fake1_list = []
    this.fake2_list = []
    while(true){
      this.true_list.push(kw_list[cur_word])
      while(true){
        var isOK=true
        for (var i = last_word + 1; i <= cur_word;i++){
          if (fake_candi_list[temp_counter] == kw_list[i]){
            isOK=false
            break
          }
        }
        if (isOK){
          break
        }
        temp_counter = temp_counter+1
        if (temp_counter >= kw_list.length) {
          temp_counter = 0
        }
      }
      this.fake1_list.push(fake_candi_list[temp_counter])
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
        if (temp_counter >= kw_list.length){
          temp_counter=0
        }
      }
      this.fake2_list.push(fake_candi_list[temp_counter])
      last_word = cur_word
      var jump_step = parseInt(Math.random() * 3) + 5
      cur_word = cur_word + jump_step
      if (cur_word >= kw_list.length){
        break
      }
    }
    this.isPlay=0
    this.step=-1
    this.fill_options()
    this.ques_num = this.true_list.length
    this.setData({ score: '0/' + this.ques_num.toString()})
    this.setData({ his_score: this.get_his_score().toString()})
    this.points=0
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