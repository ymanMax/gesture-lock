/**
 * 存储功能库 - 封装微信小程序本地存储API
 * 提供挑战记录、排行榜数据、自定义手势的增删改查功能
 */

// 存储键名常量
const STORAGE_KEYS = {
  CHALLENGE_RECORDS: 'challenge_records',
  RANKING_DATA: 'ranking_data',
  CUSTOM_GESTURES: 'custom_gestures',
  GAME_DATA: 'game_data',
  CURRENT_CHALLENGE: 'current_challenge'
};

/**
 * 保存挑战记录
 * @param {Object} record - 挑战记录对象
 * @param {Array} record.gesture - 手势数据
 * @param {string} record.description - 手势描述
 * @param {number} record.timeSpent - 挑战用时
 * @param {boolean} record.success - 是否挑战成功
 * @param {number} record.timestamp - 挑战时间戳
 */
function saveChallengeRecord(record) {
  const records = getChallengeRecords();
  records.unshift(record);

  // 最多保存100条记录
  if (records.length > 100) {
    records.splice(100);
  }

  wx.setStorageSync(STORAGE_KEYS.CHALLENGE_RECORDS, records);
}

/**
 * 获取挑战记录列表
 * @param {number} limit - 返回记录的最大数量，默认返回所有
 * @returns {Array} 挑战记录列表
 */
function getChallengeRecords(limit = null) {
  const records = wx.getStorageSync(STORAGE_KEYS.CHALLENGE_RECORDS) || [];

  if (limit && typeof limit === 'number' && limit > 0) {
    return records.slice(0, limit);
  }

  return records;
}

/**
 * 清空所有挑战记录
 */
function clearChallengeRecords() {
  wx.removeStorageSync(STORAGE_KEYS.CHALLENGE_RECORDS);
}

/**
 * 获取排行榜数据
 * @param {string} type - 排行榜类型: 'time' (最快时间) 或 'accuracy' (最高连续正确率)
 * @param {number} limit - 返回排名的最大数量，默认10
 * @returns {Array} 排行榜数据列表
 */
function getRankingData(type = 'time', limit = 10) {
  // 目前使用本地游戏数据作为排行榜数据
  // 在实际项目中，这里应该从服务器获取排行榜数据
  const gameData = wx.getStorageSync(STORAGE_KEYS.GAME_DATA) || {};

  // 构造本地排行榜数据
  const localRank = [{
    userId: 'local_user',
    username: '我',
    avatar: '',
    bestTime: gameData.bestTime || 0,
    continuousCorrect: gameData.continuousCorrect || 0,
    totalSuccess: gameData.totalSuccess || 0,
    totalChallenges: gameData.totalChallenges || 0
  }];

  // 根据类型排序
  if (type === 'time') {
    // 按最快时间排序（时间越短排名越靠前）
    localRank.sort((a, b) => {
      // 未完成过挑战的排在后面
      if (!a.bestTime) return 1;
      if (!b.bestTime) return -1;
      return a.bestTime - b.bestTime;
    });
  } else if (type === 'accuracy') {
    // 按最高连续正确率排序（连续正确次数越多排名越靠前）
    localRank.sort((a, b) => b.continuousCorrect - a.continuousCorrect);
  }

  return localRank.slice(0, limit);
}

/**
 * 保存自定义手势
 * @param {Object} gestureData - 自定义手势数据对象
 * @param {string} gestureData.id - 手势唯一标识
 * @param {string} gestureData.name - 手势名称
 * @param {string} gestureData.description - 手势描述
 * @param {Array} gestureData.gesture - 手势数据
 * @param {number} gestureData.rows - 手势网格行数
 * @param {string} gestureData.previewImage - 手势预览图
 * @param {string} gestureData.shareCode - 手势分享码
 * @param {number} gestureData.createdAt - 创建时间戳
 * @param {number} gestureData.shareCount - 分享次数
 * @param {number} gestureData.usedCount - 使用次数
 */
function saveCustomGesture(gestureData) {
  const gestures = getCustomGestures();
  const existingIndex = gestures.findIndex(g => g.id === gestureData.id);

  if (existingIndex >= 0) {
    // 更新已有手势
    gestures[existingIndex] = gestureData;
  } else {
    // 添加新手势
    gestures.unshift(gestureData);
  }

  wx.setStorageSync(STORAGE_KEYS.CUSTOM_GESTURES, gestures);
}

/**
 * 获取自定义手势列表
 * @returns {Array} 自定义手势列表
 */
function getCustomGestures() {
  return wx.getStorageSync(STORAGE_KEYS.CUSTOM_GESTURES) || [];
}

/**
 * 根据分享码获取自定义手势
 * @param {string} shareCode - 手势分享码
 * @returns {Object|null} 找到的手势对象或null
 */
function getCustomGestureByShareCode(shareCode) {
  const gestures = getCustomGestures();
  return gestures.find(g => g.shareCode === shareCode) || null;
}

/**
 * 删除自定义手势
 * @param {string} gestureId - 手势唯一标识
 * @returns {boolean} 删除是否成功
 */
function deleteCustomGesture(gestureId) {
  const gestures = getCustomGestures();
  const filteredGestures = gestures.filter(g => g.id !== gestureId);

  if (filteredGestures.length !== gestures.length) {
    wx.setStorageSync(STORAGE_KEYS.CUSTOM_GESTURES, filteredGestures);
    return true;
  }

  return false;
}

/**
 * 导出手势数据
 * @param {string} gestureId - 手势唯一标识
 * @returns {string|null} 导出的手势数据字符串或null
 */
function exportGesture(gestureId) {
  const gesture = getCustomGestures().find(g => g.id === gestureId);

  if (gesture) {
    // 只导出必要的信息
    const exportData = {
      id: gesture.id,
      name: gesture.name,
      description: gesture.description,
      gesture: gesture.gesture,
      rows: gesture.rows,
      shareCode: gesture.shareCode
    };

    return JSON.stringify(exportData);
  }

  return null;
}

/**
 * 导入手势数据
 * @param {string} data - 导入的手势数据字符串
 * @returns {Object|null} 导入成功的手势对象或null
 */
function importGesture(data) {
  try {
    const importedData = JSON.parse(data);

    // 验证必要字段
    if (!importedData.gesture || !Array.isArray(importedData.gesture) ||
        !importedData.rows || typeof importedData.rows !== 'number') {
      return null;
    }

    // 创建导入的手势对象
    const importedGesture = {
      id: importedData.id || Date.now().toString(),
      name: importedData.name || '导入的手势',
      description: importedData.description || '',
      gesture: importedData.gesture,
      rows: importedData.rows,
      previewImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      shareCode: importedData.shareCode || generateShareCode(),
      createdAt: Date.now(),
      shareCount: 0,
      usedCount: 0
    };

    // 保存导入的手势
    saveCustomGesture(importedGesture);

    return importedGesture;
  } catch (e) {
    console.error('导入手势失败:', e);
    return null;
  }
}

/**
 * 生成分享码
 * @returns {string} 8位随机字符组成的分享码
 */
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 获取随机挑战手势
 * @returns {Object|null} 随机挑战对象或null
 */
function getRandomChallenge() {
  // 目前返回一个默认的挑战
  // 在实际项目中，这里可以从自定义手势列表或服务器获取随机挑战
  return {
    gesture: [0, 1, 2, 5, 8],
    description: '经典L形手势',
    difficulty: '简单'
  };
}

module.exports = {
  saveChallengeRecord,
  getChallengeRecords,
  clearChallengeRecords,
  getRankingData,
  saveCustomGesture,
  getCustomGestures,
  getCustomGestureByShareCode,
  deleteCustomGesture,
  exportGesture,
  importGesture,
  getRandomChallenge,
  generateShareCode
};
