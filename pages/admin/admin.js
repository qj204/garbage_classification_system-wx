const { BASE_URL } = require('../../api');

Page({
  data: {
    darkMode: true,
    token: wx.getStorageSync('token'),
    userList: [],
    selectedUser: null,
    newPassword: '',
    showUserList: false,
    isAdmin: wx.getStorageSync('role') === 1
  },

  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#121212'
    });
    if (!this.data.token || !this.data.isAdmin) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
      
    }
    this.fetchUserList();
  },

  fetchUserList() {
    wx.showLoading({ title: '加载中' });
    wx.request({
      url: `${BASE_URL}/api/admin/users`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${this.data.token}`
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          this.setData({ userList: res.data });
        } else {
          wx.showToast({
            title: res.data.message || '获取用户列表失败',
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
      }
    });
  },

  selectUser(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({ 
      selectedUser: user,
      showUserList: false,
      newPassword: ''
    });
  },

  toggleUserList() {
    this.setData({ showUserList: !this.data.showUserList });
  },

  banUser() {
    if (!this.data.selectedUser) return;
    
    wx.showLoading({ title: '处理中' });
    wx.request({
      url: `${BASE_URL}/api/admin/users/${this.data.selectedUser.id}/status`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${this.data.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        status: this.data.selectedUser.status === 0 ? 1 : 0
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({
            title: `用户已${this.data.selectedUser.status === 0 ? '封禁' : '解封'}`,
            icon: 'success'
          });
          this.fetchUserList();
        } else {
          wx.showToast({
            title: res.data.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  },

  handleNewPassword(e) {
    this.setData({ newPassword: e.detail.value });
  },

  changePassword() {
    if (!this.data.selectedUser || !this.data.newPassword) {
      wx.showToast({
        title: '请选择用户并输入新密码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '处理中' });
    wx.request({
      url: `${BASE_URL}/api/admin/users/${this.data.selectedUser.id}/set_password`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${this.data.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        new_password: this.data.newPassword
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.showToast({
            title: '密码修改成功',
            icon: 'success'
          });
          this.setData({ newPassword: '' });
        } else {
          wx.showToast({
            title: res.data.message || '密码修改失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      }
    });
  }
});