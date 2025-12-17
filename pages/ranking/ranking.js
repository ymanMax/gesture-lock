const { getRankingData } = require('../../lib/storage.js');
const { shareChallengeResult } = require('../../lib/social.js');

Page({
  data: {
    currentTab: 'speed', // speed: 最快解锁, accuracy: 最高连续正确
    speedRanking: [],
    accuracyRanking: [],
    myInfo: {},
    totalPlayers: 0,
    totalChallenges: 0,
    totalSuccess: 0,
    hasUserInfo: false,
    userInfo: null
  },

  onLoad() {
    this.loadRankingData();
    this.loadUserInfo();
    this.loadStatisticsData();
  },

  onShow() {
    this.loadRankingData();
    this.loadUserInfo();
  },

  /**
   * 加载排行榜数据
   */
  loadRankingData() {
    // 加载最快解锁排行榜
    const speedData = getRankingData('time', 10);
    const speedRanking = speedData.map((item, index) => ({
      ...item,
      rank: index + 1,
      nickname: item.username || '匿名用户',
      gestureLength: item.gesture ? item.gesture.length : 0
    }));

    // 加载最高连续正确排行榜
    const accuracyData = getRankingData('accuracy', 10);
    const accuracyRanking = accuracyData.map((item, index) => ({
      ...item,
      rank: index + 1,
      nickname: item.username || '匿名用户',
      successRate: item.totalChallenges > 0
        ? Math.round((item.totalSuccess / item.totalChallenges) * 100)
        : 0
    }));

    this.setData({
      speedRanking,
      accuracyRanking
    });

    // 加载我的排名信息
    this.loadMyRankingInfo(speedData, accuracyData);
  },

  /**
   * 加载我的排名信息
   */
  loadMyRankingInfo(speedData, accuracyData) {
    const gameData = wx.getStorageSync('game_data') || {};

    // 查找我的排名
    const mySpeedRank = speedData.findIndex(item => item.userId === 'local_user') + 1;
    const myAccuracyRank = accuracyData.findIndex(item => item.userId === 'local_user') + 1;

    const myInfo = {
      avatar: this.data.userInfo?.avatarUrl || '',
      nickname: this.data.userInfo?.nickName || '我',
      bestTime: gameData.bestTime || 0,
      continuousCorrect: gameData.continuousCorrect || 0,
      totalChallenges: gameData.totalChallenges || 0,
      totalSuccess: gameData.totalSuccess || 0,
      rank: this.data.currentTab === 'speed' ? mySpeedRank : myAccuracyRank
    };

    this.setData({ myInfo });
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('user_info');
      if (userInfo) {
        this.setData({
          userInfo,
          hasUserInfo: true
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  /**
   * 加载统计数据
   */
  loadStatisticsData() {
    // 目前使用模拟数据，实际项目中应该从服务器获取
    this.setData({
      totalPlayers: 1250,
      totalChallenges: 5890,
      totalSuccess: 4230
    });
  },

  /**
   * 切换排行榜类型
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });

    // 更新我的排名信息
    const speedData = getRankingData('time', 10);
    const accuracyData = getRankingData('accuracy', 10);
    this.loadMyRankingInfo(speedData, accuracyData);
  },

  /**
   * 获取用户信息
   */
  onGetUserInfo(e) {
    const userInfo = e.detail.userInfo;
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
      wx.setStorageSync('user_info', userInfo);
      this.loadRankingData();
    }
  },

  /**
   * 分享排行榜
   */
  shareRanking() {
    const gameData = wx.getStorageSync('game_data') || {};

    shareChallengeResult({
      timeSpent: gameData.bestTime || 0,
      success: true,
      continuousCorrect: gameData.continuousCorrect || 0
    }).catch(error => {
      console.error('分享排行榜失败:', error);
    });
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    const gameData = wx.getStorageSync('game_data') || {};
    const shareTitle = this.data.currentTab === 'speed'
      ? `我在手势挑战中最快用时${(gameData.bestTime / 1000).toFixed(2)}秒！`
      : `我在手势挑战中连续正确${gameData.continuousCorrect}次！`;

    return {
      title: shareTitle,
      path: '/pages/ranking/ranking',
      imageUrl: '/images/share-ranking.jpg'
    };
  },

  /**
   * 分享到朋友圈
   */
  onShareTimeline() {
    const gameData = wx.getStorageSync('game_data') || {};
    const shareTitle = this.data.currentTab === 'speed'
      ? `手势挑战最快用时${(gameData.bestTime / 1000).toFixed(2)}秒`
      : `手势挑战连续正确${gameData.continuousCorrect}次`;

    return {
      title: shareTitle,
      query: `tab=${this.data.currentTab}`,
      imageUrl: '/images/share-timeline.jpg'
    };
  }
});
