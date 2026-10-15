/** empty-state 空状态组件（FE-9）：统一空态文案 + 行动按钮，禁止各页自绘 */
Component({
  properties: {
    /** default / order / notice / circle / search → 不同图标字形 */
    type: { type: String, value: 'default' },
    text: { type: String, value: '暂无内容' },
    subText: { type: String, value: '' },
    buttonText: { type: String, value: '' },
  },
  methods: {
    onAction(): void {
      this.triggerEvent('action');
    },
  },
});
