'use strict';



const { fail, CODES, handler } = require('./response');
const { getOpenId } = require('./auth');
const { updateProfile } = require('./profile');

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
