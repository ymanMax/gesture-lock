const { saveCustomGesture, getCustomGestures, exportGesture, importGesture } = require('../../lib/storage.js');
const { generateShareImage, shareToFriend, copyShareLink } = require('../../lib/social.js');

Page({
  data: {
    creating: false,
    customGestures: [],
    currentGesture: [],
    gestureName: '',
    gestureDescription: '',
    showPreview: false,
    previewImage: '',
    selectedRows: 3,
    showRowsSelector: false,
    saving: false,
    exporting: false
  },

  onLoad() {
    this.loadCustomGestures();
  },

  onShow() {
    this.loadCustomGestures();
  },

  // 加载自定义手势列表
  loadCustomGestures() {
    const gestures = getCustomGestures();
    this.setData({
      customGestures: gestures
    });
  },

  // 开始创建新手势
  startCreate() {
    this.setData({
      creating: true,
      currentGesture: [],
      gestureName: '',
      gestureDescription: '',
      selectedRows: 3
    });
  },

  // 切换手势行数
  toggleRows() {
    this.setData({
      showRowsSelector: !this.data.showRowsSelector
    });
  },

  // 选择手势行数
  selectRows(e) {
    const rows = parseInt(e.currentTarget.dataset.rows);
    this.setData({
      selectedRows: rows,
      currentGesture: [],
      showRowsSelector: false
    });
  },

  // 手势绘制完成
  onGestureComplete(e) {
    if (!this.data.creating) return;

    const gesture = e.detail;
    this.setData({
      currentGesture: gesture
    });
  },

  // 输入手势名称
  onNameInput(e) {
    this.setData({
      gestureName: e.detail.value.trim()
    });
  },

  // 输入手势描述
  onDescriptionInput(e) {
    this.setData({
      gestureDescription: e.detail.value.trim()
    });
  },

  // 保存自定义手势
  saveCustomGesture() {
    const { currentGesture, gestureName, gestureDescription, selectedRows } = this.data;

    // 验证输入
    if (!currentGesture || currentGesture.length < 4) {
      wx.showToast({
        title: '手势至少需要连接4个点',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (!gestureName) {
      wx.showToast({
        title: '请输入手势名称',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (gestureName.length > 20) {
      wx.showToast({
        title: '手势名称不能超过20个字',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ saving: true });

    // 生成手势预览图
    this.generatePreview().then(previewImage => {
      // 保存手势数据
      const gestureData = {
        id: Date.now().toString(),
        name: gestureName,
        description: gestureDescription,
        gesture: currentGesture,
        rows: selectedRows,
        previewImage: previewImage,
        shareCode: this.generateShareCode(),
        createdAt: Date.now(),
        shareCount: 0,
        usedCount: 0
      };

      saveCustomGesture(gestureData);

      this.setData({
        saving: false,
        creating: false
      });

      this.loadCustomGestures();

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000
      });
    }).catch(() => {
      this.setData({ saving: false });
      wx.showToast({
        title: '保存失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 生成分享代码
  generateShareCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // 生成预览图
  generatePreview() {
    return new Promise((resolve) => {
      // 在实际项目中，这里应该生成真实的预览图
      // 这里返回一个占位图URL
      resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    });
  },

  // 分享手势给朋友
  shareToFriend(e) {
    const gesture = e.currentTarget.dataset.gesture;
    shareToFriend(gesture);
  },

  // 复制分享链接
  copyShareLink(e) {
    const gesture = e.currentTarget.dataset.gesture;
    const shareUrl = `gesture://share?code=${gesture.shareCode}`;

    wx.setClipboardData({
      data: shareUrl,
      success: () => {
        // 更新分享次数
        gesture.shareCount = (gesture.shareCount || 0) + 1;
        saveCustomGesture(gesture);
        this.loadCustomGestures();

        wx.showToast({
          title: '分享链接已复制',
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  // 导出为图片
  exportAsImage(e) {
    const gesture = e.currentTarget.dataset.gesture;
    this.setData({ exporting: true });

    generateShareImage(gesture).then(imagePath => {
      this.setData({ exporting: false });

      // 保存到相册
      wx.saveImageToPhotosAlbum({
        filePath: imagePath,
        success: () => {
          gesture.shareCount = (gesture.shareCount || 0) + 1;
          saveCustomGesture(gesture);
          this.loadCustomGestures();

          wx.showToast({
            title: '图片已保存到相册',
            icon: 'success',
            duration: 2000
          });
        },
        fail: () => {
          wx.showToast({
            title: '保存失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }).catch(() => {
      this.setData({ exporting: false });
      wx.showToast({
        title: '生成图片失败',
        icon: 'none',
        duration: 2000
      });
    });
  },

  // 预览手势图片
  previewGesture(e) {
    const gesture = e.currentTarget.dataset.gesture;
    this.setData({
      showPreview: true,
      previewImage: gesture.previewImage || '/images/default-preview.png'
    });
  },

  // 关闭预览
  closePreview() {
    this.setData({ showPreview: false });
  },

  // 删除手势
  deleteGesture(e) {
    const gestureId = e.currentTarget.dataset.id;
    const that = this;

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      success: (res) => {
        if (res.confirm) {
          const gestures = that.data.customGestures.filter(g => g.id !== gestureId);
          wx.setStorageSync('custom_gestures', gestures);
          that.loadCustomGestures();

          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  // 取消创建
  cancelCreate() {
    this.setData({ creating: false });
  },

  // 导入手势
  importGesture() {
    const that = this;

    wx.showActionSheet({
      itemList: ['从剪贴板导入', '扫描二维码导入'],
      success: (res) => {
        if (res.tapIndex === 0) {
          that.importFromClipboard();
        } else if (res.tapIndex === 1) {
          that.scanQRCode();
        }
      }
    });
  },

  // 从剪贴板导入
  importFromClipboard() {
    const that = this;

    wx.getClipboardData({
      success: (res) => {
        try {
          const imported = importGesture(res.data);
          if (imported) {
            that.loadCustomGestures();
            wx.showToast({
              title: '导入成功',
              icon: 'success',
              duration: 2000
            });
          } else {
            wx.showToast({
              title: '无效的手势数据',
              icon: 'none',
              duration: 2000
            });
          }
        } catch (e) {
          wx.showToast({
            title: '导入失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '读取剪贴板失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 扫描二维码
  scanQRCode() {
    const that = this;

    wx.scanCode({
      success: (res) => {
        try {
          const imported = importGesture(res.result);
          if (imported) {
            that.loadCustomGestures();
            wx.showToast({
              title: '导入成功',
              icon: 'success',
              duration: 2000
            });
          } else {
            wx.showToast({
              title: '无效的手势数据',
              icon: 'none',
              duration: 2000
            });
          }
        } catch (e) {
          wx.showToast({
            title: '导入失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '扫描失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '创建你的专属手势，与朋友分享挑战！',
      path: '/pages/share/share',
      imageUrl: '/images/share-share.jpg'
    };
  }
});
