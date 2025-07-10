const { BASE_URL } = require('../../api');

Page({
  data: {
    username: '未登录',
    avatarUrl: '../../images/man.png',
    historyList: [],
    showHistory: false,
    showFullHistory: false,
    neonColors: ['#ff00ff', '#00ffff', '#ff00aa', '#00ffaa'],
    activeNeon: 0
  },

  onShow() {
    this.setData({
      username: wx.getStorageSync('username') || '未登录',
      avatarUrl: wx.getStorageSync('avatarUrl') || '../../images/man.png'
    });
    this.checkLogin();
    this.startNeonEffect();
  },

  onHide() {
    clearInterval(this.neonInterval);
  },

  onUnload() {
    clearInterval(this.neonInterval);
  },

  startNeonEffect() {
    this.neonInterval = setInterval(() => {
      this.setData({
        activeNeon: (this.data.activeNeon + 1) % this.data.neonColors.length
      });
    }, 3000);
  },

  checkLogin() {
    if (wx.getStorageSync('token')) {
      this.loadHistory();
    }
  },

  loadHistory() {
    wx.showLoading({ title: '数据加载中...', mask: true });
    wx.request({
      url: `${BASE_URL}/api/history/my`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          this.setData({
            historyList: res.data.map(item => ({
              ...item,
              created_at: this.formatTime(item.created_at),
              isImage: item.query_type === 'image',
              query_content: item.query_type === 'image' ? '图片识别' : item.query_content,
              imageLoadFailed: false,
              image_url: item.query_type === 'image' 
                ? `${BASE_URL}/api/recognize/uploads/${item.query_content}?t=${Date.now()}`
                : null,
              result_category: item.result_category || '未分类',
              category_suggestion: this.getCategorySuggestion(item.result_category)
            })),
            showHistory: true
          });
        } else {
          wx.showToast({
            title: res.data.message || '加载历史记录失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      wx.previewImage({
        urls: [url],
        fail: (err) => {
          wx.showToast({
            title: '图片预览失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }
  },

  handleImageError(e) {
    const { id } = e.currentTarget.dataset;
    const { historyList } = this.data;
    const updatedList = historyList.map(item => {
      if (item.id === id) {
        return { ...item, imageLoadFailed: true };
      }
      return item;
    });
    this.setData({ historyList: updatedList });
  },

  retryLoadImage(e) {
    const { id } = e.currentTarget.dataset;
    const { historyList } = this.data;
    const updatedList = historyList.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          imageLoadFailed: false,
          image_url: `${item.image_url.split('?')[0]}?t=${Date.now()}`
        };
      }
      return item;
    });
    this.setData({ historyList: updatedList });
  },

  handleAvatarError() {
    this.setData({
      avatarUrl: '../../images/man.png'
    });
  },

  getCategorySuggestion(category) {
    const suggestions = {
      'clothes': '可回收物：请清洁后投放',
      'paper': '可回收物：请压平后投放',
      'plastic': '可回收物：请清空内容物',
      'metal': '可回收物：请单独投放',
      'glass': '可回收物：小心轻放',
      'food': '厨余垃圾：请沥干水分',
      'battery': '有害垃圾：请单独包装',
      'medicine': '有害垃圾：保持原包装',
      'trash': '其他垃圾：直接投放',
      '厨余垃圾': '请投放到绿色垃圾桶'
    };
    return suggestions[category] || '请按规定分类投放';
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr.replace(/-/g, '/'));
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  toggleHistory() {
    this.setData({
      showFullHistory: !this.data.showFullHistory
    });
  },

  deleteHistory(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: this.data.neonColors[this.data.activeNeon],
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete(id);
        }
      }
    });
  },

  confirmDelete(id) {
    wx.showLoading({ title: '删除中...', mask: true });
    wx.request({
      url: `${BASE_URL}/api/history/delete/${id}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
          this.loadHistory();
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  goToChangePassword() {
    wx.navigateTo({
      url: '/pages/changePassword/changePassword'
    });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      cancelText: '取消',
      confirmColor: '#ff0000',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage();
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});