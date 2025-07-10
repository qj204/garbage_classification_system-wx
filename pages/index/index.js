// pages/index/index.js
const { BASE_URL } = require('../../api');

Page({
  data: {
    // 用户数据
    username: wx.getStorageSync('username') || '舞舞舞',
    
    // 图片配置
    appImage: `${BASE_URL}/api/recognize/uploads/app.png?t=${Date.now()}`, // 带时间戳防缓存
    currentAdIndex: 0,
    adImages: [
      `${BASE_URL}/api/recognize/uploads/1.png`,
      `${BASE_URL}/api/recognize/uploads/2.png`,
      `${BASE_URL}/api/recognize/uploads/3.png`
    ],
    
    // 搜索相关
    searchValue: '',
    showSearchHistory: false,
    searchHistory: [],
    
    // 定时器
    adTimer: null,
    
    // 新增：点击计数器
    doroClickCount: 0
  },

  onLoad() {
    // 初始化广告轮播
    this.startAdRotation();
    
    // 加载搜索历史
    this.loadSearchHistory();
    
    // 调试图片路径
    console.log('当前APP图片路径:', this.data.appImage);
  },

  onShow() {
    // 更新用户名
    this.setData({
      username: wx.getStorageSync('username') || '舞舞舞'
    });
  },

  onUnload() {
    // 清除定时器
    if (this.data.adTimer) {
      clearInterval(this.data.adTimer);
    }
  },

  // 图片加载失败处理
  handleImageError(e) {
    console.error('图片加载失败:', {
      errMsg: e.detail.errMsg,
      path: e.currentTarget.dataset.src
    });
    wx.showToast({
      title: '图片加载失败',
      icon: 'none'
    });
  },

  // 广告轮播控制
  startAdRotation() {
    this.setData({
      adTimer: setInterval(() => {
        const nextIndex = (this.data.currentAdIndex + 1) % this.data.adImages.length;
        this.setData({ currentAdIndex: nextIndex });
      }, 5000)
    });
  },

  swiperChange(e) {
    this.setData({
      currentAdIndex: e.detail.current
    });
    clearInterval(this.data.adTimer);
    this.startAdRotation();
  },

  // 搜索历史管理
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ searchHistory: history });
  },

  saveSearchHistory(keyword) {
    let history = this.data.searchHistory.filter(item => item !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 5);
    wx.setStorageSync('searchHistory', history);
    this.setData({ searchHistory: history });
  },

  // 搜索功能
  handleSearchInput(e) {
    this.setData({
      searchValue: e.detail.value,
      showSearchHistory: e.detail.value === '' && this.data.searchHistory.length > 0
    });
  },

  doSearch() {
    const keyword = this.data.searchValue.trim();
    if (!keyword) return;
    
    this.saveSearchHistory(keyword);
    this.setData({ showSearchHistory: false });
    
    // 关键词路由跳转
    if (/垃圾|分类|回收|废品/.test(keyword)) {
      wx.switchTab({
        url: '/pages/garbageClassify/garbageClassify'
      });
    } else if (/积分|商城|兑换|奖励/.test(keyword)) {
      wx.switchTab({
        url: '/pages/rank/rank'
      });
    } else if (/贴士|环保|知识|文章/.test(keyword)) {
      wx.navigateTo({
        url: '/pages/tips/tips'
      });
    } else if (/个人|中心|我的|设置/.test(keyword)) {
      wx.switchTab({
        url: '/pages/personalCenter/personalCenter'
      });
    } else {
      wx.switchTab({
        url: '/pages/garbageClassify/garbageClassify'
      });
    }
  },

  searchFromHistory(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchValue: keyword,
      showSearchHistory: false
    });
    this.doSearch();
  },

  // 交互事件
  onTapDoro() {
    this.setData({
      doroClickCount: this.data.doroClickCount + 1
    });
    
    if (this.data.doroClickCount === 1) {
      wx.showToast({
        title: '你好，人，欢迎使用！(*´∀ ˋ*)',
        icon: 'none',
        duration: 1500
      });
    } else if (this.data.doroClickCount === 2) {
      wx.showToast({
        title: '怎么了？有什么疑惑吗？可以点击右上角的功能搜索哦(≧∀≦)ゞ',
        icon: 'none',
        duration: 1500
      });
    } else if (this.data.doroClickCount >= 3) {
      wx.showToast({
        title: '不要再点咯！(˘•ω•˘)◞⁽˙³˙⁾',
        icon: 'none',
        duration: 1500
      });
    }
  },

  goToClassify() {
    wx.switchTab({
      url: '/pages/garbageClassify/garbageClassify'
    });
  },

  // 图片刷新方法（调试用）
  refreshImage() {
    this.setData({
      appImage: `${BASE_URL}/api/recognize/uploads/app.png?t=${Date.now()}`
    });
  }
});