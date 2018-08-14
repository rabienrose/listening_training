Page({

  /**
   * 页面的初始数据
   */
  data: {
    test: 'test',
    person: {
      name: 'jay',
      age: 12,
      address: 'china',
      like: 'sing song',
      phone: '123456'
    }
  },
  change: function (e) {
    this.setData({
      test: 'hello world!'
    })
  },
  changePerson: function (e) {
    var str = 'person.name';
    this.setData({
      [str]: 'fxjzzyo'
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  }
})