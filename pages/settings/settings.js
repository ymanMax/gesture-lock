const app = getApp();

Page({
  data: {
    themes: [
      { name: 'tech', title: '科技风', icon: '⚡' },
      { name: 'simple', title: '简约风', icon: '◻️' },
      { name: 'cartoon', title: '卡通风', icon: '🎨' }
    ],
    gridSizes: [
      { rows: 3, title: '3×3 简单', desc: '适合快速解锁' },
      { rows: 4, title: '4×4 中等', desc: '平衡安全性与易用性' },
      { rows: 5, title: '5×5 高级', desc: '高安全性，解锁难度大' },
      { rows: 6, title: '6×6 专家', desc: '最高安全级别' }
    ],
    effects: [
      { name: 'particles', title: '粒子效果', enabled: true },
      { name: 'ripple', title: '波纹效果', enabled: false },
      { name: 'shine', title: '发光效果', enabled: true }
    ],
    feedback: {
      sound: true,
      vibrate: true
    },
    currentTheme: 'tech',
    currentGridSize: 3
  },

  onLoad() {
    this.loadSettings();
  },

  loadSettings() {
    try {
      const settings = wx.getStorageSync('gesture_lock_settings');
      if (settings) {
        this.setData({
          currentTheme: settings.theme || 'tech',
          currentGridSize: settings.gridSize || 3,
          feedback: {
            sound: settings.sound !== false,
            vibrate: settings.vibrate !== false
          }
        });
      }
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  },

  saveSettings() {
    const settings = {
      theme: this.data.currentTheme,
      gridSize: this.data.currentGridSize,
      sound: this.data.feedback.sound,
      vibrate: this.data.feedback.vibrate
    };

    try {
      wx.setStorageSync('gesture_lock_settings', settings);
      this.showToast('设置已保存');

      if (getApp().onSettingsChange) {
        getApp().onSettingsChange(settings);
      }
    } catch (e) {
      console.error('保存设置失败:', e);
      this.showToast('保存失败');
    }
  },

  onThemeChange(e) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({ currentTheme: theme });
    this.saveSettings();
  },

  onGridSizeChange(e) {
    const gridSize = parseInt(e.currentTarget.dataset.gridsize);
    this.setData({ currentGridSize: gridSize });
    this.saveSettings();
  },

  onSoundToggle() {
    this.setData({
      'feedback.sound': !this.data.feedback.sound
    });
    this.saveSettings();
  },

  onVibrateToggle() {
    this.setData({
      'feedback.vibrate': !this.data.feedback.vibrate
    });
    this.saveSettings();
  },

  onEffectToggle(e) {
    const effectName = e.currentTarget.dataset.effect;
    const effects = this.data.effects.map(effect => {
      if (effect.name === effectName) {
        return { ...effect, enabled: !effect.enabled };
      }
      return effect;
    });

    this.setData({ effects });

    const enabledEffects = effects.filter(e => e.enabled).map(e => e.name);
    try {
      wx.setStorageSync('gesture_lock_effects', enabledEffects);
      this.showToast('效果设置已保存');
    } catch (e) {
      console.error('保存效果设置失败:', e);
    }
  },

  showToast(title) {
    wx.showToast({
      title,
      icon: 'none',
      duration: 1500
    });
  },

  previewTheme(e) {
    const theme = e.currentTarget.dataset.theme;
    this.setData({ previewTheme: theme });
  },

  onReset() {
    wx.showModal({
      title: '重置设置',
      content: '确定要恢复默认设置吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('gesture_lock_settings');
            wx.removeStorageSync('gesture_lock_effects');
            this.setData({
              currentTheme: 'tech',
              currentGridSize: 3,
              feedback: {
                sound: true,
                vibrate: true
              },
              effects: this.data.effects.map(e => ({
                ...e,
                enabled: e.name === 'particles' || e.name === 'shine'
              }))
            });
            this.showToast('设置已重置');
          } catch (e) {
            console.error('重置设置失败:', e);
            this.showToast('重置失败');
          }
        }
      }
    });
  }
});
