const { BASE_URL } = require('../../api');

Page({
  data: {
    method: null,
    result: null,
    inputValue: '',
    loading: false,
    errorMessage: '',
    searchHistory: [],
    showHistory: false,
    textSearchImage: `${BASE_URL}/api/recognize/uploads/8.png?t=${Date.now()}`,
    imageSearchImage: `${BASE_URL}/api/recognize/uploads/9.png?t=${Date.now()}`
  },

  getSuggestion(type) {
    const suggestions = {
      '有害垃圾': '请投放到红色有害垃圾箱，避免破损泄漏（如电池、灯管需单独包装）',
      '厨余垃圾': '沥干水分后投放到绿色厨余垃圾箱，塑料袋请单独丢弃',
      '可回收物': '清洁干燥后投放到蓝色可回收物箱，纸类应压平存放',
      '其他垃圾': '投放到灰色其他垃圾箱，尽量保持干燥（如污染纸巾、一次性餐具）'
    };
    return suggestions[type] || '请按规定投放';
  },

  chooseMethod(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({ 
      method, 
      result: null, 
      errorMessage: '',
      showHistory: method === 'text' && this.data.searchHistory.length > 0
    });
    if (method === 'image') this.uploadImage();
  },

  handleInput(e) {
    this.setData({ 
      inputValue: e.detail.value,
      showHistory: e.detail.value === '' && this.data.searchHistory.length > 0
    });
  },

  searchByText() {
    const name = this.data.inputValue.trim();
    if (!name) {
      this.setData({ errorMessage: '请输入查询内容' });
      return;
    }

    this.setData({ 
      loading: true, 
      errorMessage: '',
      showHistory: false
    });

    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        loading: false,
        errorMessage: '请先登录'
      });
      return;
    }

    wx.request({
      url: `${BASE_URL}/api/recognize/text?q=${encodeURIComponent(name)}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      success: (res) => {
        this.setData({ loading: false });
        if (res.statusCode === 200) {
          const newHistory = [name, ...this.data.searchHistory.filter(item => item !== name)].slice(0, 5);
          this.setData({ searchHistory: newHistory });
          
          if (res.data.message === "未找到匹配的垃圾信息") {
            this.setData({
              result: {
                name: name,
                type: "其他垃圾",
                suggestion: "未找到匹配的垃圾信息，请尝试其他名称"
              }
            });
          } else {
            const garbageType = res.data.category || "其他垃圾";
            this.setData({
              result: {
                name: res.data.name || name,
                type: garbageType,
                suggestion: this.getSuggestion(garbageType)
              }
            });
          }
        } else {
          this.setData({
            errorMessage: res.data.message || '查询失败'
          });
        }
      },
      fail: (err) => {
        this.setData({ 
          loading: false,
          errorMessage: '网络请求失败，请重试'
        });
      }
    });
  },

  searchFromHistory(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      inputValue: keyword,
      showHistory: false
    });
    this.searchByText();
  },

  uploadImage() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ errorMessage: '请先登录' });
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        this.setData({ loading: true, errorMessage: '' });
        
        wx.uploadFile({
          url: `${BASE_URL}/api/recognize/image`,
          filePath: tempFilePaths[0],
          name: 'file',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (uploadRes) => {
            this.setData({ loading: false });
            const resData = JSON.parse(uploadRes.data);
            
            if (uploadRes.statusCode === 200) {
              const garbageType = this.mapCategoryToType(resData.category);
              this.setData({
                result: {
                  name: resData.category || '未知物品',
                  type: garbageType,
                  suggestion: this.getSuggestion(garbageType),
                  probability: resData.probability ? (resData.probability * 100).toFixed(2) + '%' : ''
                }
              });
              
              const newHistory = [resData.category, ...this.data.searchHistory.filter(item => item !== resData.category)].slice(0, 5);
              this.setData({ searchHistory: newHistory });
            } else {
              this.setData({
                errorMessage: resData.message || '图片识别失败'
              });
            }
          },
          fail: (err) => {
            this.setData({ 
              loading: false,
              errorMessage: '上传图片失败，请重试'
            });
          }
        });
      },
      fail: () => {
        this.setData({ errorMessage: '图片选择失败' });
      }
    });
  },

  mapCategoryToType(category) {
    const categoryMap = {
      'clothes': '可回收物',
      'paper': '可回收物',
      'plastic': '可回收物',
      'metal': '可回收物',
      'glass': '可回收物',
      'food': '厨余垃圾',
      'battery': '有害垃圾',
      'medicine': '有害垃圾',
      'trash': '其他垃圾'
    };
    return categoryMap[category] || '其他垃圾';
  },

  handleImageError(e) {
    console.error('图片加载失败:', {
      errMsg: e.detail.errMsg,
      path: e.currentTarget.dataset.src
    });
    wx.showToast({
      title: '图片加载失败',
      icon: 'none'
    });
  }
});