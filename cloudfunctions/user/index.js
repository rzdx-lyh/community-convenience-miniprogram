'use strict';



const { fail, CODES, handler } = require('./lib/response');
const { getOpenId } = require('./lib/auth');
const { updateProfile } = require('./lib/profile');

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
