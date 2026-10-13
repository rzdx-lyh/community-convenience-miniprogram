'use strict';

/**
 * 订阅消息：无模板 ID / 无云环境 / 发送失败 → 一律降级为日志，绝不阻断主流程。
 * 模板 ID 走环境变量 SUBSCRIBE_TEMPLATE_WORKORDER_DONE（非密钥，但与密钥同渠道管理）。
 */
const { cloud } = require('./cloud');

const STATUS_TEXT = {
  pending: '待受理', assigned: '已派单', processing: '处理中',
  done: '已完成', closed: '已关闭', canceled: '已取消',
};

async function notifyWorkOrderDone(toOpenid, { title, status, id } = {}) {
  const templateId = process.env.SUBSCRIBE_TEMPLATE_WORKORDER_DONE;
  const statusText = STATUS_TEXT[status] || status || '';
  if (!cloud || !templateId) {
    console.log(`[subscribe][degraded] 无模板 ID/云环境，仅记日志：to=${toOpenid} wo=${id} status=${statusText}`);
    return { sent: false, reason: 'no-template-id' };
  }
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId,
      page: `pages/repair/detail/index?id=${id}`,
      miniprogramState: 'formal',
      data: {
        thing1: { value: String(title || '报修工单').slice(0, 20) },
        phrase2: { value: statusText },
        time3: { value: new Date().toISOString() },
      },
    });
    return { sent: true };
  } catch (e) {
    console.error('[subscribe] 发送失败，降级日志：', e && e.message);
    return { sent: false, reason: 'send-failed' };
  }
}

module.exports = { notifyWorkOrderDone, STATUS_TEXT };
