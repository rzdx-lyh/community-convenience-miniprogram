'use strict';



const { fail, CODES, handler } = require('./shared/response');
const { getOpenId } = require('./shared/auth');
const { updateProfile } = require('./shared/profile');

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
