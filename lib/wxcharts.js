// wxcharts.js - Simple chart library for WeChat Mini Program
class wxCharts {
  constructor(options) {
    this.canvasId = options.canvasId;
    this.type = options.type;
    this.data = options.data;
    this.width = options.width;
    this.height = options.height;
    this.categories = options.categories;
    this.series = options.series;
    this.xAxis = options.xAxis || {};
    this.yAxis = options.yAxis || {};
    this.extra = options.extra || {};
    
    this.ctx = wx.createCanvasContext(this.canvasId);
    this.draw();
  }
  
  draw() {
    if (this.type === 'pie') {
      this.drawPie();
    } else if (this.type === 'column') {
      this.drawColumn();
    }
  }
  
  drawPie() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) - 30;
    
    let startAngle = -Math.PI / 2;
    const totalValue = this.data.series.reduce((sum, item) => sum + item.value, 0);
    
    this.data.series.forEach((item, index) => {
      const sliceAngle = (item.value / totalValue) * 2 * Math.PI;
      this.drawPieSlice(centerX, centerY, radius, startAngle, startAngle + sliceAngle, item.color || this.getColor(index));
      startAngle += sliceAngle;
    });
    
    // Draw legend
    const legendY = centerY + radius + 20;
    this.data.series.forEach((item, index) => {
      this.ctx.fillStyle = item.color || this.getColor(index);
      this.ctx.fillRect(50, legendY + index * 30, 20, 20);
      this.ctx.fillStyle = '#333';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(item.name + ' ' + item.value + '%', 80, legendY + index * 30 + 15);
    });
  }
  
  drawPieSlice(centerX, centerY, radius, startAngle, endAngle, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    this.ctx.closePath();
    this.ctx.fill();
  }
  
  drawColumn() {
    const padding = 50;
    const chartWidth = this.width - padding * 2;
    const chartHeight = this.height - padding * 2;
    
    const barWidth = chartWidth / this.categories.length / this.series.length * 0.8;
    const barGap = chartWidth / this.categories.length / this.series.length * 0.2;
    
    // Draw Y axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, this.height - padding);
    this.ctx.stroke();
    
    // Draw X axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding, this.height - padding);
    this.ctx.lineTo(this.width - padding, this.height - padding);
    this.ctx.stroke();
    
    // Draw bars
    this.series.forEach((seriesItem, seriesIndex) => {
      seriesItem.data.forEach((dataItem, dataIndex) => {
        const x = padding + dataIndex * (barWidth + barGap) * this.series.length + seriesIndex * (barWidth + barGap);
        const barHeight = (dataItem / 100) * chartHeight;
        const y = this.height - padding - barHeight;
        
        this.ctx.fillStyle = seriesItem.color || this.getColor(seriesIndex);
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(dataItem + '%', x + barWidth / 2 - 15, y - 5);
      });
    });
    
    // Draw categories
    this.categories.forEach((category, index) => {
      this.ctx.fillStyle = '#333';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(category, padding + index * (barWidth + barGap) * this.series.length + (barWidth + barGap) * this.series.length / 2 - 20, this.height - padding + 20);
    });
    
    // Draw Y axis title
    if (this.yAxis.title) {
      this.ctx.fillStyle = '#333';
      this.ctx.font = '14px Arial';
      this.ctx.fillText(this.yAxis.title, padding - 40, padding + 20);
    }
  }
  
  getColor(index) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    return colors[index % colors.length];
  }
}

module.exports = wxCharts;