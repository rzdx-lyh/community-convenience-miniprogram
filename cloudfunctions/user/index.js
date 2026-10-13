'use strict';

/**
 * 资源 user：action = updateProfile
 * 契约：contracts/api-contract.md §user:updateProfile
 * v1.2（CR-009 / BE-12）：新增可选入参 accountId，格式 + 唯一性强校验，懒迁移补值
 */
const { fail, CODES, handler } = require('../shared/response');
const { getOpenId } = require('../shared/auth');
const { updateProfile } = require('../shared/profile');

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
