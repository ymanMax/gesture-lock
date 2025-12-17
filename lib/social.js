/**
 * 社交功能库 - 封装微信小程序社交分享功能
 * 提供生成分享图片、分享到好友/朋友圈、复制分享链接等功能
 */

/**
 * 生成分享图片
 * @param {Object} data - 分享数据对象
 * @param {string} data.title - 分享标题
 * @param {string} data.description - 分享描述
 * @param {Array} data.gesture - 手势数据
 * @param {number} data.rows - 手势网格行数
 * @param {string} data.shareCode - 分享码
 * @returns {Promise<string>} 分享图片的临时文件路径
 */
function generateShareImage(data) {
  return new Promise((resolve, reject) => {
    try {
      // 在实际项目中，这里应该使用canvas来绘制真实的分享图片
      // 包含手势图案、分享码、标题等信息

      // 目前返回一个占位图，实际项目中需要替换为真实的canvas绘制逻辑
      const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      // 将base64数据转换为临时文件
      wx.base64ToArrayBuffer(placeholderImage.replace(/^data:image\/\w+;base64,/, ''));

      // 由于微信小程序的限制，这里我们返回一个默认的分享图片路径
      // 实际项目中需要使用canvas绘制并保存为临时文件
      resolve('/images/default-share-image.jpg');
    } catch (error) {
      console.error('生成分享图片失败:', error);
      reject(error);
    }
  });
}

/**
 * 分享到好友
 * @param {Object} shareData - 分享数据对象
 * @param {string} shareData.title - 分享标题
 * @param {string} shareData.content - 分享内容
 * @param {string} shareData.imageUrl - 分享图片URL
 * @param {string} shareData.path - 分享路径
 * @returns {Promise<void>}
 */
function shareToFriend(shareData) {
  return new Promise((resolve, reject) => {
    try {
      // 显示分享菜单
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      // 由于微信小程序的限制，实际的分享操作需要用户手动触发
      // 这里我们通过返回分享配置对象，供页面的onShareAppMessage使用

      // 触发分享事件（实际项目中需要用户点击分享按钮）
      resolve({
        title: shareData.title,
        path: shareData.path || '/pages/index/index',
        imageUrl: shareData.imageUrl || '/images/share-friend.jpg'
      });
    } catch (error) {
      console.error('分享到好友失败:', error);
      reject(error);
    }
  });
}

/**
 * 分享到朋友圈
 * @param {Object} shareData - 分享数据对象
 * @param {string} shareData.title - 分享标题
 * @param {string} shareData.query - 分享参数
 * @param {string} shareData.imageUrl - 分享图片URL
 * @returns {Promise<void>}
 */
function shareToTimeline(shareData) {
  return new Promise((resolve, reject) => {
    try {
      // 显示分享菜单
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });

      // 返回分享到朋友圈的配置
      resolve({
        title: shareData.title,
        query: shareData.query || '',
        imageUrl: shareData.imageUrl || '/images/share-timeline.jpg'
      });
    } catch (error) {
      console.error('分享到朋友圈失败:', error);
      reject(error);
    }
  });
}

/**
 * 复制分享链接
 * @param {string} shareUrl - 分享链接
 * @param {string} successMessage - 复制成功提示消息
 * @returns {Promise<void>}
 */
function copyShareLink(shareUrl, successMessage = '分享链接已复制') {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: shareUrl,
      success: () => {
        wx.showToast({
          title: successMessage,
          icon: 'success',
          duration: 2000
        });
        resolve();
      },
      fail: (error) => {
        console.error('复制分享链接失败:', error);
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        });
        reject(error);
      }
    });
  });
}

/**
 * 生成手势分享链接
 * @param {string} shareCode - 手势分享码
 * @returns {string} 完整的分享链接
 */
function generateGestureShareUrl(shareCode) {
  // 在微信小程序中，可以使用小程序路径作为分享链接
  // 其他用户打开时，可以通过分享码获取对应的手势
  return `pages/share/share?code=${shareCode}`;
}

/**
 * 生成挑战分享链接
 * @param {string} challengeId - 挑战ID
 * @returns {string} 完整的挑战分享链接
 */
function generateChallengeShareUrl(challengeId) {
  return `pages/challenge/challenge?id=${challengeId}`;
}

/**
 * 显示分享选项菜单
 * @param {Array} itemList - 分享选项列表
 * @returns {Promise<Object>} 用户选择的分享选项
 */
function showShareActionSheet(itemList = ['分享给朋友', '分享到朋友圈', '复制链接']) {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        resolve({
          tapIndex: res.tapIndex,
          item: itemList[res.tapIndex]
        });
      },
      fail: (error) => {
        console.error('显示分享菜单失败:', error);
        reject(error);
      }
    });
  });
}

/**
 * 分享自定义手势
 * @param {Object} gesture - 自定义手势对象
 * @returns {Promise<void>}
 */
function shareCustomGesture(gesture) {
  return new Promise(async (resolve, reject) => {
    try {
      const shareData = {
        title: `${gesture.name} - 自定义手势挑战`,
        content: gesture.description || '来挑战我的自定义手势吧！',
        imageUrl: gesture.previewImage || '/images/share-gesture.jpg',
        path: generateGestureShareUrl(gesture.shareCode)
      };

      // 显示分享选项
      const result = await showShareActionSheet();

      switch (result.tapIndex) {
        case 0: // 分享给朋友
          await shareToFriend(shareData);
          break;
        case 1: // 分享到朋友圈
          await shareToTimeline({
            title: shareData.content,
            query: `code=${gesture.shareCode}`,
            imageUrl: shareData.imageUrl
          });
          break;
        case 2: // 复制链接
          const shareUrl = `gesture://share?code=${gesture.shareCode}`;
          await copyShareLink(shareUrl, '手势分享链接已复制');
          break;
      }

      resolve();
    } catch (error) {
      console.error('分享自定义手势失败:', error);
      reject(error);
    }
  });
}

/**
 * 分享挑战成绩
 * @param {Object} challengeResult - 挑战成绩对象
 * @param {number} challengeResult.timeSpent - 挑战用时
 * @param {boolean} challengeResult.success - 是否挑战成功
 * @param {number} challengeResult.continuousCorrect - 连续正确次数
 * @returns {Promise<void>}
 */
function shareChallengeResult(challengeResult) {
  return new Promise(async (resolve, reject) => {
    try {
      const successText = challengeResult.success ? '成功' : '失败';
      const shareTitle = `我在手势挑战中${successText}了！`;
      const shareContent = challengeResult.success
        ? `用时${(challengeResult.timeSpent / 1000).toFixed(2)}秒，连续正确${challengeResult.continuousCorrect}次！`
        : `挑战失败了，不过我会继续努力的！`;

      const shareData = {
        title: shareTitle,
        content: shareContent,
        imageUrl: '/images/share-challenge-result.jpg',
        path: '/pages/ranking/ranking'
      };

      // 显示分享选项
      const result = await showShareActionSheet();

      switch (result.tapIndex) {
        case 0: // 分享给朋友
          await shareToFriend(shareData);
          break;
        case 1: // 分享到朋友圈
          await shareToTimeline({
            title: shareContent,
            imageUrl: shareData.imageUrl
          });
          break;
        case 2: // 复制链接
          await copyShareLink('gesture://challenge/result', '挑战成绩链接已复制');
          break;
      }

      resolve();
    } catch (error) {
      console.error('分享挑战成绩失败:', error);
      reject(error);
    }
  });
}

module.exports = {
  generateShareImage,
  shareToFriend,
  shareToTimeline,
  copyShareLink,
  generateGestureShareUrl,
  generateChallengeShareUrl,
  showShareActionSheet,
  shareCustomGesture,
  shareChallengeResult
};
