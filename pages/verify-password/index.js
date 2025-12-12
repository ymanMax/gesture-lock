const storage = require('../../utils/storage.js');

Page({
  data: {
    containerWidth: 600,
    message: '请输入手势密码解锁',
    messageType: 'info',
    errorCount: 0,
    maxErrorCount: 5,
    lockTime: 0, // 锁定时间（秒）
    isLocked: false,
    showForgotPassword: false,
    // 密码输入相关
    inputPassword: [],
    isVerifying: false
  },

  onLoad(options) {
    // 获取屏幕宽度
    const systemInfo = wx.getSystemInfoSync();
    const screenWidthRpx = 750;
    const containerWidthRpx = screenWidthRpx - 80;
    this.setData({
      containerWidth: containerWidthRpx
    });

    // 检查是否已设置密码
    const isPasswordSet = storage.config.isPasswordSet();
    if (!isPasswordSet) {
      wx.showModal({
        title: '提示',
        content: '您尚未设置手势密码，请先设置密码',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/set-password/index'
            });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    // 检查是否有锁定时间
    this.checkLockStatus();

    // 如果是从忘记密码页面返回，显示提示
    if (options.from === 'reset') {
      this.setData({
        message: '密码已重置，请重新输入',
        messageType: 'success'
      });
    }
  },

  onShow() {
    // 每次页面显示时检查锁定状态
    this.checkLockStatus();
  },

  onUnload() {
    // 清除定时器
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }
  },

  // 检查锁定状态
  checkLockStatus() {
    try {
      const lockData = wx.getStorageSync('mini-lock_lock_data');
      if (lockData && lockData.lockUntil) {
        const now = Date.now();
        if (now < lockData.lockUntil) {
          const lockTime = Math.ceil((lockData.lockUntil - now) / 1000);
          this.setData({
            isLocked: true,
            lockTime: lockTime,
            message: `输入错误次数过多，请${lockTime}秒后重试`,
            messageType: 'error'
          });
          this.startLockTimer();
        } else {
          // 锁定时间已过，清除锁定数据
          wx.removeStorageSync('mini-lock_lock_data');
          this.setData({
            isLocked: false,
            lockTime: 0,
            errorCount: 0,
            message: '请输入手势密码解锁',
            messageType: 'info'
          });
        }
      }
    } catch (error) {
      console.error('检查锁定状态失败:', error);
    }
  },

  // 启动锁定倒计时定时器
  startLockTimer() {
    if (this.lockTimer) {
      clearInterval(this.lockTimer);
    }

    this.lockTimer = setInterval(() => {
      this.setData({
        lockTime: this.data.lockTime - 1
      });

      if (this.data.lockTime <= 0) {
        clearInterval(this.lockTimer);
        this.setData({
          isLocked: false,
          lockTime: 0,
          errorCount: 0,
          message: '请输入手势密码解锁',
          messageType: 'info'
        });
        // 清除锁定数据
        try {
          wx.removeStorageSync('mini-lock_lock_data');
        } catch (error) {
          console.error('清除锁定数据失败:', error);
        }
      } else {
        this.setData({
          message: `输入错误次数过多，请${this.data.lockTime}秒后重试`,
          messageType: 'error'
        });
      }
    }, 1000);
  },

  // 手势密码输入完成
  onGestureEnd(e) {
    if (this.data.isLocked || this.data.isVerifying) {
      return;
    }

    const password = e.detail;
    this.setData({
      inputPassword: password,
      isVerifying: true
    });

    this.verifyPassword(password);
  },

  // 验证手势密码
  verifyPassword(password) {
    const isCorrect = storage.gesturePassword.verify(password);

    setTimeout(() => {
      if (isCorrect) {
        // 验证成功
        this.handleVerificationSuccess();
      } else {
        // 验证失败
        this.handleVerificationFailure();
      }

      this.setData({
        isVerifying: false
      });
    }, 500); // 延迟500ms显示结果
  },

  // 处理验证成功
  handleVerificationSuccess() {
    // 清除错误计数
    this.setData({
      errorCount: 0,
      message: '验证成功！',
      messageType: 'success'
    });

    // 模拟解锁成功后的操作
    setTimeout(() => {
      wx.showToast({
        title: '解锁成功',
        icon: 'success',
        duration: 1000
      });

      // 可以在这里执行解锁后的逻辑，比如跳转到主页面
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack();
        } else {
          // 如果是从应用入口进入，跳转到首页
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      }, 1000);
    }, 500);
  },

  // 处理验证失败
  handleVerificationFailure() {
    const newErrorCount = this.data.errorCount + 1;
    const remainingCount = this.data.maxErrorCount - newErrorCount;

    this.setData({
      errorCount: newErrorCount
    });

    // 检查是否达到最大错误次数
    if (newErrorCount >= this.data.maxErrorCount) {
      // 锁定账户
      this.lockAccount();
    } else {
      // 显示剩余尝试次数
      let errorMessage = '手势密码错误，请重新输入';
      if (remainingCount > 0) {
        errorMessage += `，还有${remainingCount}次机会`;
      }

      this.setData({
        message: errorMessage,
        messageType: 'error'
      });

      // 3秒后清除错误提示
      setTimeout(() => {
        if (remainingCount > 0) {
          this.setData({
            message: '请输入手势密码解锁',
            messageType: 'info'
          });
        }
      }, 3000);
    }
  },

  // 锁定账户
  lockAccount() {
    const lockDuration = 60; // 锁定60秒
    const lockUntil = Date.now() + lockDuration * 1000;

    // 保存锁定信息到本地存储
    try {
      wx.setStorageSync('mini-lock_lock_data', {
        errorCount: this.data.errorCount,
        lockUntil: lockUntil,
        lockedAt: Date.now()
      });
    } catch (error) {
      console.error('保存锁定信息失败:', error);
    }

    this.setData({
      isLocked: true,
      lockTime: lockDuration,
      message: `输入错误次数过多，请${lockDuration}秒后重试`,
      messageType: 'error'
    });

    this.startLockTimer();
  },

  // 显示忘记密码选项
  showForgotPasswordOptions() {
    wx.showActionSheet({
      itemList: ['通过安全问题重置', '通过验证码重置'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 通过安全问题重置
          wx.navigateTo({
            url: '/pages/reset-password/index?type=security'
          });
        } else if (res.tapIndex === 1) {
          // 通过验证码重置
          wx.navigateTo({
            url: '/pages/reset-password/index?type=verification'
          });
        }
      },
      fail: () => {
        // 用户取消
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});