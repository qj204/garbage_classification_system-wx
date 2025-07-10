const { BASE_URL } = require('../../api');

Page({
  data: {
    currentPoints: 0,
    rewards: [],
    history: [],
    activeTab: 'rewards',
    loading: false,
    errorMessage: '',
    userInfo: null,
    showRedeemDialog: false,
    currentReward: null,
    phoneNumber: '',
    address: '',
    // 新增：图片配置
    rewardImages: [
      `${BASE_URL}/api/recognize/uploads/dai.png?t=${Date.now()}`,
      `${BASE_URL}/api/recognize/uploads/xian.png?t=${Date.now()}`,
      `${BASE_URL}/api/recognize/uploads/zhi.png?t=${Date.now()}`
    ]
  },

  onLoad() {
    this.checkLogin();
    this.initData();
  },

  onShow() {
    this.fetchUserInfo();
  },

  initData() {
    this.fetchUserInfo();
    this.fetchRewards();
  },

  checkLogin() {
    if (!wx.getStorageSync('token')) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  // 修改方法：获取奖品图片
  getRewardImage(rewardId) {
    // 根据奖励ID返回不同的图片，使用模运算确保不超出数组范围
    const imageIndex = rewardId % this.data.rewardImages.length;
    return this.data.rewardImages[imageIndex];
  },

  fetchUserInfo() {
    this.setData({ loading: true, errorMessage: '' });
    wx.request({
      url: `${BASE_URL}/api/auth/get_info`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          this.setData({ 
            currentPoints: res.data.points || 0,
            userInfo: res.data,
            errorMessage: ''
          });
        } else {
          this.handleError(res.data.message || '获取用户信息失败');
        }
      },
      fail: (err) => {
        this.handleError('网络请求失败');
        console.error('获取用户信息失败:', err);
      }
    });
  },

  fetchRewards() {
    this.setData({ loading: true, errorMessage: '' });
    wx.request({
      url: `${BASE_URL}/api/points/rewards`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          // 为每个奖励添加图片路径
          const rewardsWithImages = res.data.map(reward => ({
            ...reward,
            imageUrl: this.getRewardImage(reward.id)
          }));
          this.setData({ 
            rewards: rewardsWithImages,
            errorMessage: ''
          });
        } else {
          this.handleError(res.data.message || '获取奖品列表失败');
        }
      },
      fail: (err) => {
        this.handleError('网络请求失败');
        console.error('获取奖品列表失败:', err);
      }
    });
  },

  fetchHistory() {
    this.setData({ loading: true, errorMessage: '' });
    wx.request({
      url: `${BASE_URL}/api/points/rewards/history`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          const formattedHistory = res.data.map(item => ({
            ...item,
            created_at: this.formatTime(item.created_at),
            status: item.status || '待发货',
            points_cost: item.points_cost || this.calculatePointsCost(item.reward_id),
            reward_name: item.reward_name || '未知奖品',
            // 为历史记录添加图片路径
            imageUrl: this.getRewardImage(item.reward_id)
          }));
          this.setData({ 
            history: formattedHistory,
            errorMessage: ''
          });
        } else {
          this.handleError(res.data.message || '获取兑换历史失败');
        }
      },
      fail: (err) => {
        this.handleError('网络请求失败');
        console.error('获取兑换历史失败:', err);
      }
    });
  },
  
  calculatePointsCost(rewardId) {
    const reward = this.data.rewards.find(r => r.id === rewardId);
    return reward ? reward.points_cost : 0;
  },

  getStatusClass(status) {
    if (!status) return 'pending';
    if (status.includes('发货')) return 'shipped';
    if (status.includes('完成')) return 'completed';
    if (status.includes('取消')) return 'canceled';
    return 'pending';
  },

  getStatusIcon(status) {
    if (!status) return 'waiting';
    if (status.includes('发货')) return 'deliver';
    if (status.includes('完成')) return 'success';
    if (status.includes('取消')) return 'cancel';
    return 'waiting';
  },

  formatTime(timeStr) {
    if (!timeStr) return '未知时间';
    const date = new Date(timeStr.replace(/-/g, '/'));
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (date.toDateString() === now.toDateString()) {
      if (diff < 60) return '刚刚';
      if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
      return `${Math.floor(diff / 3600)}小时前`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    if (tab === 'history') {
      this.fetchHistory();
    }
  },

  redeemReward(e) {
    const rewardId = e.currentTarget.dataset.id;
    const reward = this.data.rewards.find(r => r.id === rewardId);
    
    if (!reward) return;
    
    if (reward.stock <= 0) {
      wx.showToast({
        title: '奖品已售罄',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.currentPoints < reward.points_cost) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      currentReward: reward,
      showRedeemDialog: true,
      phoneNumber: this.data.userInfo?.phone || '',
      address: ''
    });
  },

  handlePhoneInput(e) {
    this.setData({ phoneNumber: e.detail.value });
  },

  handleAddressInput(e) {
    this.setData({ address: e.detail.value });
  },

  closeRedeemDialog() {
    this.setData({ showRedeemDialog: false });
  },

  confirmRedeem() {
    const { currentReward, phoneNumber, address } = this.data;
    
    if (!phoneNumber || !phoneNumber.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    
    if (!/^1\d{10}$/.test(phoneNumber)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    
    if (!address || !address.trim()) {
      wx.showToast({ title: '请输入收货地址', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '兑换中...', mask: true });
    
    wx.request({
      url: `${BASE_URL}/api/points/rewards/redeem`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      data: {
        reward_id: currentReward.id,
        phone_number: phoneNumber,
        address: address
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({
            title: '兑换成功',
            icon: 'success'
          });
          this.closeRedeemDialog();
          this.setData({
            currentPoints: res.data.remaining_points || 
              this.data.currentPoints - currentReward.points_cost
          });
          this.fetchRewards();
          this.fetchHistory();
        } else {
          wx.showToast({
            title: res.data.message || '兑换失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
        console.error('兑换失败:', err);
      }
    });
  },

  handleError(message) {
    this.setData({ 
      loading: false,
      errorMessage: message
    });
    wx.showToast({
      title: message,
      icon: 'none'
    });
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
    // 尝试刷新图片
    this.refreshRewardImages();
  },

  // 新增方法：刷新图片（带时间戳）
  refreshRewardImages() {
    this.setData({
      rewardImages: [
        `${BASE_URL}/api/recognize/uploads/dai.png?t=${Date.now()}`,
        `${BASE_URL}/api/recognize/uploads/xian.png?t=${Date.now()}`,
        `${BASE_URL}/api/recognize/uploads/zhi.png?t=${Date.now()}`
      ]
    });
  }
});