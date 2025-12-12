// 本地存储工具类

/**
 * 存储键名常量
 */
const STORAGE_KEYS = {
  GESTURE_PASSWORD: 'mini-lock_gesture_password',
  USER_SECURITY_INFO: 'mini-lock_security_info',
  IS_PASSWORD_SET: 'mini-lock_is_password_set',
  VERIFICATION_CODE: 'mini-lock_verification_code',
  CODE_EXPIRE_TIME: 'mini-lock_code_expire_time'
};

/**
 * 手势密码存储管理
 */
const gesturePasswordStorage = {
  /**
   * 保存手势密码
   * @param {Array} password - 手势密码序列 [1,2,3,6,9]
   * @returns {boolean} 是否保存成功
   */
  save(password) {
    try {
      const data = {
        password: password,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      wx.setStorageSync(STORAGE_KEYS.GESTURE_PASSWORD, data);
      wx.setStorageSync(STORAGE_KEYS.IS_PASSWORD_SET, true);
      return true;
    } catch (error) {
      console.error('保存手势密码失败:', error);
      return false;
    }
  },

  /**
   * 获取保存的手势密码
   * @returns {Object|null} 密码数据 { password: Array, createdAt: number, updatedAt: number }
   */
  get() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.GESTURE_PASSWORD) || null;
    } catch (error) {
      console.error('获取手势密码失败:', error);
      return null;
    }
  },

  /**
   * 删除手势密码
   * @returns {boolean} 是否删除成功
   */
  remove() {
    try {
      wx.removeStorageSync(STORAGE_KEYS.GESTURE_PASSWORD);
      wx.setStorageSync(STORAGE_KEYS.IS_PASSWORD_SET, false);
      return true;
    } catch (error) {
      console.error('删除手势密码失败:', error);
      return false;
    }
  },

  /**
   * 验证手势密码
   * @param {Array} inputPassword - 输入的密码序列
   * @returns {boolean} 是否验证通过
   */
  verify(inputPassword) {
    try {
      const savedData = this.get();
      if (!savedData || !savedData.password) {
        return false;
      }
      return JSON.stringify(savedData.password) === JSON.stringify(inputPassword);
    } catch (error) {
      console.error('验证手势密码失败:', error);
      return false;
    }
  }
};

/**
 * 用户安全信息存储管理（用于密码重置）
 */
const securityInfoStorage = {
  /**
   * 保存安全信息
   * @param {Object} info - 安全信息对象
   * @param {string} info.question - 安全问题
   * @param {string} info.answer - 安全答案（已加密）
   * @param {string} [info.phone] - 手机号（可选）
   * @param {string} [info.email] - 邮箱（可选）
   * @returns {boolean} 是否保存成功
   */
  save(info) {
    try {
      const data = {
        ...info,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      wx.setStorageSync(STORAGE_KEYS.USER_SECURITY_INFO, data);
      return true;
    } catch (error) {
      console.error('保存安全信息失败:', error);
      return false;
    }
  },

  /**
   * 获取安全信息
   * @returns {Object|null} 安全信息对象
   */
  get() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.USER_SECURITY_INFO) || null;
    } catch (error) {
      console.error('获取安全信息失败:', error);
      return null;
    }
  },

  /**
   * 验证安全答案
   * @param {string} inputAnswer - 输入的答案
   * @returns {boolean} 是否验证通过
   */
  verifyAnswer(inputAnswer) {
    try {
      const savedInfo = this.get();
      if (!savedInfo || !savedInfo.answer) {
        return false;
      }
      // Mock 简单比较（实际应该用加密后的比较）
      return savedInfo.answer.toLowerCase() === inputAnswer.toLowerCase();
    } catch (error) {
      console.error('验证安全答案失败:', error);
      return false;
    }
  },

  /**
   * 更新安全信息
   * @param {Object} info - 部分安全信息
   * @returns {boolean} 是否更新成功
   */
  update(info) {
    try {
      const savedInfo = this.get();
      if (!savedInfo) {
        return false;
      }
      const updatedInfo = {
        ...savedInfo,
        ...info,
        updatedAt: Date.now()
      };
      wx.setStorageSync(STORAGE_KEYS.USER_SECURITY_INFO, updatedInfo);
      return true;
    } catch (error) {
      console.error('更新安全信息失败:', error);
      return false;
    }
  }
};

/**
 * 验证码存储管理（用于密码重置）
 */
const verificationCodeStorage = {
  /**
   * 生成验证码
   * @param {number} length - 验证码长度
   * @returns {string} 验证码
   */
  generateCode(length = 6) {
    const chars = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  /**
   * 发送验证码（Mock）
   * @param {string} target - 目标手机号或邮箱
   * @param {string} type - 验证码类型 'sms' 或 'email'
   * @returns {Object} { success: boolean, message: string, code?: string }
   */
  sendCode(target, type = 'sms') {
    try {
      const code = this.generateCode();
      const expireTime = Date.now() + 5 * 60 * 1000; // 5分钟过期

      // Mock 发送成功
      console.log(`[Mock] 发送${type === 'sms' ? '短信' : '邮箱'}验证码到 ${target}: ${code}`);

      // 保存验证码到本地存储
      wx.setStorageSync(STORAGE_KEYS.VERIFICATION_CODE, code);
      wx.setStorageSync(STORAGE_KEYS.CODE_EXPIRE_TIME, expireTime);

      return {
        success: true,
        message: `${type === 'sms' ? '短信' : '邮箱'}验证码已发送，5分钟内有效`,
        code: code // 仅用于调试
      };
    } catch (error) {
      console.error('发送验证码失败:', error);
      return {
        success: false,
        message: '发送验证码失败，请稍后重试'
      };
    }
  },

  /**
   * 验证验证码
   * @param {string} inputCode - 输入的验证码
   * @returns {Object} { valid: boolean, message: string }
   */
  verifyCode(inputCode) {
    try {
      const savedCode = wx.getStorageSync(STORAGE_KEYS.VERIFICATION_CODE);
      const expireTime = wx.getStorageSync(STORAGE_KEYS.CODE_EXPIRE_TIME);

      if (!savedCode) {
        return {
          valid: false,
          message: '请先获取验证码'
        };
      }

      if (Date.now() > expireTime) {
        this.clearCode();
        return {
          valid: false,
          message: '验证码已过期，请重新获取'
        };
      }

      if (inputCode === savedCode) {
        this.clearCode();
        return {
          valid: true,
          message: '验证码验证成功'
        };
      }

      return {
        valid: false,
        message: '验证码错误，请重新输入'
      };
    } catch (error) {
      console.error('验证验证码失败:', error);
      return {
        valid: false,
        message: '验证失败，请稍后重试'
      };
    }
  },

  /**
   * 清除验证码
   * @returns {boolean} 是否清除成功
   */
  clearCode() {
    try {
      wx.removeStorageSync(STORAGE_KEYS.VERIFICATION_CODE);
      wx.removeStorageSync(STORAGE_KEYS.CODE_EXPIRE_TIME);
      return true;
    } catch (error) {
      console.error('清除验证码失败:', error);
      return false;
    }
  },

  /**
   * 获取验证码剩余时间（秒）
   * @returns {number} 剩余时间（秒），-1 表示已过期或不存在
   */
  getRemainingTime() {
    try {
      const expireTime = wx.getStorageSync(STORAGE_KEYS.CODE_EXPIRE_TIME);
      if (!expireTime || Date.now() > expireTime) {
        return -1;
      }
      return Math.ceil((expireTime - Date.now()) / 1000);
    } catch (error) {
      console.error('获取验证码剩余时间失败:', error);
      return -1;
    }
  }
};

/**
 * 全局配置存储
 */
const configStorage = {
  /**
   * 检查是否已设置手势密码
   * @returns {boolean} 是否已设置
   */
  isPasswordSet() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.IS_PASSWORD_SET) || false;
    } catch (error) {
      console.error('检查密码设置状态失败:', error);
      return false;
    }
  },

  /**
   * 设置密码设置状态
   * @param {boolean} status - 状态
   * @returns {boolean} 是否设置成功
   */
  setPasswordSetStatus(status) {
    try {
      wx.setStorageSync(STORAGE_KEYS.IS_PASSWORD_SET, status);
      return true;
    } catch (error) {
      console.error('设置密码状态失败:', error);
      return false;
    }
  },

  /**
   * 清除所有存储数据
   * @returns {boolean} 是否清除成功
   */
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        wx.removeStorageSync(key);
      });
      return true;
    } catch (error) {
      console.error('清除所有数据失败:', error);
      return false;
    }
  }
};

/**
 * Mock 数据生成器
 */
const mockDataGenerator = {
  /**
   * 生成 Mock 安全问题列表
   * @returns {Array} 安全问题列表
   */
  generateSecurityQuestions() {
    return [
      { id: 1, question: '您的出生地是？' },
      { id: 2, question: '您父亲的姓名是？' },
      { id: 3, question: '您母亲的姓名是？' },
      { id: 4, question: '您小学就读的学校名称是？' },
      { id: 5, question: '您的第一份工作是什么？' },
      { id: 6, question: '您最喜欢的书籍名称是？' }
    ];
  },

  /**
   * 生成 Mock 用户信息
   * @returns {Object} 用户信息
   */
  generateUserInfo() {
    return {
      phone: '138****5678',
      email: 'zhangsan****@example.com'
    };
  }
};

module.exports = {
  // 存储键名
  STORAGE_KEYS,

  // 手势密码存储
  gesturePassword: gesturePasswordStorage,

  // 安全信息存储
  securityInfo: securityInfoStorage,

  // 验证码存储
  verificationCode: verificationCodeStorage,

  // 配置存储
  config: configStorage,

  // Mock 数据生成器
  mockData: mockDataGenerator
};