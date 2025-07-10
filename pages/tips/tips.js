// pages/tips/tips.js
const { BASE_URL } = require('../../api');

Page({
  data: {
    articles: [],
    loading: false,
    error: '',
    searchValue: '',
    isSearching: false
  },

  onLoad: function() {
    this.fetchArticles();
  },

  onPullDownRefresh: function() {
    if (this.data.isSearching) {
      this.handleSearch();
    } else {
      this.fetchArticles();
    }
    wx.stopPullDownRefresh();
  },

  fetchArticles: function() {
    this.setData({ 
      loading: true, 
      error: '', 
      isSearching: false 
    });
    
    wx.request({
      url: `${BASE_URL}/api/articles/get`,
      method: 'GET',
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          const filteredArticles = res.data.filter(article => article.status === 0)
            .map(article => ({
              ...article,
              updated_time: this.formatTime(article.updated_time)
            }));
          
          this.setData({ articles: filteredArticles });
        } else {
          this.setData({ 
            error: res.data.message || '获取文章失败' 
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

  handleSearch: function() {
    const keyword = this.data.searchValue.trim();
    if (!keyword) {
      this.fetchArticles();
      return;
    }
    
    this.setData({ 
      loading: true, 
      error: '', 
      isSearching: true 
    });
    
    wx.request({
      url: `${BASE_URL}/api/articles/search?title=${encodeURIComponent(keyword)}`,
      method: 'GET',
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          const filteredArticles = res.data.filter(article => article.status === 0)
            .map(article => ({
              ...article,
              updated_time: this.formatTime(article.updated_time)
            }));
          
          this.setData({ articles: filteredArticles });
        } else {
          this.setData({ 
            error: res.data.message || '搜索文章失败' 
          });
        }
      },
      fail: (err) => {
        this.setData({ 
          loading: false,
          error: '搜索请求失败，请重试'
        });
      }
    });
  },

  handleInputChange: function(e) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  handleClearSearch: function() {
    this.setData({
      searchValue: '',
      isSearching: false
    });
    this.fetchArticles();
  },

  formatTime: function(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr.replace(/-/g, '/'));
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  goToDetail: function(e) {
    if (!e.currentTarget.dataset.id) return;
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tipsDetail/tipsDetail?id=${id}`
    });
  }
});