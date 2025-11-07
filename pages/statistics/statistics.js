// statistics.js
const wxCharts = require('../../lib/wxcharts.js');

Page({
  data: {
    // 3*3和4*4手势锁的使用率数据
    usageData: [
      {
        name: '3*3手势锁',
        value: 75
      },
      {
        name: '4*4手势锁',
        value: 25
      }
    ],
    // 3*3和4*4手势锁的通过率数据
    passRateData: [
      {
        name: '用户1',
        3x3: 80,
        4x4: 60
      },
      {
        name: '用户2',
        3x3: 90,
        4x4: 75
      },
      {
        name: '用户3',
        3x3: 85,
        4x4: 70
      },
      {
        name: '用户4',
        3x3: 95,
        4x4: 80
      },
      {
        name: '用户5',
        3x3: 75,
        4x4: 55
      },
      {
        name: '用户6',
        3x3: 88,
        4x4: 72
      },
      {
        name: '用户7',
        3x3: 92,
        4x4: 78
      },
      {
        name: '用户8',
        3x3: 84,
        4x4: 68
      },
      {
        name: '用户9',
        3x3: 89,
        4x4: 74
      },
      {
        name: '用户10',
        3x3: 91,
        4x4: 77
      }
    ]
  },
  onLoad: function () {
    // 在页面加载时初始化图表
    this.initCharts();
  },
  initCharts: function () {
    // 饼状图配置
    const pieChart = new wxCharts({
      canvasId: 'pieCanvas',
      type: 'pie',
      data: {
        legend: ['3*3手势锁', '4*4手势锁'],
        series: this.data.usageData
      },
      width: wx.getSystemInfoSync().windowWidth - 40,
      height: 300,
      extra: {
        pie: {
          offsetAngle: -45,
          label: {
            show: true
          }
        }
      }
    });

    // 柱状图配置
    const barChart = new wxCharts({
      canvasId: 'barCanvas',
      type: 'column',
      categories: this.data.passRateData.map(item => item.name),
      series: [
        {
          name: '3*3通过率',
          data: this.data.passRateData.map(item => item['3x3'])
        },
        {
          name: '4*4通过率',
          data: this.data.passRateData.map(item => item['4x4'])
        }
      ],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        title: '通过率 (%)',
        format: function (val) {
          return val + '%';
        }
      },
      width: wx.getSystemInfoSync().windowWidth - 40,
      height: 400,
      extra: {
        column: {
          width: 20
        }
      }
    });
  }
})