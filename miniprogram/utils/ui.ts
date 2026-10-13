/**
 * 轻交互封装（FE-0 · D8）
 * 确认用 wx.showModal、轻提示 wx.showToast(icon:'none')；
 * showLoading 与 showToast 互斥，请求结束务必 hideLoading。
 */
export function toast(title: string): void {
  wx.showToast({ title, icon: 'none', duration: 2000 });
}

export function showLoading(title = '加载中'): void {
  wx.showLoading({ title, mask: true });
}

export function hideLoading(): void {
  wx.hideLoading();
}

/** 确认弹窗：用户点「确定」resolve(true) */
export function confirm(title: string, content: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(Boolean(res.confirm)),
      fail: () => resolve(false),
    });
  });
}

/** 一键拨号（合规：不做自动拨号，必须由用户点击触发） */
export function makePhoneCall(phone: string): void {
  const number = (phone ?? '').trim();
  if (!number) {
    toast('号码缺失，请稍后再试');
    return;
  }
  wx.makePhoneCall({
    phoneNumber: number,
    fail: () => toast('拨号已取消'),
  });
}
