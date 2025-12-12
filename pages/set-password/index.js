const storage = require('../../utils/storage.js');

Page({
  data: {
    containerWidth: 600,
    step: 1, // 1: 设置密码, 2: 确认密码, 3: 完成
    password1: [],
    password2: [],
    message: '',
    messageType: '', // 'success', 'error', 'info'
    showSecurityQuestion: false,
    securityQuestions: [],
    selectedQuestionIndex: 0,
    selectedQuestion: '',
    securityAnswer: ''
  },

  onLoad() {
    // 获取屏幕宽度
    const systemInfo = wx.getSystemInfoSync();
    const screenWidthRpx = 750;
    const containerWidthRpx = screenWidthRpx - 80;
    this.setData({
      containerWidth: containerWidthRpx,
      securityQuestions: storage.mockData.generateSecurityQuestions()
    });

    // 检查是否已设置密码
    const isPasswordSet = storage.config.isPasswordSet();
    if (isPasswordSet) {
      this.setData({
        step: 3,
        message: '您已设置手势密码，可在此修改',
        messageType: 'info'
      });
    } else {
      this.setData({
        message: '请设置您的手势密码',
        messageType: 'info'
      });
    }
  },

  // 手势密码输入完成
  onGestureEnd(e) {
    const password = e.detail;

    if (this.data.step === 1) {
      // 第一步：设置密码
      this.handleStep1(password);
    } else if (this.data.step === 2) {
      // 第二步：确认密码
      this.handleStep2(password);
    }
  },

  // 处理第一步：设置密码
  handleStep1(password) {
    if (password.length < 4) {
      this.showMessage('密码长度不足，至少需要连接4个点', 'error');
      return;
    }

    this.setData({
      password1: password,
      step: 2,
      message: '请再次输入相同的手势密码',
      messageType: 'info'
    });
  },

  // 处理第二步：确认密码
  handleStep2(password) {
    if (JSON.stringify(password) === JSON.stringify(this.data.password1)) {
      // 密码一致，保存密码
      const saveSuccess = storage.gesturePassword.save(password);

      if (saveSuccess) {
        this.setData({
          password2: password,
          step: 3,
          message: '手势密码设置成功！',
          messageType: 'success'
        });

        // 提示用户是否设置安全问题
        setTimeout(() => {
          this.showSetSecurityQuestionDialog();
        }, 1000);
      } else {
        this.showMessage('密码保存失败，请稍后重试', 'error');
      }
    } else {
      this.showMessage('两次输入的密码不一致，请重新输入', 'error');
      this.setData({
        step: 1,
        password1: [],
        password2: []
      });
    }
  },

  // 显示设置安全问题的对话框
  showSetSecurityQuestionDialog() {
    wx.showModal({
      title: '设置安全问题',
      content: '为了您的账户安全，建议设置安全问题以便后续重置密码',
      confirmText: '立即设置',
      cancelText: '以后再说',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            showSecurityQuestion: true
          });
        }
      }
    });
  },

  // 选择安全问题
  onQuestionChange(e) {
    const index = e.detail.value;
    this.setData({
      selectedQuestion: this.data.securityQuestions[index].question
    });
  },

  // 安全答案输入
  onAnswerInput(e) {
    this.setData({
      securityAnswer: e.detail.value.trim()
    });
  },

  // 保存安全问题
  saveSecurityQuestion() {
    const { selectedQuestion, securityAnswer } = this.data;

    if (!selectedQuestion) {
      this.showMessage('请选择安全问题', 'error');
      return;
    }

    if (!securityAnswer) {
      this.showMessage('请输入安全答案', 'error');
      return;
    }

    if (securityAnswer.length < 2) {
      this.showMessage('安全答案不能少于2个字符', 'error');
      return;
    }

    // Mock 用户信息
    const userInfo = storage.mockData.generateUserInfo();

    // 保存安全信息
    const saveSuccess = storage.securityInfo.save({
      question: selectedQuestion,
      answer: securityAnswer,
      phone: userInfo.phone,
      email: userInfo.email
    });

    if (saveSuccess) {
      this.showMessage('安全问题设置成功！', 'success');
      this.setData({
        showSecurityQuestion: false,
        selectedQuestion: '',
        securityAnswer: ''
      });

      // 延迟返回主页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      this.showMessage('安全问题保存失败，请稍后重试', 'error');
    }
  },

  // 跳过安全问题设置
  skipSecurityQuestion() {
    this.setData({
      showSecurityQuestion: false
    });

    wx.showModal({
      title: '提示',
      content: '您未设置安全问题，如果忘记密码将无法重置',
      confirmText: '我知道了',
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },

  // 重新设置密码
  resetPassword() {
    wx.showModal({
      title: '重新设置',
      content: '确定要重新设置手势密码吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            step: 1,
            password1: [],
            password2: [],
            message: '请设置您的手势密码',
            messageType: 'info'
          });
        }
      }
    });
  },

  // 删除密码
  deletePassword() {
    wx.showModal({
      title: '删除密码',
      content: '确定要删除当前的手势密码吗？',
      success: (res) => {
        if (res.confirm) {
          const deleteSuccess = storage.gesturePassword.remove();

          if (deleteSuccess) {
            this.showMessage('手势密码已删除', 'success');
            this.setData({
              step: 1,
              password1: [],
              password2: [],
              message: '请设置您的手势密码',
              messageType: 'info'
            });
          } else {
            this.showMessage('密码删除失败，请稍后重试', 'error');
          }
        }
      }
    });
  },

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
    wx.navigateBack();
  }
});