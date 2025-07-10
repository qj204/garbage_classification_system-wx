const { BASE_URL } = require('../../api');

Page({
  data: {
    username: '',
    password: '',
    isRegister: false,
    loading: false,
    statusMessage: ''
  },

  // 监听账号输入（允许字母数字，10位以内）
  bindUsernameInput: function(e) {
    const value = e.detail.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    this.setData({ username: value });
  },

  // 监听密码输入（允许字母数字，10位以内）
  bindPasswordInput: function(e) {
    const value = e.detail.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    this.setData({ password: value });
  },

  // 切换登录/注册模式
  toggleMode: function() {
    this.setData({
      isRegister: !this.data.isRegister,
      username: '',
      password: '',
      statusMessage: ''
    });
  },

  // 提交表单
  submit: function() {
    const { username, password, isRegister } = this.data;

    // 非空校验
    if (!username || !password) {
      this.showStatus('账号和密码不能为空', 'error');
      return;
    }

    this.setData({ loading: true, statusMessage: '处理中...' });

    const apiUrl = isRegister 
      ? `${BASE_URL}/api/auth/register` 
      : `${BASE_URL}/api/auth/login`;

    wx.request({
      url: apiUrl,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ username, password }),
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200 && res.data.token) {
          this.showStatus(isRegister ? '注册成功！' : '登录成功！', 'success');
          wx.setStorageSync('username', username);
          wx.setStorageSync('token', res.data.token);
          wx.setStorageSync('role', res.data.role || 0);
          
          // 登录成功后跳转
          setTimeout(() => {
            wx.switchTab({
              url:  '/pages/index/index'
            });
          }, 1500);
        } else {
          this.showStatus(res.data.message || '操作失败', 'error');
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        this.showStatus(
          err.errMsg.includes('timeout') ? '请求超时' : '网络错误',
          'error'
        );
      }
    });
  },

  // 显示状态提示
  showStatus: function(message, type = 'info') {
    this.setData({ statusMessage: message });
    wx.showToast({
      title: message,
      icon: type === 'error' ? 'none' : 'success',
      duration: 2000
    });
  }
});