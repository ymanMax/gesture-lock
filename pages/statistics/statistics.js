// statistics.js
const wxCharts = require('../../lib/wxcharts.js');

Page({
  data: {
    // 手势热力图数据 - 3x3网格，每个点的热度值(0-100)
    heatmapData: [
      [65, 82, 45],
      [78, 95, 60],
      [50, 70, 40]
    ],
    // 解锁时间分布数据
    unlockTimeData: [
      { time: '0-500ms', count: 356 },
      { time: '500-1000ms', count: 523 },
      { time: '1000-1500ms', count: 289 },
      { time: '1500-2000ms', count: 145 },
      { time: '2000ms+', count: 87 }
    ],
    // 错误模式分析数据
    errorPatternData: [
      { pattern: '相邻点错误', count: 128 },
      { pattern: '跳过点错误', count: 95 },
      { pattern: '顺序错误', count: 156 },
      { pattern: '多点重复', count: 72 },
      { pattern: '其他错误', count: 49 }
    ]
  },

  onLoad: function () {
    this.initCharts();
  },

  // 初始化图表
  initCharts: function () {
    this.initUnlockTimeChart();
    this.initErrorPatternChart();
  },

  // 初始化解锁时间分布图表
  initUnlockTimeChart: function () {
    const windowWidth = wx.getSystemInfoSync().windowWidth;
    const chartWidth = windowWidth - 40;

    new wxCharts({
      canvasId: 'unlockTimeCanvas',
      type: 'column',
      categories: this.data.unlockTimeData.map(item => item.time),
      series: [{
        name: '解锁次数',
        data: this.data.unlockTimeData.map(item => item.count),
        color: '#45B7D1'
      }],
      xAxis: {
        disableGrid: true,
        axisLabel: {
          fontSize: 10
        }
      },
      yAxis: {
        title: '次数',
        format: function (val) {
          return val.toFixed(0);
        }
      },
      width: chartWidth,
      height: 280,
      extra: {
        column: {
          width: 25
        }
      }
    });
  },

  // 初始化错误模式分析图表
  initErrorPatternChart: function () {
    const windowWidth = wx.getSystemInfoSync().windowWidth;
    const chartWidth = windowWidth - 40;

    new wxCharts({
      canvasId: 'errorPatternCanvas',
      type: 'pie',
      data: {
        legend: this.data.errorPatternData.map(item => item.pattern),
        series: this.data.errorPatternData.map(item => ({
          name: item.pattern,
          value: item.count
        }))
      },
      width: chartWidth,
      height: 300,
      extra: {
        pie: {
          offsetAngle: -90,
          label: {
            show: true,
            fontSize: 10,
            format: function (name, ratio) {
              return name + ' ' + (ratio * 100).toFixed(0) + '%';
            }
          }
        }
      }
    });
  },

  // 刷新数据
  refreshData: function () {
    // 模拟数据更新
    this.setData({
      heatmapData: [
        [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)],
        [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)],
        [Math.floor(Math.random() * 100), Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)]
      ]
    });
    this.initCharts();
    wx.showToast({
      title: '数据已刷新',
      icon: 'success'
    });
  }
})
