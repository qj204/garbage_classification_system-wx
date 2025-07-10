const { BASE_URL } = require('../../api');

Page({
  data: {
    darkMode: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    username: wx.getStorageSync('username')
  },

  handleCurrentPassword(e) {
    this.setData({ currentPassword: e.detail.value });
  },
  handleNewPassword(e) {
    this.setData({ newPassword: e.detail.value });
  },
  handleConfirmPassword(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  submit() {
    const { currentPassword, newPassword, confirmPassword } = this.data;
    const token = wx.getStorageSync('token');

    if (!currentPassword || !newPassword || !confirmPassword) {
      wx.showToast({ title: '请填写所有字段', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (!/^[a-zA-Z0-9]{6}[a-zA-Z]{2}$/.test(newPassword)) {
      wx.showToast({ title: '密码需6位数字字母+2位字母', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交中...', mask: true });
    wx.request({
      url: `${BASE_URL}/api/auth/change_password`,
      method: 'PUT',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        current_password: currentPassword,
        new_password: newPassword
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          this.handleSuccess();
        } else {
          this.handleError(res.data.message);
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.handleError('网络请求失败');
      }
    });
  },

  handleSuccess() {
    wx.showModal({
      title: '成功',
      content: '密码修改成功，请重新登录',
      showCancel: false,
      success: () => {
        wx.clearStorage();
        wx.reLaunch({ url: '/pages/login/login' });
      }
    });
  },

  handleError(msg) {
    wx.showToast({
      title: msg || '操作失败',
      icon: 'none',
      duration: 2000
    });
  }
});