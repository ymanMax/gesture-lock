import GestureLock from '../../lib/gestureLock.js';

Component({
  properties: {
    containerWidth: {
      type: Number,
      value: 600
    },
    cycleRadius: {
      type: Number,
      value: 40
    },
    password: {
      type: Array,
      value: []
    },
    rows: {
      type: Number,
      value: 3
    },
    theme: {
      type: String,
      value: 'tech'
    }
  },

  data: {
    circleArray: [],
    lineArray: [],
    activeLine: {},
    error: false,
    particles: []
  },

  lifetimes: {
    attached() {
      this.initGestureLock();
    }
  },

  observers: {
    'rows, containerWidth, cycleRadius': function() {
      this.initGestureLock();
    },
    'theme': function() {
      this.setData({
        particles: []
      });
    }
  },

  methods: {
    initGestureLock() {
      this.gestureLock = new GestureLock(
        this.data.containerWidth,
        this.data.cycleRadius,
        this.data.rows
      );
      this.refresh();
    },

    onTouchStart(e) {
      if (this.data.error) return;
      this.gestureLock.onTouchStart(e);
      this.refresh();
    },

    onTouchMove(e) {
      if (this.data.error) return;
      this.gestureLock.onTouchMove(e);
      this.refresh();
    },

    onTouchEnd(e) {
      if (this.data.error) return;
      const checkPoints = this.gestureLock.onTouchEnd(e);

      if (this.data.password.length > 0) {
        const isCorrect = this.compareArrays(checkPoints, this.data.password);
        if (!isCorrect) {
          this.setData({ error: true });
          this.vibrate('long');
          this.playSound('error');

          setTimeout(() => {
            this.reset();
          }, 800);
        } else {
          this.setData({ error: false });
          this.vibrate('short');
          this.playSound('success');
          this.createSuccessEffect();

          setTimeout(() => {
            this.triggerEvent('end', { data: checkPoints });
            this.reset();
          }, 500);
        }
      } else {
        this.triggerEvent('end', { data: checkPoints });
        this.reset();
      }
    },

    refresh() {
      this.setData({
        circleArray: this.gestureLock.getCycleArray(),
        lineArray: this.gestureLock.getLineArray(),
        activeLine: this.gestureLock.getActiveLine()
      });
    },

    reset() {
      this.gestureLock.reset();
      this.setData({
        circleArray: this.gestureLock.getCycleArray(),
        lineArray: this.gestureLock.getLineArray(),
        activeLine: this.gestureLock.getActiveLine(),
        error: false,
        particles: []
      });
    },

    compareArrays(arr1, arr2) {
      if (arr1.length !== arr2.length) return false;
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
      return true;
    },

    vibrate(type) {
      if (wx.vibrateShort && type === 'short') {
        wx.vibrateShort();
      } else if (wx.vibrateLong && type === 'long') {
        wx.vibrateLong();
      }
    },

    playSound(type) {
      if (wx.createInnerAudioContext) {
        const audio = wx.createInnerAudioContext();
        if (type === 'success') {
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+9OOVTgwOQp+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+9OOVTgw=';
        } else if (type === 'error') {
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+9OOVTgwOQp+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+9OOVTgw=';
        }
        audio.play();
        audio.onEnded(() => {
          audio.destroy();
        });
      }
    },

    createSuccessEffect() {
      const particles = [];
      const centerX = this.data.containerWidth / 2;
      const centerY = this.data.containerWidth / 2;

      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = 3 + Math.random() * 2;
        particles.push({
          id: i,
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          size: 4 + Math.random() * 4,
          opacity: 1
        });
      }

      this.setData({ particles });
      this.animateParticles();
    },

    animateParticles() {
      const particles = this.data.particles.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        opacity: p.opacity - 0.02
      })).filter(p => p.opacity > 0);

      this.setData({ particles });

      if (particles.length > 0) {
        this.particleTimer = setTimeout(() => {
          this.animateParticles();
        }, 16);
      }
    }
  }
});
