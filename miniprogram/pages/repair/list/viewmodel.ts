/**
 * 办事大厅页视图模型（v1.2.1 / CR-019）
 *
 * 背景：TabBar 第 2 项由「服务订单」改名「办事大厅」并升格为**聚合入口**——
 * 上方 = 搜索 + 四类服务入口（数据源 service:list，复用首页同一兜底常量）；
 * 下方 = 我的报修记录（数据源 workorder:list，行为零回归）。
 *
 * 分层原则（与 pages/index/viewmodel.ts 一致）：纯函数在此，页面只做 setData 与事件绑定。
 */
import { GRID_ICON_TEXT } from '../../../config/service-grid';

/** 页面名（TabBar / 导航栏 / 埋点统一口径） */
export const HALL_NAME = '办事大厅';

export interface HallCatVM {
  key: string;
  title: string;
  /** 分类副标题（原始「｜」串，展示端单行省略） */
  sub: string;
  iconText: string;
}

export interface HallRowVM {
  key: string;
  name: string;
  categoryKey: string;
  categoryTitle: string;
  iconText: string;
}

/** 带原始 ServiceItem 的检索行（item 不进 setData，仅模块内用于跳转分发） */
export interface HallRow extends HallRowVM {
  item: ServiceItem;
}

/** 搜索结果最多展示条数（8 个子项全命中也不至于刷满一屏） */
export const HALL_MATCH_LIMIT = 6;

/**
 * 口语 → 服务项 的同义词表（v1.2.1，纯前端、可单测）。
 * 说明：用户搜"药品""漏水"这类**场景词**，而服务项叫"挂号""水电燃气"，
 * 不做别名映射就会出现「搜什么都是没找到」。本表只解决高频口语，不做无限扩张。
 */
export const SEARCH_ALIASES: Record<string, string[]> = {
  /* 挂号 / 看病 */
  药: ['社区门诊挂号'],
  药品: ['社区门诊挂号'],
  看病: ['社区门诊挂号'],
  医院: ['社区门诊挂号'],
  发热: ['社区门诊挂号'],
  挂号: ['社区门诊挂号'],
  /* 缴费 */
  水费: ['水电燃气代缴'],
  电费: ['水电燃气代缴'],
  燃气费: ['水电燃气代缴'],
  交费: ['水电燃气代缴'],
  缴费: ['水电燃气代缴'],
  /* 维修类 */
  漏水: ['家电维修', '管道疏通'],
  维修: ['家电维修', '管道疏通'],
  报修: ['家电维修', '管道疏通'],
  修理: ['家电维修', '管道疏通'],
  疏通: ['管道疏通'],
  堵: ['管道疏通'],
  马桶: ['管道疏通'],
  下水: ['管道疏通'],
  地漏: ['管道疏通'],
  空调: ['家电维修', '空调清洗'],
  清洗: ['空调清洗'],
  开锁: ['开锁换锁'],
  钥匙: ['开锁换锁'],
  锁: ['开锁换锁'],
  /* 家政 */
  保洁: ['保洁'],
  打扫: ['保洁'],
  卫生: ['保洁'],
  保姆: ['保姆钟点工'],
  钟点工: ['保姆钟点工'],
  阿姨: ['保姆钟点工'],
  家政: ['保洁', '家电维修', '管道疏通', '保姆钟点工', '开锁换锁', '空调清洗'],
  /* 快递与政务 */
  快递: ['快递代取代寄'],
  取件: ['快递代取代寄'],
  驿站: ['快递代取代寄'],
  政务: ['办事指南'],
  证明: ['办事指南'],
  办事: ['办事指南'],
  证件: ['办事指南'],
  社保: ['办事指南'],
  居住证: ['办事指南'],
  指南: ['办事指南'],
  /* 生鲜 */
  菜: ['当日鲜菜'],
  蔬菜: ['当日鲜菜'],
  买菜: ['当日鲜菜'],
  生鲜: ['当日鲜菜', '临期特惠'],
  打折: ['临期特惠'],
  特价: ['临期特惠'],
  临期: ['临期特惠'],
  便宜: ['临期特惠'],
  拼单: ['邻里拼单'],
  团购: ['邻里拼单'],
  自提: ['次日自提'],
  订菜: ['当日鲜菜'],
  /* 健康 */
  疫苗: ['疫苗预约'],
  打针: ['疫苗预约'],
  流感: ['疫苗预约'],
  接种: ['疫苗预约'],
  血压: ['测血压血糖'],
  血糖: ['测血压血糖'],
  测量: ['测血压血糖'],
  体检: ['体检报告代取', '健康报告'],
  报告: ['体检报告代取', '健康报告'],
  慢病: ['慢性病咨询'],
  高血压: ['慢性病咨询'],
  糖尿病: ['慢性病咨询'],
  档案: ['健康档案'],
  配餐: ['智慧配餐'],
  营养: ['智慧配餐'],
  食谱: ['智慧配餐'],
  /* 养老 */
  吃饭: ['助餐'],
  午饭: ['助餐'],
  晚饭: ['助餐'],
  洗澡: ['助浴'],
  助浴: ['助浴'],
  陪护: ['上门陪护'],
  照顾: ['上门陪护'],
  看护: ['上门陪护'],
  改造: ['适老化改造'],
  无障碍: ['适老化改造'],
  扶手: ['适老化改造'],
  补贴: ['适老化改造'],
  医生: ['家庭医生签约'],
  家医: ['家庭医生签约'],
  签约: ['家庭医生签约'],
  养老: ['助餐', '助浴', '上门陪护', '适老化改造', '家庭医生签约'],
  /* 便民工具（CR-026：共享设备页） */
  雨伞: ['共享雨伞'],
  借伞: ['共享雨伞'],
  工具: ['维修工具'],
  电钻: ['维修工具'],
  梯子: ['维修工具'],
  充电宝: ['共享充电宝'],
  充电: ['共享充电宝'],
  借用: ['共享雨伞', '维修工具', '共享充电宝'],
  设备: ['共享雨伞', '维修工具', '共享充电宝'],
  外卖: ['外卖代收'],
  代收: ['外卖代收'],
  流浪: ['流浪动物'],
  猫: ['流浪动物'],
  狗: ['流浪动物'],
  宠物: ['流浪动物'],
  投喂: ['流浪动物'],
  租房: ['房屋租售'],
  买房: ['房屋租售'],
  房源: ['房屋租售'],
  出租: ['房屋租售'],
  二手房: ['房屋租售'],
  /* 文化 */
  义诊: ['义诊活动', '每周义诊'],
  活动: ['义诊活动', '每周义诊', '邻里活动'],
  图书: ['图书角借阅'],
  借书: ['图书角借阅'],
  看书: ['图书角借阅'],
  课堂: ['四点半课堂'],
  托管: ['四点半课堂'],
  放学: ['四点半课堂'],
  手机: ['长者手机课'],
};

/** ServiceCategory → 入口卡视图模型 */
export function toHallCatVM(category: ServiceCategory): HallCatVM {
  return {
    key: category.key,
    title: category.title,
    sub: category.subtitle ?? '',
    iconText: GRID_ICON_TEXT[category.key] ?? '🏠',
  };
}

/** 四类服务 → 可检索行（扁平化 8 个子项，保持分类归属） */
export function buildHallRows(categories: ServiceCategory[]): HallRow[] {
  const rows: HallRow[] = [];
  (categories ?? []).forEach((category) => {
    (category.items ?? []).forEach((item) => {
      rows.push({
        key: `${category.key}:${item.key}`,
        name: item.name,
        categoryKey: category.key,
        categoryTitle: category.title,
        iconText: GRID_ICON_TEXT[category.key] ?? '🏠',
        item,
      });
    });
  });
  return rows;
}

/** 命中的别名目标集合（子串双向匹配：搜「药品」命中键「药」，搜「药」命中键「药品」） */
function resolveAliasTargets(query: string): string[] {
  const targets: string[] = [];
  Object.keys(SEARCH_ALIASES).forEach((alias) => {
    if (query.indexOf(alias) >= 0 || alias.indexOf(query) >= 0) {
      targets.push(...SEARCH_ALIASES[alias]);
    }
  });
  return targets;
}

/**
 * 服务检索（纯函数）。
 * 打分：完全同名 10 / 名称互含 6 / 别名命中 5 / 分类名互含 3；同分保持原序（不抖动）。
 * 空关键词或全部未命中 → 返回空数组（调用方渲染"没找到 + 问 AI"）。
 */
export function searchHallRows(rows: HallRow[], keyword: string, limit = HALL_MATCH_LIMIT): HallRow[] {
  const query = String(keyword ?? '').trim();
  if (!query || (rows ?? []).length === 0) return [];

  const aliasTargets = resolveAliasTargets(query);
  const scored = rows
    .map((row) => {
      let score = 0;
      if (row.name === query) score += 10;
      else if (row.name.indexOf(query) >= 0 || query.indexOf(row.name) >= 0) score += 6;
      if (aliasTargets.indexOf(row.name) >= 0) score += 5;
      if (row.categoryTitle.indexOf(query) >= 0 || query.indexOf(row.categoryTitle) >= 0) score += 3;
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.row);
}
