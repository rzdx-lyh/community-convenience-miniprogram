/**
 * 演示模式标识（CR-017-c）
 *
 * 用途：数据来自本地 mock、且当前不是正式演示时，在界面右下角常驻一枚小胶囊，
 * 把「忘了关 USE_MOCK」从**静默失败**变成**可见错误**。
 * 演示当天把 `ENV.DEMO_MODE` 置 true 即隐藏（避免主动自曝"这是演示数据"）。
 *
 * 设计约束（CR-018-b + lead 四条硬约束）：
 * 1. 显隐**只读本地 `ENV` 常量**，不调接口、不等后端字段、零新增出参字段——
 *    「我在降级」的提示绝不能依赖它正在降级的那个通道传递（故障时会一起失效）；
 * 2. `position: fixed` 浮层，**不占文档流高度**——首页负边距叠压版式
 *    （白色通知卡压在彩色头部下缘）经不起插入任何常规 view；
 * 3. 用中性警示黄，**禁用品牌绿 `#1E8252` 与主渐变**，避免被误认为产品视觉元素；
 * 4. 不显示时组件根节点走 `wx:if`，**不出现在渲染树里**（不是 hidden / opacity:0）。
 */
import { ENV, shouldShowMockBanner } from '../../config/env';

Component({
  data: {
    /** 是否渲染；false 时根节点 wx:if 为假，完全不进渲染树 */
    visible: false,
    text: '演示数据模式 · 未连接云端',
  },

  lifetimes: {
    attached() {
      this.setData({ visible: shouldShowMockBanner(ENV.USE_MOCK, ENV.DEMO_MODE) });
    },
  },
});
