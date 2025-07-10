Component({
  properties: {
    text: String,            // 按钮文字
    color: {                 // 霓虹颜色
      type: String,
      value: '#00ffff'       // 默认青色
    },
    textColor: String,       // 文字颜色(默认与霓虹色相同)
    type: String,            // 按钮类型(如danger)
    disabled: Boolean        // 是否禁用
  },
  methods: {
    onTap() {
      if (!this.data.disabled) {
        this.triggerEvent('tap') // 触发点击事件
      }
    }
  },
  externalClasses: ['custom-class'] // 允许外部传入自定义类名
})