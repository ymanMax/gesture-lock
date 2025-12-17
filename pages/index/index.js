Page({
  data: {
    data: [],
    password: [1, 2, 3, 6, 9],
    containerWidth: 600 // 默认值，避免初始加载时组件宽度为0
  },
  onLoad() {
    // 获取屏幕宽度
    const systemInfo = wx.getSystemInfoSync();
    // 计算容器宽度：屏幕宽度 - 100rpx
    // 注意：wx.getSystemInfoSync()返回的windowWidth单位是px，需要转换为rpx
    // 转换公式：rpx = px * (750 / windowWidth)
    const screenWidthRpx = 750;
    const containerWidthRpx = screenWidthRpx - 80;
    this.setData({
      containerWidth: containerWidthRpx
    });
  },
  onEnd(data) {
    this.setData({
      data: data.detail
    });
  },
  // 导航到手势挑战页面
  goToChallenge() {
    wx.navigateTo({
      url: '/pages/challenge/challenge'
    });
  },
  // 导航到排行榜页面
  goToRanking() {
    wx.navigateTo({
      url: '/pages/ranking/ranking'
    });
  },
  // 导航到手势分享页面
  goToShare() {
    wx.navigateTo({
      url: '/pages/share/share'
    });
  }
})