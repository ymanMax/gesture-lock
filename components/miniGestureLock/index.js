import GestureLock from '../../lib/gestureLock.js';

Component({
  properties: {
    containerWidth: {
      type: Number
    },
    cycleRadius: {
      type: Number
    },
    password: {
      type: Array
    },
    rows: {
      type: Number,
      value: 3
    },
    // Security features
    peepProof: {
      type: Boolean,
      value: false
    },
    maxAttempts: {
      type: Number,
      value: 5
    },
    lockoutDuration: {
      type: Number,
      value: 60000 // 1 minute in milliseconds
    }
  },
  data: {
    gestureLock: {}, // 锁对象
    circleArray: [], // 圆对象数组
    lineArray: [], // 已激活锁之间的线段
    activeLine: {}, // 最后一个激活的锁与当前位置之间的线段
    error: false,
    // Security state
    isLocked: false,
    remainingLockTime: 0,
    failedAttempts: 0,
    isInputting: false,
    // Trajectory recording
    trajectory: [],
    // Complexity evaluation
    complexity: 0,
    complexityLevel: 'low' // 'low', 'medium', 'high'
  },
  methods: {
    onTouchStart(e) {
      if (this.data.isLocked) {
        return;
      }
      this.data.gestureLock.onTouchStart(e);
      this.setData({
        isInputting: true,
        trajectory: [{
          x: e.touches[0].pageX,
          y: e.touches[0].pageY,
          timestamp: Date.now(),
          type: 'start'
        }]
      });
      this.refesh();
    },

    onTouchMove(e) {
      if (this.data.isLocked) {
        return;
      }
      this.data.gestureLock.onTouchMove(e);
      // Record trajectory point
      const trajectory = this.data.trajectory;
      trajectory.push({
        x: e.touches[0].pageX,
        y: e.touches[0].pageY,
        timestamp: Date.now(),
        type: 'move'
      });
      // Limit trajectory length to prevent memory issues
      if (trajectory.length > 100) {
        trajectory.shift();
      }
      this.setData({ trajectory });
      this.refesh();
    },
    onTouchEnd(e) {
      if (this.data.isLocked) {
        return;
      }
      const checkPoints = this.data.gestureLock.onTouchEnd(e);

      // Complete trajectory recording
      const trajectory = this.data.trajectory;
      trajectory.push({
        x: e.changedTouches[0].pageX,
        y: e.changedTouches[0].pageY,
        timestamp: Date.now(),
        type: 'end',
        password: checkPoints
      });
      this.setData({ trajectory });

      // Evaluate gesture complexity
      const complexityResult = this.evaluateComplexity(checkPoints);

      if (checkPoints.join("") == this.data.password.join("")) {
        console.log("密码正确");
        this.setData({
          failedAttempts: 0,
          isInputting: false
        });
        this.refesh();
        this.triggerEvent('end', {
          password: checkPoints,
          success: true,
          trajectory: this.data.trajectory,
          complexity: complexityResult
        });
      } else {
        console.log("密码错误");
        const failedAttempts = this.data.failedAttempts + 1;
        this.setData({
          error: true,
          failedAttempts: failedAttempts
        });

        // Check if max attempts reached
        if (failedAttempts >= this.data.maxAttempts) {
          this.lock();
        }

        setTimeout(() => {
          this.setData({
            isInputting: false
          });
          this.refesh();
          this.triggerEvent('end', {
            password: checkPoints,
            success: false,
            failedAttempts: failedAttempts,
            trajectory: this.data.trajectory,
            complexity: complexityResult
          });
        }, 800);
      }
    },
    refesh() {
      this.setData({
        error: false,
        circleArray: this.data.gestureLock.getCycleArray(),
        lineArray: this.data.gestureLock.getLineArray(),
        activeLine: this.data.gestureLock.getActiveLine()
      });
    },

    // Lock the gesture lock after too many failed attempts
    lock() {
      const lockoutEndTime = Date.now() + this.data.lockoutDuration;
      this.setData({
        isLocked: true,
        remainingLockTime: this.data.lockoutDuration
      });

      // Trigger lock event
      this.triggerEvent('lock', {
        lockoutDuration: this.data.lockoutDuration,
        lockoutEndTime: lockoutEndTime
      });

      // Update remaining time countdown
      this.lockTimer = setInterval(() => {
        const remaining = Math.max(0, lockoutEndTime - Date.now());
        this.setData({
          remainingLockTime: remaining
        });

        if (remaining <= 0) {
          this.unlock();
        }
      }, 1000);
    },

    // Unlock the gesture lock
    unlock() {
      if (this.lockTimer) {
        clearInterval(this.lockTimer);
        this.lockTimer = null;
      }
      this.setData({
        isLocked: false,
        remainingLockTime: 0,
        failedAttempts: 0
      });

      this.triggerEvent('unlock');
    },

    // Evaluate gesture complexity
    evaluateComplexity(password) {
      if (!password || password.length === 0) {
        return {
          score: 0,
          level: 'low',
          feedback: '手势太短，安全性较低'
        };
      }

      let score = 0;
      const length = password.length;

      // Length scoring (30% of total)
      if (length >= 8) score += 30;
      else if (length >= 6) score += 20;
      else if (length >= 4) score += 10;

      // Uniqueness scoring (30% of total)
      const uniquePoints = new Set(password);
      const uniqueness = uniquePoints.size / length;
      score += uniqueness * 30;

      // Pattern complexity scoring (40% of total)
      let patternScore = 0;
      if (length >= 2) {
        const rows = this.data.rows;
        for (let i = 1; i < length; i++) {
          const prev = password[i - 1] - 1;
          const curr = password[i] - 1;

          const prevRow = Math.floor(prev / rows);
          const prevCol = prev % rows;
          const currRow = Math.floor(curr / rows);
          const currCol = curr % rows;

          const rowDiff = Math.abs(currRow - prevRow);
          const colDiff = Math.abs(currCol - prevCol);

          // Diagonal moves are more complex
          if (rowDiff > 0 && colDiff > 0) {
            patternScore += 10;
          }
          // Longer distance moves are more complex
          else if (rowDiff >= 2 || colDiff >= 2) {
            patternScore += 8;
          }
          // Adjacent moves are basic
          else {
            patternScore += 5;
          }
        }
        // Normalize pattern score to 40 points
        patternScore = Math.min(40, (patternScore / (length * 10)) * 40);
      }
      score += patternScore;

      // Determine complexity level
      let level = 'low';
      let feedback = '';
      if (score >= 80) {
        level = 'high';
        feedback = '手势复杂度高，安全性好';
      } else if (score >= 50) {
        level = 'medium';
        feedback = '手势复杂度中等，建议增加长度或使用更复杂的图案';
      } else {
        level = 'low';
        feedback = '手势复杂度低，容易被破解，建议至少使用6个点且包含对角线';
      }

      const result = {
        score: Math.round(score),
        level: level,
        feedback: feedback,
        details: {
          length: length,
          uniquePoints: uniquePoints.size,
          patternScore: Math.round(patternScore)
        }
      };

      this.setData({
        complexity: result.score,
        complexityLevel: result.level
      });

      return result;
    },

    // Get recorded trajectory
    getTrajectory() {
      return this.data.trajectory;
    },

    // Clear recorded trajectory
    clearTrajectory() {
      this.setData({
        trajectory: []
      });
    },

    // Playback trajectory (for security audit)
    playbackTrajectory(trajectory, speed = 1) {
      if (!trajectory || trajectory.length === 0) {
        return;
      }

      // Lock input during playback
      this.setData({
        isLocked: true
      });

      const startIndex = trajectory.findIndex(point => point.type === 'start');
      const endIndex = trajectory.findIndex(point => point.type === 'end');

      if (startIndex === -1) {
        this.setData({
          isLocked: false
        });
        return;
      }

      const playbackPoints = trajectory.slice(startIndex, endIndex + 1);
      if (playbackPoints.length < 2) {
        this.setData({
          isLocked: false
        });
        return;
      }

      const totalDuration = playbackPoints[playbackPoints.length - 1].timestamp - playbackPoints[0].timestamp;
      const playbackDuration = totalDuration / speed;
      const interval = playbackDuration / playbackPoints.length;

      let pointIndex = 0;

      const playbackInterval = setInterval(() => {
        if (pointIndex >= playbackPoints.length) {
          clearInterval(playbackInterval);
          // Reset and unlock
          this.data.gestureLock.reset();
          this.refesh();
          this.setData({
            isLocked: false
          });
          return;
        }

        const point = playbackPoints[pointIndex];
        if (point.type === 'start') {
          // Simulate touch start
          this.data.gestureLock.onTouchStart({
            touches: [{ pageX: point.x, pageY: point.y }],
            currentTarget: { offsetLeft: 0, offsetTop: 0 }
          });
        } else if (point.type === 'move') {
          // Simulate touch move
          this.data.gestureLock.onTouchMove({
            touches: [{ pageX: point.x, pageY: point.y }]
          });
        } else if (point.type === 'end') {
          // Simulate touch end
          this.data.gestureLock.onTouchEnd({
            changedTouches: [{ pageX: point.x, pageY: point.y }]
          });
        }

        this.refesh();
        pointIndex++;
      }, interval);
    }
  },
  ready() {
    // 如果containerWidth为0，则使用默认值600
    const containerWidth = this.data.containerWidth || 600;
    this.setData({
      gestureLock: new GestureLock(containerWidth, this.data.cycleRadius, this.data.rows)
    });
    this.refesh();
  }
})