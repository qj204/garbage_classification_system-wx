// pages/tipsDetail/tipsDetail.js
const { BASE_URL } = require('../../api');

Page({
  data: {
    article: null,
    loading: false,
    error: '',
    contentHeight: 0
  },

  onLoad: function(options) {
    if (options && options.id) {
      this.fetchArticleDetail(options.id);
    } else {
      this.setData({
        error: '缺少文章ID参数'
      });
    }
    
    // 计算内容高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      contentHeight: systemInfo.windowHeight - 60
    });
  },

  fetchArticleDetail: function(id) {
    this.setData({ 
      loading: true, 
      error: '' 
    });
    
    wx.request({
      url: `${BASE_URL}/api/articles/get/${id}`,
      method: 'GET',
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          if (res.data.status === 1) {
            this.setData({ 
              error: '该文章不可见' 
            });
            return;
          }
          
          this.setData({ 
            article: {
              ...res.data,
              updated_time: this.formatTime(res.data.updated_time),
              content: this.formatContent(res.data.content)
            }
          });
          
          wx.setNavigationBarTitle({
            title: res.data.title || '文章详情'
          });
        } else {
          this.setData({ 
            error: res.data.message || '获取文章详情失败' 
          });
        }
      },
      fail: (err) => {
        this.setData({ 
          loading: false,
          error: '网络请求失败，请重试'
        });
      }
    });
  },

  formatTime: function(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr.replace(/-/g, '/'));
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  formatContent: function(content) {
    if (!content) return '';
    // 处理换行和段落
    return content.replace(/\n/g, '<br/>')
                  .replace(/<br\/>\s*<br\/>/g, '</p><p>')
                  .replace(/^/, '<p>')
                  .replace(/$/, '</p>');
  },

  onShareAppMessage: function() {
    return {
      title: this.data.article ? this.data.article.title : '环保贴士',
      path: `/pages/tipsDetail/tipsDetail?id=${this.data.article.id}`
    };
  }
});