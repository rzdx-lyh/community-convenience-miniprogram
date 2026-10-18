# -*- coding: utf-8 -*-
"""v1.4.0：页面级 AI 询问入口（底部横条）+ 办事大厅 AI 助手集群（8 场景）"""
import io, json, sys

P = 'docs/03-preview/demo.html'
s = io.open(P, encoding='utf-8').read()
orig = len(s)
bad = []


def rep(old, new, cnt=1):
    global s
    got = s.count(old)
    if got != cnt:
        bad.append('%d!=%d  %s' % (got, cnt, old[:70]))
        return
    s = s.replace(old, new)


# ---------------------------------------------------------------- 1. 状态
rep(" auth:'login',agree:false,loginBusy:false",
    " auth:'login',agree:false,loginBusy:false,aiCtx:null", 1)

# ---------------------------------------------------------------- 2. CSS
CSS = """
/* ===== v1.4.0 · 页面级 AI 询问入口（底部横条） ===== */
.aibar{position:absolute;left:0;right:0;bottom:0;z-index:22;padding:0 10px 8px;pointer-events:none}
.aibar.up{bottom:61px}
.aibar .in{pointer-events:auto;height:42px;border-radius:12px;background:#fff;border:1px solid #DCE4F0;
  box-shadow:0 4px 14px rgba(16,32,64,.13);display:flex;align-items:center;gap:8px;padding:0 12px;cursor:pointer}
.aibar .in:active{transform:scale(.99)}
.aibar .ai{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#4B45B8,#1F5FD6);
  color:#fff;display:flex;align-items:center;justify-content:center;flex:none}
.aibar .tx{flex:1;font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aibar .tx b{color:var(--t1);font-weight:700}
.aibar .go{font-size:15px;color:#C3C9D4;flex:none}
/* 面板 */
.apctx{font-size:9.5px;color:var(--t3);margin:-2px 0 8px;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.apctx b{color:var(--blue);font-weight:700}
.apqs{display:flex;flex-direction:column;gap:6px;margin-bottom:9px}
.apq{font-size:11px;color:var(--blue);background:var(--blue-l);border-radius:7px;padding:7px 10px;
  cursor:pointer;display:flex;align-items:center;gap:5px}
.apq:active{opacity:.65}
.aplog{max-height:33vh;overflow-y:auto;display:flex;flex-direction:column;gap:7px;margin-bottom:9px}
.aplog:empty{display:none}
.apm{font-size:11.5px;line-height:1.7;border-radius:10px;padding:8px 10px;max-width:93%}
.apm.u{align-self:flex-end;background:var(--blue);color:#fff;border-bottom-right-radius:3px}
.apm.a{align-self:flex-start;background:#F4F6FA;color:var(--t1);border-bottom-left-radius:3px}
.apm.pend{color:var(--t3)}
.apd{display:inline-block;width:10px;height:10px;border:1.6px solid #C3C9D4;border-top-color:var(--blue);
  border-radius:50%;animation:apsp .8s linear infinite;vertical-align:-1px;margin-right:5px}
@keyframes apsp{to{transform:rotate(360deg)}}
.apc{font-size:8.5px;color:var(--t3);margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.apw{font-size:8.5px;color:#8A5A00;background:var(--gold-l);border-radius:5px;padding:3px 6px;
  margin-top:5px;display:flex;align-items:center;gap:3px}
.apops{display:flex;gap:10px;margin-top:7px;font-size:10px;font-weight:700}
.apops span{color:var(--blue);cursor:pointer}
.apops span.cl{color:var(--t3)}
.apin{display:flex;gap:6px;align-items:center}
.apin input{flex:1;height:34px;border-radius:8px;border:1px solid #E3E8F0;background:#FAFBFD;
  padding:0 10px;font-size:11.5px;outline:none;font-family:inherit;min-width:0}
.apin input:focus{border-color:var(--blue);background:#fff}
.apin .sd{height:34px;padding:0 12px;border-radius:8px;background:var(--blue);color:#fff;font-size:11.5px;
  font-weight:700;display:flex;align-items:center;flex:none;cursor:pointer}
.apin .sd:active{filter:brightness(.92)}
/* 办事大厅集群卡 */
.aig{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 12px}
.aigc{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 11px;
  cursor:pointer;box-shadow:var(--sh)}
.aigc:active{transform:scale(.985)}
.aigc .h{display:flex;align-items:center;gap:6px;margin-bottom:3px}
.aigc .h .k2{width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex:none}
.aigc .h b{font-size:11.5px;font-weight:800}
.aigc p{font-size:9px;color:var(--t3);line-height:1.5}
"""
i = s.rindex('</style>')
s = s[:i] + CSS + s[i:]

# ---------------------------------------------------------------- 3. JS 主体
JS = r'''
/* ============ v1.4.0 · 页面级 AI 入口 + 办事大厅 AI 集群 ============ */
/* 每个服务页的入口配置：svc 取当前页上下文，presets 是 3 条预置问句 */
const AI_PAGE_CFG={
  book:{name:'预约服务',up:true,go:'book',presets:[
    '这个服务要多久？','可以改时间吗？','需要准备什么材料？']},
  express:{name:'快递代取',up:false,go:'express',presets:[
    '取件码在哪里看？','能代放几天？','可以让别人代取吗？']},
  record:{name:'健康档案',up:false,go:'record',presets:[
    '血压多少算偏高？','体检报告去哪拿？','怎么签约家庭医生？']},
  bill:{name:'缴费账单',up:false,go:'bill',presets:[
    '这个月水费怎么算的？','欠费会停水吗？','户号怎么绑定？']},
  lease:{name:'房屋租售',up:false,go:'lease',presets:[
    '房源是业主本人发的吗？','看房要收费吗？','签合同要注意什么？']},
  tool:{name:'共享设备',up:false,go:'tool',presets:[
    '这个怎么借？','超时怎么收费？','在哪里归还？']},
  meal:{name:'智慧配餐',up:true,go:'meal',presets:[
    '热量是怎么算的？','有糖尿病能这样吃吗？','可以只订午餐吗？']}
};
/* 办事大厅的 8 个 AI 场景 */
const HUB_SCENES=[
  {k:'guide',n:'办事指南',d:'材料、流程、要跑几趟',i:'file',c:'#1F5FD6',
   qs:['办居住证要带什么？','高龄补贴怎么申请？','办完多久能拿到？']},
  {k:'repair',n:'报修与进度',d:'派单到哪了、多久上门',i:'wrench',c:'#C9302C',
   qs:['我的报修派单了吗？','师傅大概几点到？','修完不满意怎么办？']},
  {k:'health',n:'健康咨询',d:'指标怎么看、疫苗与义诊',i:'stetho',c:'#0E7C6B',
   qs:['血压 145/92 要紧吗？','本周有义诊吗？','疫苗怎么预约？']},
  {k:'meal',n:'配餐与营养',d:'今天吃什么、忌口能不能吃',i:'bowl',c:'#0B6146',
   qs:['控糖的一天怎么吃？','尿酸高能吃豆腐吗？','老人牙口不好怎么配？']},
  {k:'bill',n:'费用与户号',d:'水电气怎么算、怎么绑户号',i:'bulb',c:'#A86A05',
   qs:['这个月水费为什么涨了？','户号在哪查？','欠费多久会停？']},
  {k:'place',n:'找地点',d:'雨伞、充电宝、快递点在哪',i:'pin',c:'#4B45B8',
   qs:['最近的共享雨伞在哪？','快递柜在几号楼？','充电宝哪里能还？']},
  {k:'circle',n:'邻里互助',d:'发帖、借东西、处理纠纷',i:'users',c:'#0E8F9E',
   qs:['闲置怎么发比较快出手？','楼上噪音怎么沟通？','拼单怎么发起？']},
  {k:'sos',n:'应急求助',d:'停水漏水、急病、独居老人',i:'warn',c:'#C9302C',
   qs:['家里漏水先找谁？','突然停水怎么办？','独居老人有事怎么求助？']}
];
/* 本地问答库：预置问句的离线答案（模型不可用时的兜底，也是演示时的稳定输出） */
const QA_BANK={
  '这个服务要多久？':{t:'按服务类型不同：保洁 2 小时起、家电维修一般 1-2 小时、助浴约 90 分钟。提交后师傅会先电话确认，实际时长以现场为准。',c:['服务指南 · 预约']},
  '可以改时间吗？':{t:'可以。在「我的 → 我的预约」里点该单，选「改约」重新选时段；上门前 2 小时改约不收费，师傅已在路上时改约需重新排队。',c:['服务指南 · 改约']},
  '需要准备什么材料？':{t:'一般只需房号与联系电话。开锁换锁需出示房产证明或租房合同；适老化改造需先做上门评估，由社区统一安排。',c:['服务指南 · 材料']},
  '取件码在哪里看？':{t:'在「我的 → 我的预约 → 快递代取」里看，取件时会短信再发一次。到驿站报房号也能取，但必须核对手机尾号。',c:['服务指南 · 快递']},
  '能代放几天？':{t:'免费保管 3 天，第 4 天起每天 1 元，最长 7 天。生鲜与冷链只放 1 天，超时驿站会联系你处理。',c:['服务指南 · 快递']},
  '可以让别人代取吗？':{t:'可以。把取件码给对方即可，驿站会核对手机尾号后四位。贵重件建议提前在备注里写明代取人姓名。',c:['服务指南 · 快递']},
  '血压多少算偏高？':{t:'家庭自测一般以 135/85 mmHg 为界，诊室以 140/90 为界。单次偏高不等于高血压，建议同一时段连测 3 天再看趋势。有头晕胸闷请直接就医。',c:['健康档案 · 指标说明','社区卫生服务站']},
  '体检报告去哪拿？':{t:'在「健康档案」里看电子版，纸质版到社区卫生服务站一楼窗口凭身份证领取，一般体检后 3 个工作日可取。',c:['健康档案 · 报告']},
  '怎么签约家庭医生？':{t:'在「健康养老 → 家庭医生签约」提交，或到服务站现场签。签约免费，可享受优先转诊与慢病随访；服务范围以签约机构为准。',c:['服务指南 · 家医签约']},
  '这个月水费怎么算的？':{t:'水费按阶梯价：每月 0-20 吨 2.6 元/吨，21-30 吨 3.9 元/吨，超过 30 吨 5.2 元/吨，另加污水处理费 1.1 元/吨。账单明细可在「缴费」里逐项展开。',c:['缴费指南 · 水费']},
  '欠费会停水吗？':{t:'连续欠费 2 个账期会先发催缴通知，仍未缴才停水；停水后缴清欠费与违约金，24 小时内恢复。低保家庭可到社区申请水费减免。',c:['缴费指南 · 欠费']},
  '户号怎么绑定？':{t:'在「我的 → 户号绑定」里选水/电/燃气，输入户号后系统核对户名与房号；不一致需到营业厅或物业改档。绑定后才能代缴。',c:['服务指南 · 户号']},
  '房源是业主本人发的吗？':{t:'社区房源要求上传房产证明后由物业核验，页面上带「已核验」标记的即业主本人。社区不参与交易、不收取任何费用。',c:['服务指南 · 租售']},
  '看房要收费吗？':{t:'不收。任何以「看房费、意向金、锁房费」名义收钱的都不要给，可直接向物业举报。',c:['服务指南 · 租售']},
  '签合同要注意什么？':{t:'重点看四件事：押金退还条件、租期与涨租条款、维修责任划分、是否允许转租。建议用社区提供的合同范本，签前拍照留存。',c:['服务指南 · 租售']},
  '这个怎么借？':{t:'到点位扫码即可借，首次使用需授权免押金。共享雨伞 24 小时内免费，超时 1 元/小时；充电宝前 1 小时免费，之后 1 元/小时。',c:['服务指南 · 共享设备']},
  '超时怎么收费？':{t:'雨伞超 24 小时后 1 元/小时，单日上限 10 元；充电宝超 1 小时后 1 元/小时，单日上限 12 元。费用从授权账户扣，可在借用记录里查。',c:['服务指南 · 计费']},
  '在哪里归还？':{t:'任一社区点位都能还：1 号楼大厅、南门岗亭、2 号楼架空层。归还后务必确认小程序显示「已归还」，否则会继续计费。',c:['服务指南 · 点位']},
  '热量是怎么算的？':{t:'按目标人群的每日能量需求估算：控糖 1600、控压 1700、减脂 1400、术后 1800、老年软食 1500 kcal，再按蛋白 18% / 碳水 52% / 脂肪 30% 配比。数值为参考值，不替代医生或营养师处方。',c:['膳食指南（2022）']},
  '有糖尿病能这样吃吗？':{t:'配餐按「控糖」目标会优先低 GI 主食并控制精制糖，但糖尿病饮食需结合用药与血糖监测，请以签约医生意见为准。本功能只提供膳食建议，不替代处方。',c:['膳食指南（2022）','社区卫生服务站']},
  '可以只订午餐吗？':{t:'可以。在「预约助餐」里选择需要的餐次即可，单餐也送；连续订 5 天以上可申请助餐补贴，60 岁以上登记后自动核算。',c:['服务指南 · 助餐']},
  '办居住证要带什么？':{t:'需身份证、居住证明（租赁合同或房产证）、近期一寸照。到社区服务站 3 号窗口办理，材料齐全当场受理，一般 5 个工作日可领。',c:['办事指南 · 居住证']},
  '高龄补贴怎么申请？':{t:'年满 80 周岁可申请，需身份证、户口本、本人银行卡。可由家属代办，需加带代办人身份证与委托书。',c:['办事指南 · 高龄补贴']},
  '办完多久能拿到？':{t:'多数事项 3-5 个工作日；居住证 5 个工作日，高龄补贴按月审核、次月发放。办件进度在「办事大厅 → 我的办件」里能查。',c:['办事指南 · 时限']},
  '我的报修派单了吗？':{t:'在「办事大厅 → 我的报修」看状态：待派单 / 已派单 / 上门中 / 已完成。已派单会显示师傅姓名与预计上门时间。',c:['服务指南 · 报修']},
  '师傅大概几点到？':{t:'派单后师傅会先电话联系确认时段。若超过约定时间 30 分钟未到，可在工单里点「催单」，或直接联系物业服务台。',c:['服务指南 · 报修']},
  '修完不满意怎么办？':{t:'在工单详情点「申请返修」，48 小时内免费返修；对收费有异议可申请社区介入核对报价单。',c:['服务指南 · 售后']},
  '血压 145/92 要紧吗？':{t:'145/92 属于偏高，但单次测量不能确诊。建议安静休息 5 分钟后复测，连续 3 天同一时段偏高请到社区门诊就诊。若伴头痛、胸闷、视物模糊请立即就医。',c:['健康档案 · 指标说明']},
  '本周有义诊吗？':{t:'本周六 9:00-11:30 在社区广场有免费义诊，测血压血糖、中医问诊。无需预约，带医保卡即可。',c:['社区活动 · 义诊']},
  '疫苗怎么预约？':{t:'在「健康养老 → 疫苗预约」选疫苗与时段，儿童需带接种证。成人流感疫苗每年 9-11 月集中接种，到货会在通知里提醒。',c:['服务指南 · 疫苗']},
  '控糖的一天怎么吃？':{t:'早餐燕麦牛奶+鸡蛋，午餐杂粮饭配清蒸鱼与绿叶菜，晚餐冬瓜汤+少量瘦肉，加餐一小把坚果。主食换一半粗粮、少喝含糖饮料最关键。可用「智慧配餐」直接生成一周方案。',c:['膳食指南（2022）']},
  '尿酸高能吃豆腐吗？':{t:'可以适量吃。豆制品嘌呤中等，但植物嘌呤对尿酸影响小于动物内脏与海鲜；避免浓肉汤、啤酒、动物内脏，多喝水更重要。',c:['膳食指南（2022）']},
  '老人牙口不好怎么配？':{t:'选「老年软食」目标，菜品以蒸煮炖为主、少骨刺：南瓜蒸鸡、豆腐煲、软烂粥面。食物切小、煮透，保证每天一个鸡蛋和一杯奶。',c:['膳食指南（2022）']},
  '这个月水费为什么涨了？':{t:'常见三种原因：用量跨进更高阶梯、抄表周期天数不同、污水处理费调整。可在「缴费」里对比近三个月用量与单价，异常可申请复核水表。',c:['缴费指南 · 水费']},
  '户号在哪查？':{t:'纸质水费单左上角、燃气表箱贴纸、或物业前台都能查。也可以拿房号到营业厅查，绑定一次后不用再记。',c:['服务指南 · 户号']},
  '欠费多久会停？':{t:'连续 2 个账期未缴会发催缴通知，仍未缴才停供。停供后缴清欠费与违约金，24 小时内恢复。',c:['缴费指南 · 欠费']},
  '最近的共享雨伞在哪？':{t:'1 号楼大厅（离你约 60 米）、南门岗亭、2 号楼架空层三个点位，24 小时可借。打开「社区地图」能看到实时可借数量。',c:['服务指南 · 点位']},
  '快递柜在几号楼？':{t:'1 号楼架空层有丰巢柜，2 号楼门厅有驿站代收点。大件放驿站，凭取件码或房号领取。',c:['服务指南 · 快递']},
  '充电宝哪里能还？':{t:'所有点位通借通还：1 号楼大厅、南门岗亭、2 号楼架空层。归还后确认小程序显示「已归还」，否则会继续计费。',c:['服务指南 · 共享设备']},
  '闲置怎么发比较快出手？':{t:'三件事：拍清晰实物图、写清成色与自提地点、价格比原价低一半左右。发布时选「闲置转让」类型，会自动带价格与自提字段。',c:['圈子指南 · 闲置']},
  '楼上噪音怎么沟通？':{t:'先在圈子里发「邻里求助」说明情况（不点名），多数邻居看到会主动联系；仍无改善可找物业上门协调，夜间 22 点后可报警处理。',c:['圈子指南 · 纠纷']},
  '拼单怎么发起？':{t:'在「生鲜预订 → 邻里拼单」选商品发起，填成团数量与截止时间，满单后统一配送到 1 号楼大厅。拼单不收款，货到当面结算。',c:['服务指南 · 拼单']},
  '家里漏水先找谁？':{t:'先关总阀（厨房或卫生间进门处），再打物业 24 小时值班电话；若已渗到楼下，同时通知楼下邻居拍照留证。紧急情况点「紧急求助」。',c:['应急指南 · 漏水']},
  '突然停水怎么办？':{t:'先看「消息通知」里有没有停水公告与恢复时间；没有公告说明是突发，打物业电话确认。恢复供水后先放水 1-2 分钟再使用。',c:['应急指南 · 停水']},
  '独居老人有事怎么求助？':{t:'社区为独居老人建档，可申请「每日关怀」：早晚各一次电话或上门。紧急情况按家中一键呼叫器，或让邻居在圈子里发「紧急求助」。',c:['应急指南 · 独居关怀']}
};
function aiCtxName(page){
  const cfg=AI_PAGE_CFG[page]; if(!cfg) return '';
  if(page==='book'&&state.book) return state.book.svc||cfg.name;
  if(page==='tool'&&state.tool) return state.tool.n||cfg.name;
  return cfg.name;
}
function aiBarHtml(page){
  const cfg=AI_PAGE_CFG[page]; const nm=aiCtxName(page);
  return `<div class="aibar ${cfg.up?'up':''}">
    <div class="in" data-act="ap-open" data-p="${page}">
      <span class="ai">${ico('sparkles',13)}</span>
      <span class="tx">问 AI：<b>${esc(nm)}</b> 怎么办？</span>
      <span class="go">›</span>
    </div>
  </div>`;
}
/* 打开 AI 面板。ctx={title,svc,from,presets,page} */
function openAiPanel(ctx){
  state.aiCtx=ctx;
  openSheet(`<h3 style="display:flex;align-items:center;gap:6px">
      ${ico('sparkles',15)} ${esc(ctx.title||'问 AI')}</h3>
    <div class="apctx">${ico('pin',10)} 来自：<b>${esc(ctx.svc||'社区服务')}</b>
      ${ctx.from?`<span>· ${esc(ctx.from)}</span>`:''}</div>
    <div class="apqs">
      ${(ctx.presets||[]).map(q=>`<div class="apq" data-act="ap-ask" data-q="${esc(q)}">
        ${ico('chat',11)} ${esc(q)}</div>`).join('')}
    </div>
    <div class="aplog" id="apLog"></div>
    <div class="apin">
      <input id="apIn" placeholder="换个问法，或直接说你的情况…" maxlength="60">
      <span class="sd" data-act="ap-send">发送</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:9px;
      font-size:8.5px;color:var(--t3)">
      <span>回答由免费模型生成，办事以指南为准</span>
      <span data-act="ap-call" style="color:var(--blue);font-weight:700">转人工 ›</span>
    </div>
    <div class="cl" data-act="close">关闭</div>`);
}
async function askInline(q){
  q=String(q||'').trim(); if(!q) return;
  const log=$('#apLog'); if(!log) return;
  const ctx=state.aiCtx||{};
  log.insertAdjacentHTML('beforeend', `<div class="apm u">${esc(q)}</div>`);
  const pid='apm'+Date.now();
  log.insertAdjacentHTML('beforeend',
    `<div class="apm a pend" id="${pid}"><span class="apd"></span>正在查社区资料…</div>`);
  log.scrollTop=log.scrollHeight;
  let text='', cites=[], local=false;
  try{
    if(typeof fetch!=='function') throw new Error('no-fetch');
    if(state.offline) throw new Error('offline');
    const sys='你是「阳光社区」便民助手。用户当前在「'+(ctx.svc||'社区服务')+'」页面提问。'
      +'只回答社区服务范围内的事，200 字以内，语气平实；不要编造电话、金额、政策条款；'
      +'涉及医疗只给一般性建议并提示就医；不知道就说不知道并建议转人工。';
    text=await aiFree(state.aiModel||'openai',
      [{role:'system',content:sys},{role:'user',content:q}]);
  }catch(e){
    const hit=QA_BANK[q]||localAnswer(q);
    text=hit.t||hit.text||'这个问题建议转人工确认。'; cites=hit.c||hit.cites||[]; local=true;
  }
  const el=document.getElementById(pid);
  if(el){
    el.classList.remove('pend');
    el.innerHTML=esc(text).replace(/\n/g,'<br>')
      +(cites.length?`<div class="apc">${cites.map(c=>`${ico('clip',9)} ${esc(c)}`).join(' ')}</div>`:'')
      +(local?`<div class="apw">${ico('warn',9)} 当前为本地答案（模型不可用）</div>`:'')
      +`<div class="apops"><span data-act="ap-go">去办理 ›</span>
          <span class="cl" data-act="ap-call">转人工</span></div>`;
  }
  log.scrollTop=log.scrollHeight;
}
function aiHubHtml(){
  return `<div class="sec" style="margin-top:10px">
    <div class="st"><b>AI 助手集群</b><em>${HUB_SCENES.length} 个场景 · 点开就能问</em></div>
    <div class="aig">
      ${HUB_SCENES.map(x=>`<div class="aigc" data-act="hub-open" data-k="${x.k}">
        <div class="h"><span class="k2" style="background:${x.c}1F;color:${x.c}">${ico(x.i,13)}</span>
          <b>${x.n}</b></div>
        <p>${x.d}</p></div>`).join('')}
    </div>
  </div>`;
}
'''
anchor = "/* ============ v1.3.1 开局登录（P7 授权型） ============ */"
if anchor not in s:
    bad.append('未找到插入锚点')
else:
    s = s.replace(anchor, JS + '\n' + anchor, 1)

# ---------------------------------------------------------------- 4. 挂载点
rep('    <div id="fabwrap"></div>',
    '    <div id="fabwrap"></div>\n    <div id="aibar"></div>', 1)

rep("""  const fw=$('#fabwrap');
  if(fw) fw.innerHTML=(authed&&state.page==='circle')
    ? `<div class="fab2" data-act="post-new">${ico('plus',20)}</div>` : '';""",
    """  const fw=$('#fabwrap');
  if(fw) fw.innerHTML=(authed&&state.page==='circle')
    ? `<div class="fab2" data-act="post-new">${ico('plus',20)}</div>` : '';
  const ab=$('#aibar');
  if(ab) ab.innerHTML=(authed&&AI_PAGE_CFG[state.page])?aiBarHtml(state.page):'';""", 1)

# ---------------------------------------------------------------- 5. 办事大厅插集群
rep("""    <div class="tb">${CATS.map(x=>`<div class="t ${x.key===c.key?'on':''}" data-act="cat" data-k="${x.key}">${x.name}</div>`).join('')}</div>""",
    """    ${kw?'':aiHubHtml()}
    <div class="tb">${CATS.map(x=>`<div class="t ${x.key===c.key?'on':''}" data-act="cat" data-k="${x.key}">${x.name}</div>`).join('')}</div>""", 1)

# ---------------------------------------------------------------- 6. 事件
rep("  if(a==='close'){closeSheet();return;}",
    """  if(a==='ap-open'){
    const pg=el.dataset.p||state.page, cfg=AI_PAGE_CFG[pg]||{name:'社区服务',presets:[]};
    openAiPanel({title:'问 AI · '+aiCtxName(pg),svc:aiCtxName(pg),
      from:'第 '+(Object.keys(AI_PAGE_CFG).indexOf(pg)+1)+' 个服务页',presets:cfg.presets,page:pg});
    return;}
  if(a==='hub-open'){
    const sc=HUB_SCENES.find(x=>x.k===el.dataset.k); if(!sc) return;
    openAiPanel({title:'AI 助手 · '+sc.n,svc:sc.n,from:'办事大厅 · AI 集群',
      presets:sc.qs,page:'ai'});
    return;}
  if(a==='ap-ask'){
    const box=$('#apLog');
    if(box) box.innerHTML='';
    askInline(el.dataset.q); return;}
  if(a==='ap-send'){
    const i=$('#apIn'); if(!i) return;
    const q=i.value.trim(); if(!q){toast('先说一下你想问什么');return;}
    i.value=''; askInline(q); return;}
  if(a==='ap-go'){
    const pg=(state.aiCtx||{}).page;
    closeSheet();
    if(pg&&pg!=='ai'){state.page=pg;render();toast('已跳到对应服务页');}
    else{state.page='hall';render();toast('去办事大厅挑一项服务');}
    return;}
  if(a==='ap-call'){toast('物业客服 020-8888 1234（演示不拨号）');return;}
  if(a==='close'){closeSheet();return;}""", 1)

# 输入框回车发送
rep("  if(e.target&&e.target.id==='aiIn'&&e.key==='Enter'){e.preventDefault();const q=e.target.value.trim();e.target.value='';aiAsk(q);}",
    "  if(e.target&&e.target.id==='aiIn'&&e.key==='Enter'){e.preventDefault();const q=e.target.value.trim();e.target.value='';aiAsk(q);}\n"
    "  if(e.target&&e.target.id==='apIn'&&e.key==='Enter'){e.preventDefault();\n"
    "    const q=e.target.value.trim(); if(!q)return; e.target.value=''; askInline(q);}", 1)

io.open(P, 'w', encoding='utf-8').write(s)
print('ok chars %d -> %d' % (orig, len(s)))
if bad:
    print('!! 未命中：')
    for x in bad:
        print('   ', x)
    sys.exit(1)
