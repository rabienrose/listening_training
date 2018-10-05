// pages/study/study.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    play_text: "播放",
    currtRate:0.0,
    content:'',
  },

  play: function () {
    if (this.isPlay == 1) {
      this.innerAudioContext.pause()
      this.setData({ play_text: "播放" })
      this.isPlay=0
    } else if (this.isPlay == 0) {
      this.setData({ play_text: "下载中" })
      this.isPlay = -1
      this.innerAudioContext.play()
    } else {
      return
    }
  },
  back3s: function (options) {
    if(this.isPlay == 0) {
      this.innerAudioContext.play()
    }
    var cur_time = this.innerAudioContext.currentTime
    var jump_to = cur_time - 2
    if (jump_to<0){
      jump_to=0
    }
    this.innerAudioContext.seek(jump_to)
  },
  back30s: function (options) {
    if (this.isPlay == 0) {
      this.innerAudioContext.play()
    }
    var cur_time = this.innerAudioContext.currentTime
    var jump_to = cur_time - 30
    if (jump_to < 0) {
      jump_to = 0
    }
    this.innerAudioContext.seek(jump_to)
  },
  forward30s: function (options) {
    if (this.isPlay == 0) {
      this.innerAudioContext.play()
    }
    var cur_time = this.innerAudioContext.currentTime
    var jump_to = cur_time + 30
    if (jump_to > this.innerAudioContext.duration) {
      return
    }
    this.innerAudioContext.seek(jump_to)
  },
  restart: function (options) {
    if (this.isPlay == 0) {
      this.innerAudioContext.play()
    }
    this.innerAudioContext.seek(0)
  },

  update_progress: function (){
    var currtRate_t = this.innerAudioContext.currentTime / this.innerAudioContext.duration
    currtRate_t = parseInt(currtRate_t * 100)
    this.setData({ currtRate: currtRate_t })
  },

  onLoad: function (options) {
    var article_info_obj = JSON.parse(options.dataObj)
    var that =this
    wx.request({
      url: app.globalData.server + 'article_content',
      data: { article_id: article_info_obj['id'] },
      success: function (res) {
        that.setData({ content: res.data})
      },
      fail: function () {
        wx.showToast({
          title: '文章内容获取失败',
          icon: 'none',
          duration: 2000
        })
      },
    })
    
    this.innerAudioContext = wx.createInnerAudioContext()
    this.innerAudioContext.src = article_info_obj['mp3']
    this.innerAudioContext.onError((res) => {
      wx.showToast({
        title: res.errMsg,
        icon: 'none',
        duration: 2000
      })
    })
    this.innerAudioContext.onPlay((res) => {
      this.setData({ play_text: "暂停" })
      this.isPlay = 1
    })
    this.innerAudioContext.onTimeUpdate(() => {
      this.update_progress()
    })
    this.innerAudioContext.onSeeked(() => {
      this.update_progress()
    })

    
    this.isPlay = 0
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
    this.innerAudioContext.stop()

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