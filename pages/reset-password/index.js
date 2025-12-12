const storage = require('../../utils/storage.js');

Page({
  data: {
    resetType: 'security', // 'security' 或 'verification'
    // 安全问题验证相关
    securityQuestion: '',
    securityAnswer: '',
    // 验证码验证相关
    verifyMethod: 'sms', // 'sms' 或 'email'
    targetPhone: '',
    targetEmail: '',
    verificationCode: '',
    codeButtonText: '获取验证码',
    codeButtonDisabled: false,
    codeCountdown: 0,
    // 新密码设置相关
    step: 1, // 1: 验证身份, 2: 设置新密码, 3: 确认新密码, 4: 完成
    newPassword1: [],
    newPassword2: [],
    // 消息提示
    message: '',
    messageType: '', // 'success', 'error', 'info'
    // 页面状态
    containerWidth: 600,
    isVerifying: false,
    isSettingPassword: false
  },

  onLoad(options) {
    // 获取屏幕宽度
    const systemInfo = wx.getSystemInfoSync();
    const screenWidthRpx = 750;
    const containerWidthRpx = screenWidthRpx - 80;
    this.setData({
      containerWidth: containerWidthRpx
    });

    // 获取重置类型
    if (options.type) {
      this.setData({
        resetType: options.type
      });
    }

    // 初始化页面数据
    this.initPageData();
  },

  onUnload() {
    // 清除验证码倒计时定时器
    if (this.codeCountdownTimer) {
      clearInterval(this.codeCountdownTimer);
    }
  },

  // 初始化页面数据
  initPageData() {
    if (this.data.resetType === 'security') {
      // 获取已设置的安全问题
      const securityInfo = storage.securityInfo.get();
      if (securityInfo && securityInfo.question) {
        this.setData({
          securityQuestion: securityInfo.question,
          message: '请回答安全问题以验证身份',
          messageType: 'info'
        });
      } else {
        // 未设置安全问题，提示用户并返回
        wx.showModal({
          title: '提示',
          content: '您尚未设置安全问题，无法通过此方式重置密码',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    } else if (this.data.resetType === 'verification') {
      // 获取Mock用户信息
      const userInfo = storage.mockData.generateUserInfo();
      this.setData({
        targetPhone: userInfo.phone,
        targetEmail: userInfo.email,
        message: '请选择验证方式并获取验证码',
        messageType: 'info'
      });
    }
  },

  // ==================== 安全问题验证 ====================

  // 安全答案输入
  onSecurityAnswerInput(e) {
    this.setData({
      securityAnswer: e.detail.value.trim()
    });
  },

  // 验证安全问题
  verifySecurityQuestion() {
    const { securityAnswer } = this.data;

    if (!securityAnswer) {
      this.showMessage('请输入安全答案', 'error');
      return;
    }

    this.setData({
      isVerifying: true
    });

    // 延迟模拟验证过程
    setTimeout(() => {
      const isValid = storage.securityInfo.verifyAnswer(securityAnswer);

      if (isValid) {
        // 验证成功，进入设置新密码步骤
        this.setData({
          step: 2,
          message: '身份验证成功，请设置新的手势密码',
          messageType: 'success'
        });
      } else {
        // 验证失败
        this.showMessage('安全答案错误，请重新输入', 'error');
      }

      this.setData({
        isVerifying: false
      });
    }, 800);
  },

  // ==================== 验证码验证 ====================

  // 切换验证方式
  onVerifyMethodChange(e) {
    this.setData({
      verifyMethod: e.currentTarget.dataset.type
    });
  },

  // 获取验证码
  getVerificationCode() {
    if (this.data.codeButtonDisabled) {
      return;
    }

    const { verifyMethod, targetPhone, targetEmail } = this.data;
    const target = verifyMethod === 'sms' ? targetPhone : targetEmail;

    // 模拟发送验证码
    const result = storage.verificationCode.sendCode(target, verifyMethod);

    if (result.success) {
      this.showMessage(result.message, 'success');
      this.startCodeCountdown();
    } else {
      this.showMessage(result.message, 'error');
    }
  },

  // 启动验证码倒计时
  startCodeCountdown() {
    const countdownSeconds = 60;

    this.setData({
      codeButtonDisabled: true,
      codeCountdown: countdownSeconds
    });

    this.codeCountdownTimer = setInterval(() => {
      const remainingSeconds = this.data.codeCountdown - 1;

      if (remainingSeconds <= 0) {
        clearInterval(this.codeCountdownTimer);
        this.setData({
          codeButtonText: '获取验证码',
          codeButtonDisabled: false,
          codeCountdown: 0
        });
      } else {
        this.setData({
          codeButtonText: `${remainingSeconds}秒后重试`,
          codeCountdown: remainingSeconds
        });
      }
    }, 1000);
  },

  // 验证码输入
  onVerificationCodeInput(e) {
    this.setData({
      verificationCode: e.detail.value.trim()
    });
  },

  // 验证验证码
  verifyVerificationCode() {
    const { verificationCode } = this.data;

    if (!verificationCode) {
      this.showMessage('请输入验证码', 'error');
      return;
    }

    if (verificationCode.length !== 6) {
      this.showMessage('验证码长度错误，请输入6位数字', 'error');
      return;
    }

    this.setData({
      isVerifying: true
    });

    // 延迟模拟验证过程
    setTimeout(() => {
      const result = storage.verificationCode.verifyCode(verificationCode);

      if (result.valid) {
        // 验证成功，进入设置新密码步骤
        this.setData({
          step: 2,
          message: '身份验证成功，请设置新的手势密码',
          messageType: 'success'
        });
      } else {
        // 验证失败
        this.showMessage(result.message, 'error');
      }

      this.setData({
        isVerifying: false
      });
    }, 800);
  },

  // ==================== 设置新密码 ====================

  // 手势密码输入完成
  onGestureEnd(e) {
    if (this.data.isSettingPassword) {
      return;
    }

    const password = e.detail;

    if (this.data.step === 2) {
      // 第一步：设置新密码
      this.handleSetNewPassword(password);
    } else if (this.data.step === 3) {
      // 第二步：确认新密码
      this.handleConfirmNewPassword(password);
    }
  },

  // 处理设置新密码
  handleSetNewPassword(password) {
    if (password.length < 4) {
      this.showMessage('密码长度不足，至少需要连接4个点', 'error');
      return;
    }

    this.setData({
      newPassword1: password,
      step: 3,
      message: '请再次输入相同的手势密码',
      messageType: 'info'
    });
  },

  // 处理确认新密码
  handleConfirmNewPassword(password) {
    this.setData({
      isSettingPassword: true
    });

    // 延迟模拟验证过程
    setTimeout(() => {
      if (JSON.stringify(password) === JSON.stringify(this.data.newPassword1)) {
        // 密码一致，保存新密码
        const saveSuccess = storage.gesturePassword.save(password);

        if (saveSuccess) {
          this.setData({
            newPassword2: password,
            step: 4,
            message: '手势密码重置成功！',
            messageType: 'success'
          });

          // 清除锁定信息（如果存在）
          try {
            wx.removeStorageSync('mini-lock_lock_data');
          } catch (error) {
            console.error('清除锁定信息失败:', error);
          }

          // 延迟返回验证页面
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/verify-password/index?from=reset'
            });
          }, 1500);
        } else {
          this.showMessage('密码保存失败，请稍后重试', 'error');
        }
      } else {
        this.showMessage('两次输入的密码不一致，请重新输入', 'error');
        this.setData({
          step: 2,
          newPassword1: [],
          newPassword2: []
        });
      }

      this.setData({
        isSettingPassword: false
      });
    }, 800);
  },

  // ==================== 通用方法 ====================

  // 显示消息提示
  showMessage(message, type = 'info') {
    this.setData({
      message: message,
      messageType: type
    });

    // 3秒后清除消息
    if (type !== 'info') {
      setTimeout(() => {
        this.setData({
          message: ''
        });
      }, 3000);
    }
  },

  // 返回上一页
  goBack() {
    if (this.data.step > 1) {
      // 如果已经进入设置密码步骤，返回上一步
      this.setData({
        step: this.data.step - 1
      });
    } else {
      // 否则返回上一页
      wx.navigateBack();
    }
  },

  // 重新验证
  reVerify() {
    this.setData({
      step: 1,
      securityAnswer: '',
      verificationCode: '',
      newPassword1: [],
      newPassword2: []
    });
  }
});