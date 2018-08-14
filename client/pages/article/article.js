// pages/article/article.js
const app = getApp()
Page({
  data: {
    article_info:{},
    choose:[],
    isPlay: false,
    score:"0/0",
  },

  play: function () {
    if (this.isPlay){
      this.isPlay=false
      this.innerAudioContext.pause()
    }else{
      this.isPlay = true
      this.innerAudioContext.play()
    }
  },

  click: function(event){
    console.log(app.globalData.openid)
    if (this.step >= this.true_list.length) {
      return
    }
    var id = event.currentTarget.id
    if (this.rand_id==id){
      this.points = this.points + 1
    }
    this.setData({ score: this.points.toString() + '/' + this.ques_num.toString() })
    if(this.fill_options()==-1){
      wx.request({
        url: 'https://weixin.zili-wang.com:21070/update',
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
      })
    }
  },

  fill_options: function(){
    if (this.step >= this.true_list.length){
      return 0
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
    this.step = this.step+1
    this.setData({ choose: temp_op })
    if (this.step >= this.true_list.length) {
      return -1
    }
    return 1
  },

  onLoad: function (options) {
    this.setData({ article_info: JSON.parse(options.dataObj) })
    this.innerAudioContext = wx.createInnerAudioContext()
    this.innerAudioContext.src = this.data.article_info['mp3']
    this.innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
    var keywords=this.data.article_info['keywords']
    var kw_list=keywords.split(",") 
    this.true_list=[]
    this.fake1_list = []
    this.fake2_list = []
    for (var i = 0; i < kw_list.length;i=i+3){
      this.true_list.push(kw_list[i])
      this.fake1_list.push(kw_list[i+1])
      this.fake2_list.push(kw_list[i+2])
    }
    this.step=0
    this.fill_options()
    this.ques_num = this.true_list.length
    this.setData({ score: '0/' + this.ques_num.toString()})
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