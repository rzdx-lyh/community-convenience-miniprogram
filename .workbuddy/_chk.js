
/* ============ 数据 ============ */
const BLUE='#1F5FD6',TEAL='#0E7C6B',GOLD='#A86A05',INDIGO='#4B45B8';
const TINT={blue:['#EAF1FE',BLUE],teal:['#E6F5F2',TEAL],gold:['#FDF3E1',GOLD],indigo:['#EDECFB',INDIGO]};

const CATS=[
 {key:'life',name:'生活基础',full:'生活基础服务',icon:'🏠',theme:'blue',
  zone:'办事大厅｜生活类',groups:[
  {key:'house',name:'家政服务',note:'认证师傅 · 明码标价 · 乱收费全额退款',items:[
    {k:'clean',n:'保洁',i:'🧹',d:'60 元/小时起',flow:'book',opts:['日常保洁','深度保洁','玻璃清洗','开荒保洁']},
    {k:'repair',n:'家电维修',i:'🔧',d:'空调/冰箱/洗衣机',flow:'book',opts:['空调','冰箱','洗衣机','热水器']},
    {k:'drain',n:'管道疏通',i:'🚿',d:'马桶/地漏/下水',flow:'book',opts:['马桶','地漏','厨房下水','阳台']},
    {k:'nanny',n:'保姆钟点工',i:'👵',d:'按次或长期',flow:'book',opts:['钟点工','住家保姆','白班保姆']},
    {k:'lock',n:'开锁换锁',i:'🔑',d:'需房产证明',flow:'book',opts:['开门','换锁芯','装智能锁']},
    {k:'ac',n:'空调清洗',i:'❄️',d:'挂机80/柜机150',flow:'book',opts:['挂机','柜机','中央空调']}]},
  {key:'bill',name:'缴费代办',note:'只绑户号与登记，资金在微信「生活缴费」完成',items:[
    {k:'utility',n:'水电燃气代缴',i:'💡',d:'查欠费·代缴',flow:'bill'},
    {k:'express',n:'快递代取代寄',i:'📦',d:'驿站代收·上门取',flow:'express'},
    {k:'gov',n:'政务事项代办',i:'📄',d:'材料代收代交',flow:'book',opts:['社保医保','居住证','医保报销','其他']}]},
  {key:'fresh',name:'生鲜零售',note:'30 分钟配送到家 · 满 39 元免配送费',items:[
    {k:'veg',n:'当日鲜菜',i:'🥦',d:'每日 6:00 到货',flow:'fresh',tab:'veg'},
    {k:'clear',n:'临期特惠',i:'🍅',d:'低至 5 折',flow:'fresh',tab:'clear'},
    {k:'group',n:'邻里拼单',i:'🥬',d:'满 20 单成团',flow:'fresh',tab:'group'},
    {k:'pickup',n:'次日自提',i:'🍊',d:'1 号楼驿站取',flow:'fresh',tab:'pickup'}]}
 ]},
 {key:'elder',name:'健康养老',full:'健康养老服务',icon:'🧓',theme:'teal',
  zone:'健康专区｜可代家人办',banner:'健康一键约 · 家人可代办',
  groups:[
  {key:'health',name:'基础健康服务',note:'卫生服务站 · 65 岁以上免挂号费',items:[
    {k:'reg',n:'社区门诊挂号',i:'🏥',d:'免排队取号',flow:'booking',bdg:'热门'},
    {k:'clinic',n:'义诊活动',i:'🩺',d:'本周六 9:00',flow:'notice'},
    {k:'vaccine',n:'疫苗预约',i:'💉',d:'儿童/成人/流感',flow:'book',opts:['儿童常规','成人流感','HPV','带状疱疹']},
    {k:'record',n:'健康档案',i:'📋',d:'建档·调阅',flow:'record'},
    {k:'meal',n:'智慧配餐',i:'🥗',d:'按病配餐',flow:'meal'},
    {k:'bp',n:'测血压血糖',i:'🩸',d:'周二周四',flow:'book',opts:['现场测量','上门测量']},
    {k:'report',n:'体检报告代取',i:'📄',d:'代取并解读',flow:'book',opts:['个人','家庭套餐']}]},
  {key:'elderly',name:'老年专属服务',note:'60 岁以上可申请，行动不便可上门',items:[
    {k:'chronic',n:'慢性病咨询',i:'💊',d:'高血压/糖尿病',flow:'ask',q:'慢性病患者日常要注意什么？'},
    {k:'meal',n:'助餐',i:'🍚',d:'可送餐上门',flow:'book',bdg:'可送餐',opts:['午餐','晚餐','送餐上门']},
    {k:'bath',n:'助浴',i:'🛁',d:'上门助浴',flow:'book',opts:['上门助浴','陪护助浴']},
    {k:'escort',n:'上门陪护',i:'🤝',d:'白天/夜间',flow:'book',opts:['白天陪护','夜间陪护','24 小时']},
    {k:'reno',n:'适老化改造',i:'🛠',d:'可申请补贴',flow:'book',bdg:'可补贴',opts:['防滑地面','安全扶手','坐便改造','全屋适老']},
    {k:'doctor',n:'家庭医生签约',i:'👨‍⚕️',d:'基础/慢病包',flow:'book',opts:['基础包','慢病包','老年包']}]}
 ]},
 {key:'support',name:'便民配套',full:'便民配套服务',icon:'🔧',theme:'gold',
  zone:'便民工具｜物业延伸',groups:[
  {key:'tools',name:'便民工具',note:'扫码借用 · 异地归还 · 到期提醒',items:[
    {k:'umbrella',n:'共享雨伞',i:'☂️',d:'24h 内免费',flow:'tool',spots:'1 号楼大厅 · 南门岗亭 · 3 号楼架空层',free:'24 小时内免费，逾期 0.5 元/天'},
    {k:'toolkit',n:'维修工具',i:'🧰',d:'电钻·梯子·通厕器',flow:'tool',spots:'物业前台 · 2 号楼架空层',free:'免押金，3 天内归还'},
    {k:'power',n:'共享充电宝',i:'🔋',d:'前 1 小时免费',flow:'tool',spots:'1 号楼大厅 · 社区活动室',free:'前 1 小时免费'}]},
  {key:'ext',name:'物业延伸',note:'物业与业主共治，社区只做信息登记',items:[
    {k:'takeout',n:'外卖代收',i:'🛵',d:'存放点·预约上门',flow:'express'},
    {k:'stray',n:'流浪动物',i:'🐾',d:'养宠·公约·救助',flow:'book',opts:['走失启事','待领养','救助申请']},
    {k:'lease',n:'房屋租售',i:'🏘',d:'真实房源·业主发布',flow:'lease'}]}
 ]},
 {key:'culture',name:'文化便民',full:'文化便民服务',icon:'🏮',theme:'indigo',
  zone:'社区活动｜免费参加',groups:[
  {key:'culture',name:'文化便民',note:'社区活动室 · 免费参加',items:[
    {k:'weekly',n:'每周义诊',i:'🩺',d:'固定排期',flow:'notice'},
    {k:'hr',n:'健康报告',i:'📊',d:'年度体检汇总',flow:'record'},
    {k:'neighbor',n:'邻里活动',i:'🎉',d:'本周活动',flow:'notice'},
    {k:'lib',n:'图书角借阅',i:'📚',d:'借书/还书',flow:'book',opts:['借书','还书','续借']},
    {k:'class',n:'四点半课堂',i:'✏️',d:'放学后托管',flow:'book',opts:['报名','接送服务']},
    {k:'phone',n:'长者手机课',i:'📱',d:'基础/进阶',flow:'book',opts:['基础班','进阶班']}]}
 ]}
];

const FLAT=[];
CATS.forEach(c=>c.groups.forEach(g=>g.items.forEach(it=>FLAT.push({...it,cat:c.key,catName:c.full,grp:g.key,grpName:g.name,theme:c.theme}))));

/* 首页「常用服务」8 项：跨四类各取高频，避免变成"家政专场" */
const COMMON=['保洁','家电维修','水电燃气代缴','助餐','社区门诊挂号','共享雨伞','当日鲜菜','房屋租售']
  .map(n=>FLAT.find(x=>x.n===n)).filter(Boolean);

const NOTICES=[
 {t:'3 号楼停水提醒（附储水建议）',b:'明天 09:00-17:00 停水，家有老人的建议今晚先接两桶水，物业办公室也可取水。',m:'紧急 · 5 小时前',type:'red',lb:'紧急'},
 {t:'2 号门道路施工，建议绕行东门',b:'2 号门今早开始道路检修，预计两天，早高峰建议走东门。',m:'公告 · 6 小时前',type:'',lb:'公告'},
 {t:'爱心义诊进社区（本周六）',b:'9:00-11:30 社区广场，需测血糖的请空腹，现场可登记健康档案。',m:'活动 · 1 天前',type:'ok',lb:'活动'}
];

/* 社区圈子：话题 + 帖子（v1.0.7 增加 type 类型卡与 x 扩展字段） */
const TOPICS=['全部','路况实况','邻里求助','闲置转让','活动召集','养宠交流'];
const TOPIC_META={
 '路况实况':{i:'🚧',m:186,on:true,d:'小区路面、门岗、施工与临时管制，实拍实报。看到就发一条，比群里刷屏有用。'},
 '邻里求助':{i:'🤝',m:342,on:false,d:'借个梯子、搭把手、找个东西。邻居之间能帮就帮，帮完记得回来说一声。'},
 '闲置转让':{i:'📦',m:274,on:true,d:'孩子长大用不上的、搬家带不走的，先问邻居再扔。本社区只做信息沟通，不收款、不担保。'},
 '活动召集':{i:'🏸',m:158,on:false,d:'打球、读书、遛弯、义诊，凑够人就成团。发起活动请在正文写清时间地点。'},
 '养宠交流':{i:'🐾',m:126,on:true,d:'寻宠、喂养、疫苗、遛狗路线。遛狗请牵绳、随手清理，做个体面邻居。'}
};
const POSTS=[
 {id:'p1',pin:true,type:'road',who:'物业服务',unit:'官方账号',time:'5 小时前',topic:'路况实况',official:true,c:'#1F5FD6',av:'物',
  text:'2 号门今天开始道路检修，预计两天。早高峰建议走东门，电动车请绕行南门坡道，注意减速。',
  imgs:['🚧','🛣'],tag:'#道路施工',likes:42,
  x:{where:'2 号门 · 主路',st:'施工中',stc:'warn',until:'预计 2 天，10 月 20 日恢复'},
  comments:[{w:'3 栋王姨',t:'东门早上会不会堵？',m:'4 小时前'},{w:'物业服务',t:'东门已加开一条临时通道，放心走。',m:'4 小时前',off:true}]},
 {id:'p2',type:'ask',solved:true,who:'7 栋小李',unit:'7 号楼 2 单元',time:'5 天前',topic:'养宠交流',c:'#0E7C6B',av:'李',
  text:'谁家丢了一只橘猫？在中心凉亭附近转了两天，戴着蓝色项圈，很亲人，会主动蹭腿。主人看到请联系门卫室，我这边先喂着。',
  imgs:['🐱'],tag:'#寻宠启事',likes:68,
  x:{best:'2 栋张姐：好像是 5 栋那家的，我去问问。'},
  comments:[{w:'2 栋张姐',t:'好像是 5 栋那家的，我去问问。',m:'4 天前'},{w:'7 栋小李',t:'谢谢！已经找到主人了，猫回家了 🎉',m:'4 天前'},{w:'物业服务',t:'已记录，后续需要协助随时找我们。',m:'3 天前',off:true}]},
 {id:'p3',type:'ask',solved:false,who:'1 栋陈叔',unit:'1 号楼 1 单元',time:'1 天前',topic:'邻里求助',c:'#A86A05',av:'陈',
  text:'家里换灯泡差个高一点的梯子，谁家有能借一下？下午就还，谢谢邻居们。',
  imgs:[],tag:'#邻里互助',likes:12,
  x:{},
  comments:[{w:'2 栋赵哥',t:'我家有 2 米的，晚上 7 点后在家。',m:'22 小时前'},{w:'1 栋陈叔',t:'太感谢了！',m:'21 小时前'}]},
 {id:'p4',type:'sell',who:'3 栋周姐',unit:'3 号楼 2 单元',time:'2 天前',topic:'闲置转让',c:'#4B45B8',av:'周',
  text:'孩子上初中了，儿童书桌和书架用不上，八成新，自提免费送，需要的邻居留言。',
  imgs:['🪑','📚','🧸'],tag:'#闲置转让',likes:31,
  x:{price:'免费送',origin:'原价 ￥299',cond:'八成新 · 自提'},
  comments:[{w:'5 栋孙姐',t:'书桌还在吗？我想要。',m:'1 天前'}]},
 {id:'p5',type:'event',who:'社区活动室',unit:'官方账号',time:'3 天前',topic:'活动召集',official:true,c:'#1F5FD6',av:'活',
  text:'本周六上午 9 点，社区羽毛球队在 2 号楼下空地集合，欢迎新邻居加入，球拍可借用。',
  imgs:['🏸'],tag:'#活动召集',likes:27,
  x:{when:'本周六 09:00',where:'2 号楼下空地',join:12,cap:20},
  comments:[{w:'6 栋小林',t:'报名一个！',m:'3 天前'}]},
 {id:'p6',type:'road',who:'2 栋赵哥',unit:'2 号楼 3 单元',time:'1 天前',topic:'路况实况',c:'#0E7C6B',av:'赵',
  text:'西门口那条路昨晚已经修好了，现在走路不用绕，给物业点个赞，从反馈到修好只用了三天。',
  imgs:['✅','🛤','🌇'],tag:'#路况反馈',likes:55,
  x:{where:'西门 · 主路',st:'已恢复',stc:'ok'},
  comments:[{w:'4 栋吴姨',t:'效率真高 👍',m:'1 天前'}]},
 {id:'p7',type:'sell',who:'3 栋阿明',unit:'3 号楼 1 单元',time:'6 小时前',topic:'闲置转让',c:'#4B45B8',av:'明',
  text:'孩子长高了骑不了，儿童自行车 16 寸，刹车和轮胎都好，送打气筒。楼下自提。',
  imgs:['🚲','🛞'],tag:'#闲置转让',likes:9,
  x:{price:'￥80',origin:'原价 ￥299',cond:'九成新 · 楼下自提'},
  comments:[]},
 {id:'p8',type:'event',who:'5 栋刘老师',unit:'5 号楼 2 单元',time:'1 天前',topic:'活动召集',c:'#0E7C6B',av:'刘',
  text:'想在社区活动室办个周末读书会，第一次先聊聊各自的读书习惯，带一本最近在看的书就行，人不多也能聊。',
  imgs:['📖'],tag:'#活动召集',likes:18,
  x:{when:'本周日 15:00',where:'社区活动室 2 楼',join:6,cap:15},
  comments:[{w:'8 栋小周',t:'算我一个，正好想找人一起读。',m:'20 小时前'}]},
 {id:'p9',type:'share',who:'3 栋阿明',unit:'3 号楼 2 单元',time:'3 小时前',topic:'养宠交流',c:'#0E7C6B',av:'明',
  text:'东侧围墙那块空地光照好，物业说可以申请做共享小菜园，我打算去问一下流程，有想一起弄的邻居吗？',
  imgs:['🌱'],tag:'#邻里共建',likes:23,
  comments:[{w:'3 栋王姨',t:'我要一小块种葱，算我一份。',m:'2 小时前'}]},
];
function findPost(id){return POSTS.find(p=>p.id===id);}
const SKU={
 veg:[{n:'本地油麦菜',d:'约 400g/份',p:'3.8',u:'份',e:'🥬'},{n:'沙地土豆',d:'约 500g/份',p:'2.6',u:'份',e:'🥔'},
      {n:'新鲜西红柿',d:'约 500g/份',p:'4.5',u:'份',e:'🍅'},{n:'小油菜',d:'约 300g/把',p:'2.2',u:'把',e:'🥦'},
      {n:'鲜鸡蛋',d:'10 枚/盒',p:'8.9',u:'盒',e:'🥚'},{n:'本地丝瓜',d:'约 400g/条',p:'3.2',u:'条',e:'🥒'}],
 clear:[{n:'临期酸奶',d:'保质期剩 3 天',p:'3.9',u:'排',e:'🥛',hot:'5 折'},{n:'临期面包',d:'当日到期',p:'2.5',u:'个',e:'🍞',hot:'清仓'},
      {n:'临近水果拼盘',d:'当日食用',p:'5.5',u:'盒',e:'🍓',hot:'6 折'},{n:'临期豆制品',d:'保质期剩 2 天',p:'2.8',u:'盒',e:'🍢',hot:'5 折'},
      {n:'临期牛奶',d:'保质期剩 5 天',p:'9.9',u:'箱',e:'🥛',hot:'7 折'},{n:'熟食折扣',d:'当日现做',p:'6.6',u:'份',e:'🍗',hot:'6 折'}],
 group:[{n:'邻里拼·土豆',d:'满 20 单成团',p:'1.9',u:'份',e:'🥔',hot:'拼单'},{n:'邻里拼·鸡蛋',d:'满 20 单成团',p:'7.5',u:'盒',e:'🥚',hot:'拼单'},
      {n:'邻里拼·青菜',d:'满 20 单成团',p:'1.6',u:'份',e:'🥬',hot:'拼单'},{n:'邻里拼·水果',d:'满 20 单成团',p:'12.9',u:'箱',e:'🍎',hot:'拼单'},
      {n:'邻里拼·米面',d:'满 20 单成团',p:'25.9',u:'袋',e:'🍚',hot:'拼单'},{n:'邻里拼·调料',d:'满 20 单成团',p:'4.9',u:'瓶',e:'🧂',hot:'拼单'}],
 pickup:[{n:'次日自提·蔬菜包',d:'6 种时令菜',p:'19.9',u:'包',e:'🥗'},{n:'次日自提·水果包',d:'4 种当季果',p:'29.9',u:'包',e:'🍇'},
      {n:'次日自提·早餐包',d:'包子+豆浆',p:'12.9',u:'份',e:'🥟'},{n:'次日自提·肉蛋包',d:'猪肉+鸡蛋',p:'26.9',u:'包',e:'🍖'},
      {n:'次日自提·净菜',d:'洗净可直接炒',p:'8.9',u:'份',e:'🥬'},{n:'次日自提·粗粮',d:'玉米红薯',p:'9.9',u:'份',e:'🌽'}]
};

const BILLS=[
 {k:'水费',i:'💧',c:'teal',acc:'****3021',amt:'32.40',day:'10-15 出账'},
 {k:'电费',i:'💡',c:'gold',acc:'****8890',amt:'128.60',day:'10-14 出账'},
 {k:'燃气费',i:'🔥',c:'blue',acc:'未绑定',amt:'—',day:'需先绑定户号'}
];

const HOUSES=[
 {t:'3 号楼 2 室 1 厅',d:'68㎡ · 朝南 · 15 楼 · 已核验',p:'2600',u:'元/月',e:'🏢',ty:'rent'},
 {t:'7 号楼 1 室 1 厅',d:'42㎡ · 精装 · 6 楼 · 已核验',p:'1800',u:'元/月',e:'🏠',ty:'rent'},
 {t:'1 号楼 3 室 2 厅',d:'102㎡ · 南北通透 · 业主自挂',p:'3500',u:'元/月',e:'🏘',ty:'rent'},
 {t:'5 号楼 2 室 2 厅 · 出售',d:'89㎡ · 满五唯一 · 已核验',p:'218',u:'万',e:'🏦',ty:'sell'}
];

const DEPTS=[
 {n:'全科门诊',d:'常见病 · 开药 · 转诊',e:'🩺'},
 {n:'慢病门诊',d:'高血压 · 糖尿病随访',e:'💊'},
 {n:'儿科门诊',d:'0-14 岁',e:'🧒'},
 {n:'中医理疗',d:'针灸 · 推拿',e:'🌿'}
];
const DOCTORS={
 '全科门诊':[{n:'李医生',t:'主治医师 · 全科',q:'今日余 8 号'},{n:'王医生',t:'副主任医师',q:'今日余 3 号'}],
 '慢病门诊':[{n:'张医生',t:'慢病管理 · 10 年',q:'今日余 6 号'}],
 '儿科门诊':[{n:'陈医生',t:'儿科主治',q:'今日余 4 号'}],
 '中医理疗':[{n:'刘医生',t:'中医师 · 针灸',q:'今日余 2 号'}]
};
const SLOTS=['09:00-10:00','10:00-11:00','11:00-12:00','14:00-15:00','15:00-16:00','16:00-17:00'];

const KB=[
 {k:['物业','电话'],a:'物业服务中心 24 小时值班电话 020-88888888，办公时间 8:30-18:00，1 号楼 1 层前台。'},
 {k:['慢病','高血压','糖尿病'],a:'高血压/糖尿病请按时服药、低盐饮食、每周至少测 2 次血压血糖；社区慢病门诊可做随访，建议每 3 个月复诊一次。以上为健康提示，不替代医生诊断。'},
 {k:['停水','水'],a:'明天 09:00-17:00 停水，建议今晚先储水；家中有老人的可到物业办公室取水。'},
 {k:['补贴','改造'],a:'适老化改造含防滑地面、扶手、坐便器改造，可申请补贴，需先登记评估（60 岁以上）。'},
 {k:['缴费','水费','电费'],a:'水费 020-88884444、电费 020-88883333、燃气 020-88882222；缴费在微信「生活缴费」，本小程序只做户号绑定与代办登记。'}
];

/* ============ 状态 ============ */
const state={
 page:'home',backTo:'home',cat:'life',care:false,
 kw:'',book:null,freshTab:'veg',cart:{},tool:null,
 leaseTy:'all',booking:null,notice:null,askQ:'',askA:'',
 circleTab:'全部',liked:{},detail:null,draft:'',draftTopic:'邻里求助',
 feed:'rec',topic:'路况实况',topicOn:{'路况实况':true,'闲置转让':true,'养宠交流':true},
 follow:{'物业服务':true,'社区活动室':true,'7 栋小李':true},saved:{p3:true,p6:true},replyTo:'',
 draftType:'ask',draftImgs:[],joined:{},mineTab:'post',
 loc:{st:'locating',acc:12},mapTy:'all',mapSchematic:false,
 aiTab:'chat',aiModel:'openai',msgs:[],aiBusy:false,offline:false,
 imgPrompt:'',imgStyle:'写实',imgRatio:'1:1',imgs:[],imgBusy:false,
 meal:{onboarded:false,goal:'sugar',people:2,taboos:[],day:0,plan:{},locked:{}},
 prof:{name:'阿明的小院',av:'阿',color:'#1F5FD6',sign:'住 3 号楼，爱帮邻居搭把手',
   addr:'3 号楼 2 单元 502',
   members:[{k:'m1',n:'妈妈',r:'母亲',av:'妈',c:'#C9302C'},{k:'m2',n:'小满',r:'女儿',av:'满',c:'#0E7C6B'}],
   addrs:[{k:'a1',t:'3 号楼 2 单元 502',tag:'默认'},{k:'a2',t:'2 号楼 1 单元 101',tag:'备用'}],
   notice:{wo:true,out:true,act:false},font:'std'},
 auth:'login',agree:false,loginBusy:false,aiCtx:null
};
const $=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ===== v1.2.0 · 图标系统：emoji → iconfont 风格矢量图标 ===== */
const EMO2I={"🏠": "home", "🧹": "broom", "🔧": "wrench", "🚿": "pipe", "👵": "nurse", "🔑": "key", "❄": "snow", "💡": "bulb", "📦": "package", "📄": "file", "🥦": "leaf", "🍅": "tagpct", "🥬": "cart", "🍊": "basket", "🧓": "elder", "🏥": "hospital", "🩺": "stetho", "💉": "syringe", "📋": "clipboard", "🩸": "droplet", "💊": "pill", "🍚": "bowl", "🛁": "bathtub", "🤝": "handshake", "🛠": "tools", "👨‍⚕": "doctor", "☂": "umbrella", "🧰": "toolbox", "🔋": "battery", "🛵": "scooter", "🐾": "paw", "🏘": "building", "🏮": "book-open", "🎉": "megaphone", "📚": "book", "✏": "pencil", "📱": "phone", "🚧": "cone", "🥗": "bowl", "🏸": "users", "🔍": "search", "🗺": "map", "💬": "chat", "🔔": "bell", "📍": "pin", "🤖": "robot", "★": "star-f", "☆": "star", "👥": "users", "📌": "pin", "🏷": "tag", "📎": "clip", "🎤": "mic", "🖼": "image", "⚡": "bolt", "☺": "user", "🔄": "refresh", "🔓": "unlock", "🔒": "lock", "✓": "check", "⚠": "warn", "✅": "check-c", "💧": "droplet", "🔥": "flame", "🏢": "building", "🏦": "bank", "🧒": "child", "🌿": "sprout", "🚲": "bike", "🪑": "chair", "🧸": "gift", "🌇": "sunset", "🛞": "disc", "📖": "book-open", "🌱": "sprout", "🐱": "paw", "🛣": "route", "🛤": "route", "👍": "thumb", "✨": "sparkles"};
const ICON_NAMES=["home", "grid", "chat", "user", "users", "search", "bell", "map", "pin", "robot", "sparkles", "mic", "image", "star", "star-f", "check", "check-c", "close", "chev-r", "chev-l", "plus", "refresh", "lock", "unlock", "warn", "info", "clock", "calendar", "phone", "tag", "clip", "bolt", "heart", "pencil", "thumb", "broom", "wrench", "pipe", "key", "snow", "bulb", "package", "file", "leaf", "tagpct", "hospital", "stetho", "syringe", "clipboard", "droplet", "pill", "bowl", "bathtub", "handshake", "tools", "umbrella", "toolbox", "battery", "scooter", "paw", "building", "book", "book-open", "cone", "activity", "sunset", "bike", "chair", "gift", "sprout", "flame", "bank", "child", "route", "megaphone", "basket", "cart", "disc", "dots", "elder", "nurse", "doctor", "share"];
function iconName(e){
  if(!e) return '';
  var k=String(e).replace(/[\uFE0F\u200D]/g,'');
  return EMO2I[k]||EMO2I[e]||'';
}
function ico(n,s,solid){
  return '<i class="ii'+(solid?' solid':'')+'" style="font-size:'+(s||18)+'px"><svg viewBox="0 0 24 24"><use href="#ic-'+n+'"/></svg></i>';
}
/* 有对应图标就换成矢量，没有就原样输出（菜品/商品/房源等图片占位继续用 emoji） */
function icoE(e,s){ var n=iconName(e); return n?ico(n,s):String(e==null?'':e); }
function iconWall(){
  return '<div class="iwall">'+ICON_NAMES.map(function(n){
    return '<div class="iw">'+ico(n,21)+'<span>'+n+'</span></div>';
  }).join('')+'</div>';
}

let tmr=0;
/* ===== v1.3.0 · 自定义昵称：种子作者标识固定，显示名走 state.prof.name ===== */
const ME_SEED='3 栋阿明';
const APP_VER='v1.3.2';
function meName(){return (state.prof&&state.prof.name)||ME_SEED;}
function dispWho(w){return w===ME_SEED?meName():w;}
function dispAv(w,av){return w===ME_SEED?meName().slice(0,1):av;}
function myPosts(){return POSTS.filter(p=>p.who===ME_SEED);}
const AV_COLORS=['#1F5FD6','#0E7C6B','#C9302C','#A86A05','#4B45B8','#0E8F9E','#7A5AF8','#2F3A4F'];
function toast(m){const el=$('#toast');el.textContent=m;el.classList.add('show');clearTimeout(tmr);tmr=setTimeout(()=>el.classList.remove('show'),1800);}
function vibrate(){if(navigator.vibrate)navigator.vibrate(6);}
function ic(text,theme,size){
  const t=TINT[theme]||TINT.blue;
  const s=size||40;
  return `<div class="ic" style="width:${s}px;height:${s}px;background:${t[0]};color:${t[1]}">${icoE(text,Math.round(s*0.52))}</div>`;
}
function findItem(grp,name){for(const c of CATS)for(const g of c.groups)if(g.name===grp||g.key===grp){const it=g.items.find(x=>x.n===name);if(it)return{c,g,it};}return null;}

/* ============ 渲染壳 ============ */
function render(){
  $('#phone').classList.toggle('care',state.care);
  $('#swCare').classList.toggle('on',state.care);
  const authed=state.auth==='done';
  const tabs=['home','hall','circle','profile'];
  const show=authed&&tabs.indexOf(state.page)>=0;
  const tb=$('#tabbar'); tb.hidden=!show;
  if(show){
    tb.innerHTML=[['home','home','首页'],['hall','grid','办事'],['circle','chat','圈子'],['profile','user','我的']]
      .map(([k,i,t])=>`<div class="t ${state.page===k?'on':''}" data-tab="${k}"><i class="tbi">${ico(i,21)}</i>${t}</div>`).join('');
  }
  const map={home:pgHome,hall:pgHall,circle:pgCircle,notice:pgNotice,profile:pgProfile,
    post:pgPost,topic:pgTopic,digest:pgDigest,mine:pgMine,
    map:pgMap,ai:pgAi,kit:pgKit,meal:pgMeal,
    book:pgBook,bill:pgBill,fresh:pgFresh,tool:pgTool,lease:pgLease,
    booking:pgBooking,record:pgRecord,express:pgExpress};
  $('#screen').innerHTML = authed
    ? (map[state.page]||pgHome)()
    : (state.auth==='welcome'?pgWelcome():pgLogin());
  const fw=$('#fabwrap');
  if(fw) fw.innerHTML=(authed&&state.page==='circle')
    ? `<div class="fab2" data-act="post-new">${ico('plus',20)}</div>` : '';
  const ab=$('#aibar');
  if(ab) ab.innerHTML=(authed&&AI_PAGE_CFG[state.page])?aiBarHtml(state.page):'';
  if(authed&&state.page==='map') setTimeout(mountMap,20);
}

/* ============ 首页 ============ */
function pgHome(){
  const quick=[['wrench','报修','家政服务','家电维修'],['bolt','缴费','缴费代办','水电燃气代缴'],
    ['hospital','挂号','基础健康服务','社区门诊挂号'],['bowl','助餐','老年专属服务','助餐']];
  return `<div class="page">
    <div class="hd">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="r1"><div class="lg">猎</div><div class="nm">猎奇便民服务</div>
        ${locBar()}</div>
      <div class="sbox">
        <span style="display:flex;color:#98A2B3">${ico('search',15)}</span>
        <input id="kw" placeholder="搜服务：保洁、助餐、雨伞、租…" value="${esc(state.kw)}">
        <span class="go" data-act="search">搜索</span>
      </div>
      <div class="qk">${quick.map(([i,t,g,n])=>`<div data-act="item" data-g="${g}" data-n="${n}"><b>${ico(i,17)}</b>${t}</div>`).join('')}</div>
    </div>
    <div class="body">
      <div class="sec">
        <div class="st"><b>服务分类</b><em>4 类 · 8 板块 · ${CATS.reduce((a,c)=>a+c.groups.reduce((x,g)=>x+g.items.length,0),0)} 项</em><span class="more" data-tab="hall">全部 ›</span></div>
        <div class="zq">${CATS.map(c=>`<div class="zqc" data-act="cat" data-k="${c.key}">
          <b>${c.full}</b><p>${c.groups.map(g=>g.name).join(' · ')}</p>
          <span class="cnt">${c.groups.reduce((s,g)=>s+g.items.length,0)} 项</span><span class="ar">›</span></div>`).join('')}</div>
      </div>
      <div class="sec">
        <div class="st"><b>常用服务</b><span class="more" data-tab="hall">更多 ›</span></div>
        <div class="card"><div class="g4">${COMMON.map(it=>giHtml(it,'blue')).join('')}</div></div>
      </div>
      <div class="sec">
        <div class="st"><b>附近服务</b><em>按实时定位排序</em><span class="more" data-act="go|map">地图 ›</span></div>
        <div class="card" style="padding:0 12px">
          <div class="row" data-act="go|map"><div class="k" style="background:#EAF1FE;color:${BLUE}">${ico('map',17)}</div>
            <div class="m"><b>社区地图 · ${MAP_POINTS.length} 个点位</b><span>最近 60 m · 共享雨伞 1 号楼大厅</span></div><div class="ar">›</div></div>
          <div class="row" data-act="go|ai"><div class="k" style="background:#EDEAFE;color:${INDIGO}">${ico('chat',17)}</div>
            <div class="m"><b>问 AI 管家</b><span>免费模型在线 · 回答标注来源</span></div>
            <div class="v" style="color:${TEAL};font-size:9px">在线</div><div class="ar">›</div></div>
          <div class="row" data-act="go|meal"><div class="k" style="background:#E8F6EF;color:#0B6146">${ico('bowl',17)}</div>
            <div class="m"><b>智慧配餐 · 今日三餐</b><span>控糖方案 · 1560 kcal · 可换菜</span></div>
            <div class="v" style="color:#0B6146;font-size:9px">新</div><div class="ar">›</div></div>
        </div>
      </div>
      <div class="sec">
        <div class="st"><b>AI 管家提醒</b><em>根据你的工单与社区通知生成</em></div>
        <div class="card" style="padding:0 12px">
          <div class="row" data-act="go|book">
            <div class="k" style="background:#EAF1FE;color:${BLUE}">${ico('wrench',17)}</div>
            <div class="m"><b>你的报修已派单</b><span>师傅预计 14:00 上门 · 点看进度</span></div>
            <div class="ar">›</div></div>
          <div class="row" data-act="go|notice">
            <div class="k" style="background:#FDF3E1;color:${GOLD}">${ico('droplet',17)}</div>
            <div class="m"><b>明天 09:00 起 3 号楼停水</b><span>建议今晚先储水 · 家有老人优先</span></div>
            <div class="ar">›</div></div>
        </div>
      </div>
      <div class="sec" style="margin-bottom:8px">
        <div class="st"><b>社区动态</b><span class="more" data-act="go|notice">全部 ›</span></div>
        <div class="card" style="padding:0 12px">
          ${NOTICES.map(n=>`<div class="row" data-act="go|notice">
            <div class="k" style="background:#F1F4F9"><span class="tag ${n.type}">${n.lb}</span></div>
            <div class="m"><b>${esc(n.t)}</b><span>${esc(n.m)}</span></div><div class="ar">›</div></div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}
function giHtml(it,theme,tag){
  return `<div class="gi" data-act="item" data-g="${esc(it.grpName||'')}" data-n="${esc(it.n)}">
    ${it.bdg?`<span class="bdg">${esc(it.bdg)}</span>`:''}
    ${ic(it.i,it.theme||theme)}
    <span class="n">${esc(it.n)}</span>
    <span class="d">${esc(it.d||'')}</span>
  </div>`;
}

/* ============ 办事（一屏平铺） ============ */
function pgHall(){
  const c=CATS.find(x=>x.key===state.cat)||CATS[0];
  const kw=state.kw.trim();
  const hits=kw?FLAT.filter(it=>it.n.includes(kw)||kw.includes(it.n)||it.grpName.includes(kw)||it.catName.includes(kw)).slice(0,12):[];
  return `<div class="page">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav" style="border-bottom:0">办事大厅</div>
    <div style="background:#fff;padding:0 12px 10px">
      <div class="sbox" style="background:#F2F5FA;border:1px solid var(--line)">
        <span style="display:flex;color:#98A2B3">${ico('search',15)}</span>
        <input id="kw" placeholder="搜服务：保洁、助餐、雨伞、租…" value="${esc(state.kw)}">
        <span class="go" data-act="search">搜索</span>
      </div>
    </div>
    ${kw?'':aiHubHtml()}
    <div class="tb">${CATS.map(x=>`<div class="t ${x.key===c.key?'on':''}" data-act="cat" data-k="${x.key}">${x.name}</div>`).join('')}</div>
    ${kw?`<div class="grp"><div class="gh"><b>搜索「${esc(kw)}」</b><p>命中 ${hits.length} 项</p></div>
      ${hits.length?`<div class="g4">${hits.map(it=>giHtml(it)).join('')}</div>`:`<div class="empty">没找到这项服务，换个词试试</div>`}
      </div>`:
      c.groups.map(g=>`<div class="grp"><div class="gh"><b>${esc(g.name)}</b><p>${esc(g.note||'')} · ${g.items.length} 项</p></div>
        <div class="g4">${g.items.map(it=>giHtml({...it,grpName:g.name},c.theme)).join('')}</div></div>`).join('')}
    <div style="height:14px"></div>
  </div>`;
}

/* ============ 预约登记（每个服务不同选项） ============ */
function pgBook(){
  const b=state.book;
  if(!b) return `<div class="page noTab"><div class="nav"><span class="bk" data-act="back">‹</span>预约</div><div class="empty">请从服务列表进入</div></div>`;
  if(b.done){
    return `<div class="page noTab">
      <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
      <div class="nav"><span class="bk" data-act="back">‹</span>预约已提交</div>
      <div class="rcpt"><div class="ok">${ico('check',16)}</div><h4>${esc(b.svc)}</h4><div class="no">${esc(b.no)}</div>
        <p>${b.opts.length?'服务类型：'+esc(b.opts.join('、'))+'<br>':''}${esc(b.slot)} · ${esc(b.unit)}${b.room?' '+esc(b.room):''}</p></div>
      <div class="blk"><div class="tl">
        ${[['done','已提交',b.svc+' 预约登记'],['now','社区受理中','预计 2 小时内电话确认'],['todo','上门 / 到场','按约定时间提供服务'],['todo','完成并评价','服务结束后邀请评价']]
          .map(([s,t,d])=>`<div class="tl-i ${s}"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">${esc(t)}</div><div class="tl-s">${esc(d)}</div></div></div>`).join('')}
      </div></div>
      <div class="tip">本次只做登记与转派，不含预付费用；师傅上门后按明码标价结算，乱收费可投诉并全额退款。</div>
      <div style="padding:12px"><button class="btn ghost" data-act="back">返回</button></div>
    </div>`;
  }
  const st=b.step||1;
  const slots=['上午 9-11','下午 14-16','傍晚 16-18','周末全天'];
  const slotMeta={'上午 9-11':'余 3 位','下午 14-16':'余 5 位','傍晚 16-18':'余 2 位','周末全天':'余 6 位','--':'已约满'};
  const days=[['今天','10-18'],['明天','10-19'],['周六','10-24']];
  const needOp=b.opts_.length>0&&b.opts.length===0;
  const ready=!needOp&&b.slot&&b.unit;
  const stepBar=`<div class="stp">
    ${[1,2,3].map(n=>{
      const on=st===n, done=st>n;
      const tx=['服务类型','时间','地址确认'][n-1];
      return `${n>1?'<span class="ln"></span>':''}<div class="s ${on?'on':done?'done':''}" data-act="bstp" data-v="${n}">
        <span class="n">${done?ico('check',13):n}</span><span class="tx">${tx}</span></div>`;
    }).join('')}
  </div>`;
  const sumTxt=st===1?(b.opts.length?b.opts.join('、'):'未选服务类型')
    :st===2?(b.slot||'未选时间')
    :(b.unit?b.unit+(b.room?' '+b.room:''):'未选地址');
  const subTxt=st===1?'第 1 步 / 共 3 步':st===2?'第 2 步 / 共 3 步':'上门后按明码标价结算';
  return `<div class="page noTab" style="padding-bottom:0">
    <div class="pgh" style="--h1:#2E6BE0;--h2:#153F9B;padding-bottom:40px">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">${esc(b.svc)}</span>
        <span class="pgh-rt" data-act="sheet-help">服务说明</span></div>
      <div class="pgh-k">
        <div class="pgh-ic">${icoE(b.icon||'🛠',21)}</div>
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">${esc(b.grpName)} · ${esc(b.catName)}</div>
          <div class="pgh-num" style="font-size:19px;letter-spacing:0">${esc(b.svc)}</div>
        </div>
        <div class="pgh-chip">0 元预约</div>
      </div>
    </div>
    <div class="body" style="margin-top:-26px">
      ${stepBar}
      ${st===1?`<div>
        <div class="lbl" style="padding:0 14px">要办哪项 <em>可多选</em></div>
        <div class="ogrid">
          ${b.opts_.map(o=>`<div class="opt ${b.opts.indexOf(o)>=0?'on':''}" data-act="opt" data-v="${esc(o)}">
            <div class="ok2">${b.opts.indexOf(o)>=0?ico('check',12):''}</div>
            <b>${esc(o)}</b><span>约 60 分钟 · 明码标价</span></div>`).join('')}
        </div>
      </div>`:''}
      ${st===2?`<div>
        <div class="lbl" style="padding:0 14px">选日期</div>
        <div class="drow">
          ${days.map(([d,md],i)=>`<div class="dchip ${i===0?'on':''}"><b>${d}</b><span>${md}</span></div>`).join('')}
        </div>
        <div class="lbl" style="padding:14px 14px 0">选时段 <em>师傅上门时间</em></div>
        <div class="tgrid" style="padding-top:8px">
          ${slots.map(sl=>`<div class="ts ${b.slot===sl?'on':''} ${sl==='傍晚 16-18'?'':' '}" data-act="slot" data-v="${esc(sl)}">
            <b>${esc(sl)}</b><span>${esc(slotMeta[sl]||'')}</span></div>`).join('')}
        </div>
      </div>`:''}
      ${st===3?`<div>
        <div class="lbl" style="padding:0 14px">上门地址</div>
        <div class="chips" style="padding:0 12px">
          ${['1 号楼','2 号楼','3 号楼','7 号楼'].map(u=>`<div class="chip ${b.unit===u?'on':''}" data-act="unit" data-v="${esc(u)}">${esc(u)}</div>`).join('')}
        </div>
        <div style="padding:8px 12px 0"><input class="inp" id="room" placeholder="房号（如 2 单元 302）" value="${esc(b.room)}"></div>
        <div class="lbl" style="padding:14px 14px 0">备注 <em>选填</em></div>
        <div style="padding:0 12px"><textarea class="ta" id="note" placeholder="例如：老人在家，请提前打电话">${esc(b.note)}</textarea></div>
        <div class="dash" style="margin-top:12px">
          <div class="d-h"><b>预约摘要</b><em>可返回修改</em></div>
          <div class="tk-r" style="padding:4px 0"><span>服务</span><span>${esc(b.svc)}${b.opts.length?' · '+esc(b.opts.join('、')):''}</span></div>
          <div class="tk-r" style="padding:4px 0"><span>时间</span><span>${esc(b.slot||'待选')}</span></div>
          <div class="tk-r" style="padding:4px 0"><span>地址</span><span>${esc(b.unit||'待选')}${b.room?' '+esc(b.room):''}</span></div>
        </div>
      </div>`:''}
      <div style="height:14px"></div>
    </div>
    <div class="fbar">
      <div class="sum"><b>${esc(sumTxt)}</b>${esc(subTxt)}</div>
      ${st<3
        ? `<div class="btn2" data-act="bstp" data-v="${st+1}">下一步</div>`
        : `<div class="btn2" data-act="book-submit" ${ready?'':'disabled'}>${ready?'提交预约':'请补全信息'}</div>`}
    </div>
  </div>`;
}

/* ============ 缴费代办 ============ */
function pgBill(){
  const total=BILLS.reduce((s,b)=>s+(parseFloat(b.amt)||0),0);
  const max=Math.max(1,...BILLS.map(b=>parseFloat(b.amt)||0));
  return `<div class="page noTab">
    <div class="pgh" style="--h1:#F2A93B;--h2:#A85A08">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">缴费代办</span>
        <span class="pgh-rt" data-act="sheet-help">说明</span></div>
      <div class="pgh-k">
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">本期应缴合计</div>
          <div class="pgh-num"><i>¥</i>${total.toFixed(2)}</div>
        </div>
        <div class="pgh-lb">2 张已出账 · 1 张待绑定<br>资金在微信「生活缴费」完成</div>
        <div class="pgh-chip" data-act="sheet-help">不经手资金 ›</div>
      </div>
    </div>
    <div class="body" style="margin-top:-30px">
      ${BILLS.map((b,i)=>{
        const amt=parseFloat(b.amt)||0, pct=Math.round(amt/max*100), c=TINT[b.c];
        return `<div class="sc" data-act="bill-pay" data-i="${i}">
          <div class="si" style="background:${c[0]};color:${c[1]}">${icoE(b.i,18)}</div>
          <div class="sb">
            <div class="sn">${b.k}<span class="tag ${b.amt==='—'?'warn':'ok'}">${b.amt==='—'?'待绑定':'已出账'}</span></div>
            <div class="sd">户号 ${esc(b.acc)} · ${esc(b.day)}</div>
            <div class="bar"><i style="width:${pct}%;background:${c[1]}"></i></div>
          </div>
          <div class="sa"><b>${b.amt==='—'?'—':'¥'+b.amt}</b><span>${b.amt==='—'?'未绑定':'应缴'}</span></div>
        </div>`;
      }).join('')}
      <div class="dash" style="margin-top:12px">
        <div class="d-h"><b>代办进度</b><em>近 7 天</em></div>
        <div class="tl" style="margin-top:4px">
          <div class="tl-i done"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">代缴登记已提交</div><div class="tl-s">水费 · 10-17 09:12</div></div></div>
          <div class="tl-i now"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">社区代缴中</div><div class="tl-s">预计今天 15:00 前完成，完成后推送凭证</div></div></div>
          <div class="tl-i todo"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">完成</div><div class="tl-s">可在我的 → 代办记录下载电子凭证</div></div></div>
        </div>
      </div>
      <div style="margin:12px 14px 16px;font-size:9px;color:var(--t3);line-height:1.65;text-align:center">
        代缴只做登记与转派，付款在微信「生活缴费」完成；社区不留存你的支付信息。</div>
    </div>
  </div>`;
}

/* ============ 生鲜零售 ============ */
function pgFresh(){
  const tab=state.freshTab, list=SKU[tab]||SKU.veg;
  const cart=state.cart;
  const cnt=Object.keys(cart).reduce((s,k)=>s+cart[k],0);
  let total=0; Object.keys(cart).forEach(k=>{const [t,i]=k.split('#');total+=Number((SKU[t]||[])[Number(i)].p)*cart[k];});
  return `<div class="page noTab" style="padding-bottom:64px">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>生鲜零售</div>
    <div class="tip blue">${ico('scooter',12)} 30 分钟配送到家 · 满 39 元免配送费 · <b>只做预订，不在此支付</b></div>
    <div class="tb" style="margin-top:10px;border-top:1px solid var(--line)">${[['veg','当日鲜菜'],['clear','临期特惠'],['group','邻里拼单'],['pickup','次日自提']]
      .map(([k,t])=>`<div class="t ${tab===k?'on':''}" data-act="ftab" data-v="${k}">${t}</div>`).join('')}</div>
    <div class="sk">${list.map((s,i)=>`<div class="skc">
      ${s.hot?`<span class="hot">${s.hot}</span>`:''}
      <div class="im">${s.e}</div>
      <div class="ib"><div class="nm">${esc(s.n)}</div><div class="ds">${esc(s.d)}</div>
        <div class="pr"><b>¥${s.p}</b><i>/${s.u}</i></div></div>
      ${cart[tab+'#'+i]?`<div class="qty"><i data-act="minus" data-t="${tab}" data-i="${i}">−</i>${cart[tab+'#'+i]}<i data-act="plus" data-t="${tab}" data-i="${i}">+</i></div>`
        :`<div class="add" data-act="plus" data-t="${tab}" data-i="${i}">+</div>`}
    </div>`).join('')}</div>
    <div class="footbar">
      <div style="flex:1"><div style="font-size:10px;color:var(--t3)">已选 ${cnt} 件</div>
        <div style="font-size:15px;font-weight:800;color:var(--red);font-family:ui-monospace,Menlo,monospace">¥${total.toFixed(2)}</div></div>
      <button class="btn" style="width:120px;height:40px" data-act="fresh-submit" ${cnt?'':'disabled'}>提交预订</button>
    </div>
  </div>`;
}

/* ============ 共享设备 ============ */
function pgTool(){
  const t=state.tool||{n:'共享雨伞',spots:'1 号楼大厅 · 南门岗亭 · 3 号楼架空层',free:'24 小时内免费，逾期 0.5 元/天'};
  const b=state.borrowing;
  const pct=b?62:100;
  return `<div class="page noTab">
    <div class="pgh" style="--h1:#12A08A;--h2:#0A6153">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">${esc(t.n)}</span>
        <span class="pgh-rt" data-act="sheet-spot">点位</span></div>
      <div class="pgh-k">
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">${b?'借用中':'本小区可借'}</div>
          <div class="pgh-num">${b?'1<u>件</u>':'6<u>把</u>'}</div>
        </div>
        <div class="pgh-lb">3 个投放点 · 免押金<br>${esc(t.free)}</div>
        <div class="pgh-chip">扫码借用 ›</div>
      </div>
    </div>
    <div class="body" style="margin-top:-30px">
      <div class="dev" style="--tc:#0E7C6B;--p:${pct}">
        <div class="ring">
          <div class="rc"><b>${b?'22:15':'—'}</b><span>${b?'剩余归还时间':'未借用'}</span></div>
        </div>
        <div class="dn">${esc(t.n)}</div>
        <div class="ds">${b?'编号 '+esc(b.no)+' · 可在任意点位归还':esc(t.free)}</div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <div class="btn3 ghost" data-act="sheet-spot">查看点位</div>
          <div class="btn3 solid" data-act="${b?'give-back':'borrow'}">${b?'异地归还':'扫码借用'}</div>
        </div>
        ${b?`<div style="margin-top:9px;font-size:9px;color:var(--t3)" data-act="remind">${ico('bell',12)} 到期提醒已开启 · 提前 1 天 18:00 推送</div>`:''}
      </div>
      <div class="map" style="margin-top:10px"><span class="pin" style="left:24%;top:36%">${ico('pin',13)}</span><span class="pin" style="left:56%;top:26%">${ico('pin',13)}</span><span class="pin" style="left:76%;top:64%">${ico('pin',13)}</span><span class="lg">点位分布 · 3 个投放点</span></div>
      <div class="dash">
        <div class="d-h"><b>借用须知</b><em>免押金</em></div>
        <div style="font-size:10.5px;color:var(--t2);line-height:1.85">
          1. 微信扫码即借，需实名授权；<br>
          2. ${esc(t.free)}；<br>
          3. 任意投放点可异地归还，归还后页面确认；<br>
          4. 损坏或丢失按成本价赔偿（20 元/把）。
        </div>
      </div>
      <div style="margin:12px 14px 16px;font-size:9px;color:var(--t3);line-height:1.65;text-align:center">
        设备由社区统一投放与消毒，问题可在「圈子 → 邻里求助」反馈。</div>
    </div>
  </div>`;
}

/* ============ 房屋租售 ============ */
function pgLease(){
  const list=HOUSES.filter(h=>state.leaseTy==='all'||h.ty===state.leaseTy);
  const grad=['linear-gradient(120deg,#C7D8F6,#8FB0E8)','linear-gradient(120deg,#CFE7E0,#8FC7BA)',
    'linear-gradient(120deg,#E8DCF6,#B9A0E3)','linear-gradient(120deg,#F6E2C8,#E0B57F)'];
  return `<div class="page noTab">
    <div class="pgh" style="--h1:#5B54C9;--h2:#322C88">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">房屋租售</span>
        <span class="pgh-rt" data-act="sheet-want">求租登记</span></div>
      <div class="pgh-k">
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">小区在挂房源</div>
          <div class="pgh-num">${HOUSES.length}<u>套</u></div>
        </div>
        <div class="pgh-lb">全部业主直挂 · 社区已核验<br>不做中介撮合、不收佣金</div>
        <div class="pgh-chip" data-act="sheet-post">我要发布 ›</div>
      </div>
    </div>
    <div class="body" style="margin-top:-30px">
      <div class="seg" style="margin-bottom:10px">
        ${[['all','全部'],['rent','出租'],['sell','出售']].map(([k,t])=>`<div class="g ${state.leaseTy===k?'on':''}" data-act="lty" data-v="${k}">${t}</div>`).join('')}
      </div>
      ${list.map((h,i)=>`<div class="hcard" data-act="house" data-t="${esc(h.t)}">
        <div class="hph" style="background:${grad[i%grad.length]}">
          <span class="hb">${h.ty==='sell'?'出售':'出租'}</span>
          <div class="hp">¥${h.p}<i>${h.u==='万'?' 万':'/'+h.u.replace('元/','')}</i></div>
          <div class="hv">${h.d.split(' · ').slice(0,2).join(' · ')}</div>
        </div>
        <div class="hinfo">
          <div class="ht">${esc(h.t)}</div>
          <div class="hd">${esc(h.d)}</div>
          <div class="htags"><span>已核验</span><span>业主直挂</span><span>可看房</span></div>
        </div>
      </div>`).join('')}
      <div style="margin:12px 14px 16px;font-size:9px;color:var(--t3);line-height:1.65;text-align:center">
        社区只提供信息登记，不做撮合、不收佣金、不代收租金；请勿发布虚假房源。</div>
    </div>
  </div>`;
}

/* ============ 门诊挂号 ============ */
function pgBooking(){
  const b=state.booking;
  if(!b) return pgBackEmpty('挂号');
  if(b.no){
    return `<div class="page noTab">
      <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
      <div class="nav"><span class="bk" data-act="back">‹</span>取号成功</div>
      <div class="rcpt"><div class="ok">${ico('check',16)}</div><h4>${esc(b.dept)} · ${esc(b.doctor)}</h4><div class="no">${esc(b.no)}</div>
        <p>${esc(b.slot)} · 卫生服务站 1 层<br>前面等待 ${b.prev} 人 · 预计 ${b.prev*6} 分钟</p></div>
      <div class="tip">到号前 10 分钟会推送提醒；过号需重新取号。65 岁以上免挂号费。</div>
      <div style="padding:12px"><button class="btn ghost" data-act="booking-reset">重新取号</button></div>
    </div>`;
  }
  return `<div class="page noTab">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>社区门诊挂号</div>
    <div style="padding:0 12px">
      <div class="lbl">1. 选科室</div>
      <div class="chips">${DEPTS.map(d=>`<div class="chip ${b.dept===d.n?'on':''}" data-act="dept" data-v="${esc(d.n)}">${d.e} ${esc(d.n)}</div>`).join('')}</div>
      ${b.dept?`<div class="lbl">2. 选医生</div>
        <div class="blk" style="margin:0;padding:0 12px">${(DOCTORS[b.dept]||[]).map(d=>`<div class="row" data-act="doctor" data-v="${esc(d.n)}">
          <div class="k" style="background:${TINT.teal[0]};color:${TEAL}">${ico('doctor',17)}</div>
          <div class="m"><b>${esc(d.n)}</b><span>${esc(d.t)}</span></div>
          <div class="v" style="color:${b.doctor===d.n?BLUE:'var(--t3)'}">${b.doctor===d.n?ico('check',11)+' 已选':esc(d.q)}</div></div>`).join('')}</div>`:''}
      ${b.doctor?`<div class="lbl">3. 选时段</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">
          ${SLOTS.map((s,i)=>`<div class="chip ${b.slot===s?'on':''}" style="justify-content:center;${i===1?'opacity:.45':''}" data-act="bslot" data-v="${esc(s)}" data-off="${i===1?'1':''}">${esc(s)}</div>`).join('')}
        </div>`:''}
    </div>
    <div style="padding:14px 12px 20px">
      <button class="btn" data-act="take" ${(!b.dept||!b.doctor||!b.slot)?'disabled':''}>
        ${!b.dept?'请先选科室':!b.doctor?'请先选医生':!b.slot?'请先选时段':'确认取号'}</button>
    </div>
  </div>`;
}

/* ============ 健康档案 ============ */
function sparkLine(vals,color){
  const w=300,h=46,p=8;
  const mn=Math.min(...vals)-4, mx=Math.max(...vals)+4;
  const pts=vals.map((v,i)=>[p+i*(w-2*p)/(vals.length-1), h-p-(v-mn)/(mx-mn)*(h-2*p)]);
  const line=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  const area=line+' L'+pts[pts.length-1][0].toFixed(1)+' '+(h-p)+' L'+pts[0][0].toFixed(1)+' '+(h-p)+' Z';
  return `<svg viewBox="0 0 ${w} ${h}" style="height:50px">
    <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".2"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${area}" fill="url(#spk)"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map(q=>`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3" fill="#fff" stroke="${color}" stroke-width="2"></circle>`).join('')}
  </svg>`;
}
function pgRecord(){
  const sbp=[130,132,128];
  return `<div class="page noTab">
    <div class="pgh" style="--h1:#0E8F9E;--h2:#0A5A66">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">健康档案</span>
        <span class="pgh-rt" data-act="go|book">预约测量</span></div>
      <div class="pgh-k">
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">最近血压（收缩压）</div>
          <div class="pgh-num">128<u>mmHg</u></div>
        </div>
        <div class="pgh-lb">近 30 天 3 次测量<br>波动在正常范围</div>
        <div class="pgh-chip">档案 JT** 0917</div>
      </div>
    </div>
    <div class="body" style="margin-top:-30px">
      <div class="dash">
        <div class="d-h"><b>血压趋势</b><em>08-11 → 10-12</em></div>
        ${sparkLine(sbp,'#0E8F9E')}
        <div class="met">
          <div class="m"><b>128/82</b><span>血压 mmHg <i style="background:#E6F5F2;color:#0E7C6B">正常</i></span></div>
          <div class="m"><b>6.1</b><span>血糖 mmol/L <i style="background:#FDF3E1;color:#A86A05">偏高</i></span></div>
          <div class="m"><b>24.3</b><span>BMI <i style="background:#E6F5F2;color:#0E7C6B">正常</i></span></div>
        </div>
      </div>
      <div class="dash">
        <div class="d-h"><b>测量记录</b><em>共 3 次</em></div>
        <div class="tl" style="margin-top:4px">
          <div class="tl-i done"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">2026-10-12 社区义诊</div><div class="tl-s">血压 128/82 · 血糖 6.1</div></div></div>
          <div class="tl-i done"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">2026-09-08 慢病随访</div><div class="tl-s">血压 132/85 · 遵医嘱调整用药</div></div></div>
          <div class="tl-i done"><div class="tl-d"></div><div class="tl-b"><div class="tl-t">2026-08-11 免费测量</div><div class="tl-s">血压 130/84 · 血糖 6.4</div></div></div>
        </div>
      </div>
      <div class="sc" data-act="ask|我的体检报告怎么看？" style="margin-bottom:10px">
        <div class="si" style="background:#EDEAFE;color:#4B45B8">${ico('robot',18)}</div>
        <div class="sb"><div class="sn">问 AI：报告怎么看</div><div class="sd">指标解读 · 不替代医生诊断</div></div>
        <div class="sa"><span style="color:var(--blue);font-weight:800;font-size:10.5px">去问 ›</span></div>
      </div>
      <div style="margin:12px 14px 16px;font-size:9px;color:var(--t3);line-height:1.65;text-align:center">
        数据由社区卫生服务站录入，仅本人与授权家属可见；签约医生 李医生。</div>
    </div>
  </div>`;
}

/* ============ 快递代收 ============ */
function pgExpress(){
  const items=[
    {n:'顺丰 · 文件袋',code:'3-2081',t:'今日 09:12 入库',keep:'免费保管 3 天（剩 2 天）'},
    {n:'中通 · 纸箱',code:'3-2077',t:'昨日 18:40 入库',keep:'免费保管 3 天（剩 1 天）'}
  ];
  return `<div class="page noTab">
    <div class="pgh" style="--h1:#12A08A;--h2:#0A6153">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">快递代收</span>
        <span class="pgh-rt" data-act="sheet-spot">存放点</span></div>
      <div class="pgh-k">
        <div class="pgh-ic">${icoE('📦',21)}</div>
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">1 号楼驿站 · 我的包裹</div>
          <div class="pgh-num">2<u>件在库</u></div>
        </div>
        <div class="pgh-chip" data-act="pickup-order">预约送上门 ›</div>
      </div>
    </div>
    <div class="body" style="margin-top:-30px">
      ${items.map(i=>`<div class="tkt">
        <div class="tk-lb">${esc(i.n)}<span class="tag ok" style="margin-left:auto">可取件</span></div>
        <div class="tk-cd">${esc(i.code)}</div>
        <div class="tk-dl"></div>
        <div class="tk-r"><span>入库时间</span><span>${esc(i.t)}</span></div>
        <div class="tk-r"><span>保管期限</span><span>${esc(i.keep)}</span></div>
        <div class="tk-a">
          <div class="btn3 ghost" data-act="pickup-order">预约送上门</div>
          <div class="btn3 solid" data-act="sheet-spot">我取到了</div>
        </div>
      </div>`).join('')}
      <div class="dash">
        <div class="d-h"><b>驿站信息</b><em>距你 210 m · 8:00-21:00</em></div>
        <div style="font-size:10.5px;color:var(--t2);line-height:1.85">
          无人值守时段可到南门岗亭取；<br>超 3 天未取将由驿站退回快递员；<br>大件请提前打电话让驿站帮搬。
        </div>
      </div>
      <div style="margin:12px 14px 16px;font-size:9px;color:var(--t3);line-height:1.65;text-align:center">
        代收属于便民服务，不代付货款、不拆包；破损请在驿站当场拍照登记。</div>
    </div>
  </div>`;
}

/* ============ 社区圈子 v1.0.7 ============ */
function imgGrid(imgs){
  if(!imgs||!imgs.length) return '';
  const n=imgs.length;
  const cls=n===1?'g1':n===2?'g2':'g3';
  return `<div class="p-img ${cls}">${imgs.map(e=>`<div class="im">${e}<span>示意配图</span></div>`).join('')}</div>`;
}
/* 按类型长出专属信息卡：这是"不空壳"的关键 */
function typeCard(p){
  const x=p.x||{};
  if(p.type==='ask'){
    const s=!!p.solved;
    return `<div class="xc x-ask"><div class="r">
      <span><span class="k">邻里求助</span>${s?'已有邻居帮上了':'还在等邻居搭把手'}</span>
      <span class="sbad">${s?'已解决':'待解决'}</span></div></div>`;
  }
  if(p.type==='road'){
    return `<div class="xc x-road"><div class="r">
      <span><span class="k">路况</span>${esc(x.where||'')}</span>
      <b style="color:${x.stc==='ok'?'#0E7C6B':'#A86A05'};font-size:10.5px">● ${esc(x.st||'')}</b></div>
      ${x.until?`<div style="color:#7A8699;margin-top:3px">${esc(x.until)}</div>`:''}</div>`;
  }
  if(p.type==='sell'){
    const gone=!!x.gone;
    return `<div class="xc x-sell"><div class="r">
      <span><span class="k">闲置</span>${esc(x.cond||'')}</span>
      <b style="color:#4B45B8;font-size:14px">${esc(x.price||'')}</b></div>
      ${x.origin?`<div style="color:#98A2B3;margin-top:2px"><s>${esc(x.origin)}</s></div>`:''}
      ${gone?`<div style="margin-top:5px;color:#0E7C6B;font-weight:800">已被邻居领走</div>`:''}</div>`;
  }
  if(p.type==='event'){
    const j=+(x.join||0),cap=+(x.cap||0);
    const pc=cap?Math.min(100,Math.round(j/cap*100)):0;
    return `<div class="xc x-event"><div class="r">
      <span><span class="k">活动</span>${esc(x.when||'')}</span>
      <b style="color:#0E7C6B">${j} / ${cap} 人</b></div>
      <div style="color:#7A8699;margin-top:3px;display:flex;align-items:center;gap:3px">${ico('pin',11)} ${esc(x.where||'')}</div>
      <div class="pg"><i style="width:${pc}%"></i></div></div>`;
  }
  return '';
}
function postCard(p){
  const liked=!!state.liked[p.id], saved=!!state.saved[p.id];
  return `<div class="post2" data-act="post-open" data-id="${p.id}">
    <div class="p-h">
      <div class="p-av" style="background:${p.c}">${dispAv(p.who,p.av)}</div>
      <div class="p-who">
        <div class="p-nm">${p.pin?'<span class="ptop">置顶</span>':''}${esc(dispWho(p.who))}${p.official?'<span class="p-v">官方</span>':''}</div>
        <div class="p-mt">${esc(p.unit)} · ${esc(p.time)}</div>
      </div>
      <div class="p-more" data-act="post-more" data-id="${p.id}">···</div>
    </div>
    <div class="p-tx">${esc(p.text)}</div>
    ${imgGrid(p.imgs)}
    ${typeCard(p)}
    ${p.tag?`<span class="p-tag">${esc(p.tag)}</span>`:''}
    <div class="p-act">
      <div class="${liked?'on':''}" data-act="like" data-id="${p.id}">${ico('thumb',13)} ${p.likes+(liked?1:0)}</div>
      <div data-act="post-open" data-id="${p.id}">${ico('chat',13)} ${p.comments.length}</div>
      <div class="${saved?'sv':''}" data-act="save" data-id="${p.id}">${saved?ico('star-f',12):ico('star',12)} ${saved?'已收藏':'收藏'}</div>
      <div data-act="share">↗ 转发</div>
    </div>
  </div>`;
}
function feedList(){
  let base=POSTS.filter(p=>state.circleTab==='全部'||p.topic===state.circleTab);
  if(state.feed==='follow') base=base.filter(p=>state.follow[p.who]||p.official);
  if(state.feed==='near') base=base.filter(p=>/^[23] 号/.test(p.unit));
  return base.slice().sort((a,b)=>(b.pin?1:0)-(a.pin?1:0));
}
function pgCircle(){
  const list=feedList();
  const nearN=POSTS.filter(p=>/^[23] 号/.test(p.unit)).length;
  const followN=POSTS.filter(p=>state.follow[p.who]||p.official).length;
  return `<div class="page">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav" style="border-bottom:0">社区圈子<span class="rt" data-act="post-new">＋ 发布</span></div>
    <div class="cbar">
      <div style="width:34px;height:34px;border-radius:9px;background:#DCE8FA;color:#1F5FD6;display:flex;align-items:center;justify-content:center;flex:none">${ico('building',17)}</div>
      <div><b>阳光社区圈子</b><span>1,286 位邻居 · 今日 32 条新动态</span></div>
      <div class="join" data-act="join">已加入</div>
    </div>
    <div class="aidig" data-act="digest">
      <b style="display:flex;align-items:center;gap:4px">${ico('sparkles',13)} AI 今日摘要 <i>32 条动态 → 3 件事</i></b>
      <ul>
        <li>2 号门施工中，早高峰走东门，电动车绕南门坡道。</li>
        <li>西门口路面已修好，不用再绕了。</li>
        <li>周六羽毛球、周日读书会都还能报名。</li>
      </ul>
      <div class="go2">看完整摘要 ›</div>
    </div>
    <div class="ftabs">
      <div class="f ${state.feed==='rec'?'on':''}" data-act="feed" data-v="rec">推荐</div>
      <div class="f ${state.feed==='follow'?'on':''}" data-act="feed" data-v="follow">关注<em>${followN}</em></div>
      <div class="f ${state.feed==='near'?'on':''}" data-act="feed" data-v="near">本楼<em>${nearN}</em></div>
    </div>
    <div class="st" style="margin:12px 12px 0;padding:0 0 6px"><b>话题广场</b><em>${Object.keys(TOPIC_META).length} 个话题</em>
      <span class="more" data-act="digest">AI 摘要 ›</span></div>
    <div class="ctabs">
      ${TOPICS.slice(1).map(t=>`<div class="tc" data-act="topic" data-v="${esc(t)}">
        <b style="display:flex;align-items:center;gap:4px">${icoE(TOPIC_META[t].i,15)} ${t}</b><span>${TOPIC_META[t].m} 人参与</span></div>`).join('')}
    </div>
    ${list.length?list.map(postCard).join(''):`<div class="empty">这个话题下还没有动态，来发第一条</div>`}
    <div style="height:72px"></div>
  </div>`;
}
function pgPost(){
  const p=findPost(state.detail);
  if(!p) return pgBackEmpty('动态详情');
  const liked=!!state.liked[p.id], saved=!!state.saved[p.id], joined=!!state.joined[p.id];
  const x=p.x||{};
  const rel=POSTS.filter(k=>k.id!==p.id&&(k.topic===p.topic||k.type===p.type)).slice(0,2);
  return `<div class="page noTab" style="padding-bottom:56px">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>动态详情<span class="rt" data-act="share">↗ 转发</span></div>
    <div class="post2" style="margin-top:10px">
      <div class="p-h">
        <div class="p-av" style="background:${p.c}">${dispAv(p.who,p.av)}</div>
        <div class="p-who">
          <div class="p-nm">${p.pin?'<span class="ptop">置顶</span>':''}${esc(dispWho(p.who))}${p.official?'<span class="p-v">官方</span>':''}</div>
          <div class="p-mt">${esc(p.unit)} · ${esc(p.time)}</div>
        </div>
      </div>
      <div class="p-tx">${esc(p.text)}</div>
      ${imgGrid(p.imgs)}
      ${typeCard(p)}
      ${p.type==='event'?`<div class="tpbar" style="box-shadow:none;background:#F5FAF8;border:1px solid #D8EDE7" data-act="join-ev" data-id="${p.id}">
        <span style="display:flex;align-items:center;gap:3px">${ico('users',12)} 已有 ${x.join||0} 位邻居报名</span>
        <span class="rt2" style="margin-left:auto">${joined?ico('check',11)+' 已报名':'我要报名 ›'}</span></div>`:''}
      ${p.type==='ask'&&x.best?`<div class="xc x-ask" style="margin-top:8px"><span class="k">采纳回答</span>${esc(x.best)}</div>`:''}
      ${p.tag?`<span class="p-tag">${esc(p.tag)}</span>`:''}
      <div class="p-act">
        <div class="${liked?'on':''}" data-act="like" data-id="${p.id}">${ico('thumb',13)} ${p.likes+(liked?1:0)}</div>
        <div class="${saved?'sv':''}" data-act="save" data-id="${p.id}">${saved?ico('star-f',12):ico('star',12)} ${saved?'已收藏':'收藏'}</div>
        <div data-act="post-more" data-id="${p.id}">··· 更多</div>
      </div>
    </div>
    <div class="cmt">
      <div style="font-size:12.5px;font-weight:800">评论 ${p.comments.length}</div>
      ${p.comments.length?p.comments.map(c=>`<div class="ci" data-act="reply" data-v="${esc(c.w)}">
        <div class="ca" style="background:${c.off?'#1F5FD6':'#7C8BA1'}">${esc(c.w.replace(/^[\d\s栋号楼单元]+/,'').slice(0,1))}</div>
        <div class="cb"><b>${esc(c.w)}${c.off?' <span class="p-v">官方</span>':''}</b>
          <p>${c.re?`<span class="rt2">@${esc(c.re)}</span> `:''}${esc(c.t)}</p><i>${esc(c.m)}</i></div></div>`).join('')
        :`<div style="font-size:10.5px;color:var(--t3);padding:10px 0">还没有评论，来说第一句</div>`}
      <div style="text-align:center;font-size:9.5px;color:var(--t3);padding:10px 0 2px">— 点任意评论可 @ 对方回复 —</div>
    </div>
    ${rel.length?`<div class="oc"><h4 style="display:flex;align-items:center;gap:4px">${ico('pin',13)} 相关动态</h4>
      ${rel.map(r=>`<div class="oi" data-act="post-open" data-id="${r.id}">
        <span class="n">${r.av}</span><div><b>${esc(r.text.slice(0,24))}…</b>
        <p>${esc(r.who)} · ${esc(r.topic)} · ${ico('thumb',11)} ${r.likes}</p></div></div>`).join('')}
    </div>`:''}
    <div style="height:14px"></div>
    <div class="cinput" style="position:sticky;bottom:0">
      ${state.replyTo?`<div class="rtx" data-act="unreply">@${esc(state.replyTo)} ×</div>`:''}
      <input id="cmtIn" placeholder="${state.replyTo?'回复 @'+esc(state.replyTo):'说点什么…'}">
      <button class="send" data-act="cmt-send">发送</button>
    </div>
  </div>`;
}
function pgTopic(){
  const t=state.topic||'路况实况';
  const meta=TOPIC_META[t]||{i:'#',m:0,d:''};
  const on=!!state.topicOn[t];
  const list=POSTS.filter(p=>p.topic===t);
  return `<div class="page noTab">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>话题</div>
    <div class="thd">
      <div style="display:flex;align-items:center;gap:9px">
        <div style="width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid #DCE7FA;display:flex;align-items:center;justify-content:center;flex:none">${icoE(meta.i,19)}</div>
        <div><b style="font-size:13.5px;color:#16407F">#${esc(t)}</b>
          <span style="display:block;font-size:9.5px;color:#5A7096;margin-top:2px">${meta.m} 人参与 · 本话题 ${list.length} 条动态</span></div>
        <div class="jw ${on?'on':''}" data-act="topic-on" data-v="${esc(t)}">${on?'已关注':'＋ 关注'}</div>
      </div>
      <div style="margin-top:9px;font-size:10.5px;color:#3D5372;line-height:1.62">${meta.d}</div>
      <div style="margin-top:10px;display:flex;gap:7px">
        <div style="flex:1;height:31px;border-radius:8px;background:var(--blue);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;cursor:pointer" data-act="topic-post">＋ 参与话题</div>
        <div style="flex:1;height:31px;border-radius:8px;background:#fff;border:1px solid var(--blue);color:var(--blue);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer" data-act="digest">${ico('sparkles',12)} AI 摘要</div>
      </div>
    </div>
    ${list.length?list.map(postCard).join(''):`<div class="empty">这个话题还没有动态，来发第一条</div>`}
    <div style="height:14px"></div>
  </div>`;
}
function pgDigest(){
  const items=[
    {t:'2 号门施工，早高峰改走东门',b:'物业 5 小时前发布，预计 10 月 20 日恢复；电动车改走南门坡道。',s:'来自 1 条官方公告 + 2 条邻居补充',ty:'路况'},
    {t:'西门口路面已修好',b:'2 栋赵哥昨晚实拍，从反馈到修好用了三天。',s:'来自 1 条带图动态',ty:'路况'},
    {t:'两场活动都还能报名',b:'周六 09:00 羽毛球（12/20），周日 15:00 读书会（6/15），都在社区活动室一带。',s:'来自 2 条活动动态',ty:'活动'}
  ];
  return `<div class="page noTab">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>AI 今日摘要</div>
    <div style="margin:10px 12px 0;background:linear-gradient(118deg,#1F5FD6,#3C7BEA);border-radius:11px;padding:13px;color:#fff">
      <div style="font-size:14px;font-weight:800;display:flex;align-items:center;gap:5px">${ico('sparkles',15)} 今天社区发生了 3 件事</div>
      <div style="font-size:10px;opacity:.9;margin-top:5px">共 32 条动态 · 已按「影响你出行 / 能参与 / 与你楼栋相关」筛过 · 08:42 生成</div>
    </div>
    <div class="oc">
      <h4 style="display:flex;align-items:center;gap:4px">${ico('clipboard',13)} 摘要</h4>
      ${items.map((x,i)=>`<div class="oi"><span class="n">${i+1}</span><div>
        <b>${esc(x.t)}</b><p>${esc(x.b)}</p>
        <p style="color:#B0BAC8">${esc(x.s)}</p></div></div>`).join('')}
    </div>
    <div class="oc">
      <h4 style="display:flex;align-items:center;gap:4px">${ico('tag',13)} 值得关注的话题</h4>
      ${TOPICS.slice(1).map(t=>`<div class="oi" data-act="topic" data-v="${esc(t)}">
        <span class="n" style="background:#EEF3FB;color:#1F5FD6">${icoE(TOPIC_META[t].i,14)}</span>
        <div style="flex:1"><b>#${esc(t)}</b><p>${TOPIC_META[t].m} 人参与</p></div>
        <span class="ar" style="color:#98A2B3;font-size:14px">›</span></div>`).join('')}
    </div>
    <div style="margin:10px 12px 14px;font-size:9.5px;color:var(--t3);line-height:1.65">
      AI 只归纳社区内的公开动态，不读取私聊与个人信息；摘要可能不完整，具体以原帖为准。</div>
  </div>`;
}
function pgMine(){
  const tab=state.mineTab||'post';
  const T=[['post','我发的'],['reply','我回复的'],['save','我收藏的']];
  const list=tab==='post'?POSTS.filter(p=>p.who==='3 栋阿明')
    :tab==='reply'?POSTS.filter(p=>p.comments.some(c=>c.w==='阿明'))
    :POSTS.filter(p=>state.saved[p.id]);
  return `<div class="page noTab">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>我的圈子</div>
    <div class="ftabs" style="margin-top:4px">
      ${T.map(([k,n])=>`<div class="f ${tab===k?'on':''}" data-act="mine-tab" data-v="${k}">${n}</div>`).join('')}
    </div>
    ${list.length?list.map(postCard).join(''):`<div class="empty">这里还是空的，去圈子里逛逛</div>`}
    <div style="height:14px"></div>
  </div>`;
}
/* AI 把一句话扩成一条完整动态（按类型不同措辞） */
function aiPolish(t){
  const ty=state.draftType||'ask';
  const base=String(t||'').replace(/[\s。！!，,~、]+$/,'').trim();
  if(!base) return '';
  if(ty==='ask') return `${base}。我在 3 号楼 2 单元，今天 18:00 后都在家，不方便的话我也可以自己上门取，先谢谢邻居们了 🙏`;
  if(ty==='sell') return `${base}。九成新，￥80 出，楼下自提，先到先得；需要的邻居评论区留言，我放 1 号楼门厅，两天没人要就送回收。`;
  if(ty==='event') return `${base}。本周日 15:00，社区活动室 2 楼，人少也开，欢迎带娃带老人一起来，想来的评论区说一声我统计人数。`;
  return `${base}。今天路过看到的，分享给邻居们，出门注意安全。`;
}
function sheetPostNew(){
  const ty=state.draftType||'ask';
  const TY=[['ask','邻里求助'],['share','随手分享'],['sell','闲置转让'],['event','活动召集']];
  const IMGS=['🚲','📦','🪑','🌱','🐱','📖','🏸','🛠','🌇'];
  const ph={ask:'说清要借什么、什么时候用、在哪取',share:'今天在社区看到什么',
    sell:'物品名称、成色、价格、在哪自提',event:'活动内容、时间地点、大概几个人'}[ty];
  openSheet(`<h3>发布动态</h3>
    <div class="chips" style="margin-bottom:9px">
      ${TY.map(([k,n])=>`<div class="chip ${ty===k?'on':''}" data-act="dtype" data-v="${k}">${n}</div>`).join('')}
    </div>
    <textarea class="ta" id="draftIn" placeholder="${ph}" style="min-height:74px">${esc(state.draft)}</textarea>
    ${ty==='sell'?`<div class="it"><span>价格</span><span>￥80</span></div>
      <div class="it"><span>成色 / 交付</span><span>九成新 · 楼下自提</span></div>`:''}
    ${ty==='event'?`<div class="it"><span>时间</span><span>本周日 15:00</span></div>
      <div class="it"><span>地点</span><span>社区活动室 2 楼</span></div>
      <div class="it"><span>人数上限</span><span>15 人</span></div>`:''}
    <div style="font-size:10px;font-weight:700;color:var(--t2);margin:11px 0 0">配图（可选 · 最多 9 张）</div>
    <div class="dgrid">
      ${IMGS.map(e=>`<div class="d ${state.draftImgs.indexOf(e)>=0?'on':''}" data-act="dimg" data-v="${e}">${e}</div>`).join('')}
      <div class="d add" data-act="dimg-more">＋</div>
    </div>
    <div style="font-size:10px;font-weight:700;color:var(--t2);margin:11px 0 6px">话题</div>
    <div class="chips">
      ${TOPICS.slice(1).map(t=>`<div class="chip ${state.draftTopic===t?'on':''}" data-act="dtopic" data-v="${esc(t)}">${t}</div>`).join('')}
    </div>
    <div style="margin-top:10px;font-size:9.5px;color:var(--t3);line-height:1.5">发布后社区内所有邻居可见；请勿发布广告、涉隐私或未经核实的信息。</div>
    <div class="cl ai" data-act="ai-polish">${ico('sparkles',13)} AI 帮我写完整</div>
    <div class="cl p" data-act="post-publish">发布</div>
    <div class="cl" data-act="close">取消</div>`);
}

/* ============ v1.0.8 实时定位 / 社区地图 / AI 问答 / AI 文生图 ============ */
/* 点位坐标：GCJ-02（火星坐标系），广州天河某社区示意点 */
const MAP_POINTS=[
 {id:'m1',n:'社区物业服务中心',d:'1 号楼 1 层',ty:'svc',i:'🏢',c:'#1F5FD6',lat:23.12916,lng:113.26386,walk:'120 m',open:'8:30-18:00'},
 {id:'m2',n:'社区卫生服务站',d:'西门旁 · 全科/慢病',ty:'svc',i:'🩺',c:'#1F5FD6',lat:23.12841,lng:113.26472,walk:'380 m',open:'8:00-21:00'},
 {id:'m3',n:'共享雨伞 · 1 号楼大厅',d:'可借 6 把',ty:'tool',i:'☂️',c:'#0E7C6B',lat:23.12933,lng:113.26452,walk:'60 m',open:'24 小时'},
 {id:'m4',n:'共享充电宝 · 南门岗亭',d:'可借 12 个',ty:'tool',i:'🔋',c:'#0E7C6B',lat:23.12872,lng:113.26362,walk:'210 m',open:'24 小时'},
 {id:'m5',n:'生鲜自提 · 1 号楼驿站',d:'次日自提点',ty:'tool',i:'🥬',c:'#0E7C6B',lat:23.12895,lng:113.26505,walk:'300 m',open:'6:00-21:00'}
];
const ME={lat:23.12894,lng:113.26411,acc:12};
const AI_MODELS=[
 {k:'openai',n:'OpenAI 免费通道',tag:'通用问答'},
 {k:'llama',n:'Llama 免费通道',tag:'长文理解'},
 {k:'mistral',n:'Mistral 免费通道',tag:'响应快'}
];
const AI_SYS='你是"猎奇便民服务"的社区 AI 管家。只回答社区便民、办事指引、健康常识类问题。用中文，分点作答，总数不超过 120 字。涉及医疗必须提醒"以上为健康提示，不替代医生诊断"。不要编造社区电话号码、政策与补贴金额。';
const AI_LOCAL=[
 {k:['雨伞','借伞','共享雨伞'],t:'共享雨伞在 1 号楼大厅和南门岗亭可取，扫码即借，24 小时内免费。归还时放到任意点位即可，超时按 1 元/小时计（以点位公示为准）。',s:['服务指南 · 便民工具','共享设备点位']},
 {k:['水费','电费','燃气','缴费','代缴'],t:'1. 先在「缴费代办」绑定 8 位户号（需短信验证）；2. 绑定后可看欠费金额；3. 付款请到微信「生活缴费」完成，本小程序不经手资金。',s:['缴费代办 · 户号说明','办事材料清单']},
 {k:['血压','血糖','慢病','高血压'],t:'1. 按时服药，不自行停药；2. 低盐饮食，每日食盐少于 5 g；3. 每周至少测 2 次并记录；4. 社区慢病门诊可做随访，建议每 3 个月复诊。以上为健康提示，不替代医生诊断。',s:['健康科普 · 慢病管理','社区卫生服务站']},
 {k:['停水','施工','通知','公告'],t:'明天 09:00-17:00 3 号楼停水，建议今晚先储水；家中有老人的可到物业办公室取水。2 号门道路检修预计两天，早高峰建议走东门。',s:['社区公告 · 10-18','物业服务']},
 {k:['挂号','门诊','疫苗','儿科'],t:'社区卫生服务站 8:00-21:00，全科/慢病/儿科/中医理疗四个门诊。挂号在「基础健康服务 → 社区门诊挂号」，选科室→医生→时段后取号。',s:['基础健康服务 · 门诊排班','卫生服务站']},
 {k:['助餐','吃饭','送餐','食堂'],t:'助餐可送餐上门，午餐 11:00-12:30、晚餐 17:00-18:30 配送。60 岁以上有补贴，需先在「老年专属服务」登记一次。',s:['老年专属服务 · 助餐','补贴政策说明']}
];
const IMG_STYLES=[['写实','photorealistic, natural daylight'],['插画','flat vector illustration, soft pastel'],['扁平','minimal flat design, geometric'],['水彩','watercolor painting, soft edges'],['国潮','chinese guochao illustration']];
const IMG_RATIOS=[['1:1',512,512],['3:4',480,640],['16:9',640,360]];

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
/* ---- 定位胶囊 ---- */
function locBar(force){
  const st=force||(state.loc||{}).st||'locating';
  const cls=st==='locating'?'locating':st==='denied'?'denied':'';
  const dot=st==='locating'?'<span class="lp"></span>':'<span class="ic2">'+ico('pin',12)+'</span>';
  const tx=st==='ok'?'阳光社区 · 3 号楼':st==='locating'?'定位中…':st==='denied'?'未授权 · 点此开启':'阳光社区';
  return `<div class="lb ${cls}" data-act="loc">${dot}<span class="tx">${tx}</span><span class="ch">›</span></div>`;
}
function reLocate(){
  state.loc={st:'locating'}; render(); toast('正在获取当前位置…');
  setTimeout(()=>{
    state.loc={st:'ok',acc:ME.acc};
    if(['home','map','kit','profile'].indexOf(state.page)>=0)render();
    toast('已定位：阳光社区 3 号楼 · 精度 '+ME.acc+' m');
  },1300);
}
function sheetLoc(){
  const ok=(state.loc||{}).st==='ok';
  openSheet(`<h3>实时定位</h3>
    <div style="height:104px;border-radius:10px;overflow:hidden;margin-bottom:8px">${mapFallbackSvg()}</div>
    <div class="it"><span>当前位置</span><span>${ok?'阳光社区 3 号楼 2 单元':'未定位'}</span></div>
    <div class="it"><span>定位方式</span><span>${ok?'GPS + Wi-Fi 融合':'—'}</span></div>
    <div class="it"><span>精度</span><span>${ok?'约 '+ME.acc+' m':'—'}</span></div>
    <div class="cl p" data-act="relocate">重新定位</div>
    <div class="cl" data-act="sheet-block">手动选择其他小区</div>
    <div style="margin-top:9px;font-size:9px;color:var(--t3);line-height:1.6">
      位置只用于匹配就近服务与点位排序，不保存轨迹、不对其他居民展示。可在系统设置里随时关闭。</div>
    <div class="cl" data-act="close">关闭</div>`);
}
/* ---- 地图 ---- */
function mapFallbackSvg(){
  return `<svg viewBox="0 0 375 238" preserveAspectRatio="none">
    <rect width="375" height="238" fill="#EAEFF6"/>
    <rect x="-10" y="-10" width="152" height="118" fill="#E3EDE4"/>
    <rect x="246" y="152" width="146" height="100" fill="#E3EDE4"/>
    <path d="M-10 122 L385 98" stroke="#fff" stroke-width="15"/>
    <path d="M-10 180 L385 172" stroke="#fff" stroke-width="9"/>
    <path d="M134 -10 L152 248" stroke="#fff" stroke-width="9"/>
    <path d="M270 -10 L288 248" stroke="#fff" stroke-width="7"/>
    <rect x="18" y="16" width="88" height="54" rx="4" fill="#DBE4EF"/>
    <rect x="176" y="12" width="78" height="68" rx="4" fill="#DBE4EF"/>
    <rect x="302" y="18" width="62" height="56" rx="4" fill="#DBE4EF"/>
    <rect x="166" y="134" width="88" height="26" rx="4" fill="#DBE4EF"/>
    <rect x="302" y="122" width="64" height="34" rx="4" fill="#DBE4EF"/>
    <text x="26" y="150" font-size="8" fill="#9AA6B6">中心花园</text>
    <circle cx="150" cy="110" r="16" fill="#1F5FD6" opacity="0.14"/>
    <circle cx="150" cy="110" r="5.5" fill="#1F5FD6" stroke="#fff" stroke-width="2"/>
    <circle cx="266" cy="70" r="4.5" fill="#1F5FD6" stroke="#fff" stroke-width="1.8"/>
    <circle cx="92" cy="192" r="4.5" fill="#0E7C6B" stroke="#fff" stroke-width="1.8"/>
    <circle cx="312" cy="60" r="4.5" fill="#0E7C6B" stroke="#fff" stroke-width="1.8"/>
  </svg>`;
}
let tmap=null;
function mountMap(){
  const box=document.getElementById('tmapBox'),fb=document.getElementById('tmapFb');
  if(!box)return;
  if(state.mapSchematic){box.style.display='none';if(fb)fb.style.display='block';return;}
  if(typeof TMap==='undefined'||!TMap.Map){box.style.display='none';if(fb)fb.style.display='block';return;}
  if(fb)fb.style.display='none'; box.style.display='block';
  try{
    if(tmap){try{tmap.destroy();}catch(e){} tmap=null;}
    tmap=new TMap.Map('tmapBox',{center:new TMap.LatLng(ME.lat,ME.lng),zoom:16.2,showControl:false});
    const pin=c=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 35C14 35 26 20.5 26 12.5A12 12 0 1 0 2 12.5C2 20.5 14 35 14 35Z" fill="'+c+'" stroke="#fff" stroke-width="2.4"/><circle cx="14" cy="12.5" r="4.6" fill="#fff"/></svg>');
    const styles={
      svc:new TMap.MarkerStyle({width:26,height:34,anchor:{x:13,y:34},src:pin('#1F5FD6')}),
      tool:new TMap.MarkerStyle({width:26,height:34,anchor:{x:13,y:34},src:pin('#0E7C6B')}),
      me:new TMap.MarkerStyle({width:18,height:18,anchor:{x:9,y:9},src:pin('#C9302C')})
    };
    const geo=[{id:'me',styleId:'me',position:new TMap.LatLng(ME.lat,ME.lng)}]
      .concat(MAP_POINTS.map(p=>({id:p.id,styleId:p.ty,position:new TMap.LatLng(p.lat,p.lng)})));
    new TMap.MultiMarker({map:tmap,styles,geometries:geo});
  }catch(e){
    box.style.display='none'; if(fb)fb.style.display='block';
  }
}
function pgMap(){
  const ty=state.mapTy||'all';
  const list=MAP_POINTS.filter(p=>ty==='all'||p.ty===ty);
  return `<div class="page noTab" style="padding-bottom:10px">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>社区地图
      <span class="rt" data-act="relocate">${(state.loc||{}).st==='ok'?'重新定位':'定位'}</span></div>
    <div class="mapcard">
      <div id="tmapBox" class="tmapbox"></div>
      <div id="tmapFb" class="tmapfb">${mapFallbackSvg()}</div>
      <div class="mapbar">
        <div class="mc ${ty==='all'?'on':''}" data-act="map-ty" data-v="all">全部</div>
        <div class="mc ${ty==='svc'?'on':''}" data-act="map-ty" data-v="svc">服务点</div>
        <div class="mc ${ty==='tool'?'on':''}" data-act="map-ty" data-v="tool">便民设备</div>
      </div>
      <div class="maplegend"><i style="background:#1F5FD6"></i>服务点<br><i style="background:#0E7C6B"></i>便民设备<br><i style="background:#C9302C"></i>我的位置</div>
      <div class="mfab" data-act="relocate">${ico('disc',16)}</div>
      <div class="mscale" data-act="map-mode">${state.mapSchematic?'示意底图 ⇄':'矢量底图 ⇄'}</div>
    </div>
    <div class="st" style="margin:12px 12px 0;padding:0 0 6px"><b>附近 ${list.length} 个点位</b><em>按步行距离排序</em></div>
    <div class="poi">
      ${list.map(p=>`<div class="pi" data-act="poi" data-id="${p.id}">
        <div class="pd" style="background:${p.c}1F;color:${p.c}">${icoE(p.i,18)}</div>
        <div><div class="pn">${esc(p.n)}</div><div class="ps">${esc(p.d)} · ${esc(p.open)}</div></div>
        <div class="pw">${esc(p.walk)}<br><span style="font-weight:400;color:var(--t3)">步行</span></div>
      </div>`).join('')}
    </div>
    <div class="aifoot">坐标采用 GCJ-02 火星坐标系，底图由腾讯位置服务提供。<br>位置仅用于就近匹配，不保存轨迹、不对其他居民展示。</div>
  </div>`;
}
function poiSheet(id){
  const p=MAP_POINTS.find(x=>x.id===id); if(!p)return;
  openSheet(`<h3>${esc(p.n)}</h3>
    <div class="it"><span>位置</span><span>${esc(p.d)}</span></div>
    <div class="it"><span>距离</span><span>${esc(p.walk)} · 步行约 ${Math.max(1,Math.round(parseInt(p.walk)/70))} 分钟</span></div>
    <div class="it"><span>开放时间</span><span>${esc(p.open)}</span></div>
    <div class="cl p" data-act="nav-to">打开地图导航</div>
    <div class="cl" data-act="close">关闭</div>`);
}
/* ---- AI 问答 ---- */
function citesFor(q){
  const out=[];
  if(/雨伞|共享|借/.test(q))out.push('服务指南 · 便民工具');
  if(/水费|电费|燃气|缴费|代缴/.test(q))out.push('缴费代办 · 户号说明');
  if(/血压|血糖|慢病|体检|健康/.test(q))out.push('健康科普 · 慢病管理');
  if(/停水|施工|公告|通知/.test(q))out.push('社区公告 · 10-18');
  if(/挂号|门诊|疫苗/.test(q))out.push('基础健康服务 · 门诊排班');
  if(/助餐|送餐|食堂/.test(q))out.push('老年专属服务 · 助餐');
  return out.length?out:['社区服务目录 v1.0.8'];
}
function localAnswer(q){
  for(const f of AI_LOCAL) if(f.k.some(k=>q.indexOf(k)>=0)) return {text:f.t,cites:f.s};
  return {text:'这个问题建议转人工确认。你可以：1) 在「办事」里按服务名搜索；2) 打开「社区地图」看附近点位；3) 把问题发到「圈子 → 邻里求助」，通常半小时内有邻居回复。',cites:['社区服务目录 v1.0.8']};
}
async function aiFree(model,messages){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),16000);
  try{
    const res=await fetch('https://text.pollinations.ai/openai',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:model||'openai',messages,max_tokens:420}),
      signal:ctl.signal});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const j=await res.json();
    const t=(((j.choices||[])[0]||{}).message||{}).content||'';
    if(!String(t).trim())throw new Error('empty');
    return String(t).trim();
  } finally { clearTimeout(to); }
}
async function aiAsk(q){
  q=String(q||'').trim();
  if(!q||state.aiBusy)return;
  if(state.aiTab!=='chat')state.aiTab='chat';
  state.msgs.push({r:'u',t:q});
  const a={r:'a',t:'',steps:[],cites:[],pending:true,model:state.aiModel,ms:0,fb:false};
  state.msgs.push(a);
  state.aiBusy=true; render();
  const t0=Date.now();
  const job=state.offline
    ? Promise.reject(new Error('offline'))
    : aiFree(state.aiModel,[{role:'system',content:AI_SYS},{role:'user',content:q}]);
  job.catch(()=>{});
  const steps=['理解问题 · 识别服务意图',
    state.offline?'检索本地知识库':'调用免费模型 · 并行检索社区知识库',
    '组织回答并标注来源'];
  for(const s of steps){
    a.steps.push({t:s,done:false}); render(); await sleep(340);
    a.steps[a.steps.length-1].done=true; render(); await sleep(90);
  }
  try{
    const t=await job;
    a.t=t; a.cites=citesFor(q);
  }catch(e){
    const f=localAnswer(q); a.t=f.text; a.cites=f.cites; a.fb=true;
  }
  a.pending=false; a.ms=Date.now()-t0; state.aiBusy=false; render();
}
function aiMsg(m){
  if(m.r==='u') return `<div class="msg u"><div class="bub">${esc(m.t)}</div></div>`;
  const md=AI_MODELS.find(x=>x.k===m.model)||AI_MODELS[0];
  return `<div class="msg a"><div class="bub">
    <div class="mtag"><b>${esc(md.n)}</b>${m.pending?'思考中…':((m.ms||0)/1000).toFixed(1)+'s'}${m.fb?' · 本地知识库':''}</div>
    ${m.steps&&m.steps.length?`<div class="think">${m.steps.map(s=>`<div class="${s.done?'done':''}"><span class="ok2">${s.done?ico('check',10):'○'}</span>${esc(s.t)}</div>`).join('')}</div>`:''}
    ${m.t?`<div style="white-space:pre-wrap">${esc(m.t)}</div>`:''}
    ${m.cites&&m.cites.length?`<div class="cites">${m.cites.map(c=>`<span>${ico('clip',10)} ${esc(c)}</span>`).join('')}</div>`:''}
    ${m.fb?`<div class="warn2">免费模型通道暂时不可用，已用本地知识库作答；具体以社区公告与服务指南为准。</div>`:''}
    ${!m.pending?`<div class="sug">${['要带什么材料','在哪办','几点下班'].map(s=>`<div data-act="ai-ask" data-q="${esc(s)}">${esc(s)}</div>`).join('')}</div>`:''}
  </div></div>`;
}
function aiWelcome(){
  return `<div class="card" style="margin:0;padding:13px">
    <div style="font-size:13px;font-weight:800;display:flex;align-items:center;gap:5px">${ico('robot',16)} 我是社区 AI 管家</div>
    <div style="font-size:10.5px;color:var(--t2);line-height:1.68;margin-top:5px">
      能查办事材料、指路找点位、解释健康指标。回答会标注来源；涉及医疗只做提示，不替代医生诊断。</div>
    <div class="sug" style="margin-top:9px">
      ${['共享雨伞怎么借？','水费怎么代缴？','血压偏高要注意什么？','小孩打疫苗在哪？'].map(q=>`<div data-act="ai-ask" data-q="${esc(q)}">${esc(q)}</div>`).join('')}
    </div>
  </div>`;
}
function aiChatHtml(){
  const m=state.msgs||[];
  return `<div class="aichat">
    ${m.length?m.map(aiMsg).join(''):aiWelcome()}
    <div style="height:6px"></div>
    <div class="aifoot" style="padding-bottom:8px">${state.offline?ico('warn',11)+' 当前离线，使用本地知识库作答':'回答由免费模型生成，可能不准确；办事以指南为准'}</div>
  </div>
  <div class="aiask">
    <div class="voice" data-act="ai-voice">${ico('mic',18)}</div>
    <input id="aiIn" placeholder="问点什么：雨伞怎么借、血压高怎么办…">
    <button class="send" data-act="ai-send" ${state.aiBusy?'disabled':''}>${state.aiBusy?'…':'发送'}</button>
  </div>`;
}
/* ---- AI 文生图 ---- */
function imgUrl(q,sty,w,h,seed){
  const p=encodeURIComponent(q+', '+sty+', clean composition, no text, no watermark');
  return `https://image.pollinations.ai/prompt/${p}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
}
function aiImgHtml(){
  const st=state.imgStyle||'写实',ra=state.imgRatio||'1:1';
  return `<div class="igen">
    <textarea class="ta" id="imgQ" placeholder="描述你想要的画面，例如：社区花园里的橘猫，午后阳光斜照">${esc(state.imgPrompt||'')}</textarea>
    <div style="font-size:10px;font-weight:700;color:var(--t2);margin:9px 0 0">风格</div>
    <div class="styrow">${IMG_STYLES.map(([k])=>`<div class="sty ${st===k?'on':''}" data-act="img-style" data-v="${k}">${k}</div>`).join('')}</div>
    <div style="font-size:10px;font-weight:700;color:var(--t2);margin:9px 0 0">比例</div>
    <div class="styrow">${IMG_RATIOS.map(([k])=>`<div class="sty ${ra===k?'on':''}" data-act="img-ratio" data-v="${k}">${k}</div>`).join('')}</div>
    <div style="margin-top:11px;height:38px;border-radius:9px;background:var(--blue);color:#fff;font-size:12.5px;font-weight:800;
      display:flex;align-items:center;justify-content:center;cursor:pointer" data-act="img-gen">${ico('sparkles',13)} ${state.imgBusy?'正在生成…':'生成 4 张图'}</div>
    ${state.imgBusy?`<div class="igrid">${[1,2,3,4].map(()=>'<div class="cell skel"></div>').join('')}</div>`:''}
    ${!state.imgBusy&&state.imgs.length?`<div class="igrid">${state.imgs.map(im=>`<div class="cell">
      <span class="bad">${esc(im.tag)}</span>
      <img src="${im.u}" alt="AI 生成图片" loading="lazy"></div>`).join('')}</div>`:''}
    ${!state.imgBusy&&!state.imgs.length?`<div class="igrid">${[1,2,3,4].map(()=>'<div class="cell"><div class="ph">'+ico('image',22)+'</div></div>').join('')}</div>`:''}
    <div class="aifoot">免费图像模型生成，约 2-6 秒 · 仅用于配图示意<br>不用于医疗、证件、人脸场景；图片只存在本机</div>
  </div>`;
}
function pgAi(){
  const tab=state.aiTab||'chat';
  const md=AI_MODELS.find(x=>x.k===state.aiModel)||AI_MODELS[0];
  return `<div class="page noTab" style="padding-bottom:0">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>AI 助手
      <span class="rt" data-act="ai-model" style="font-size:9.5px">${ico('bolt',11)} ${esc(md.n.replace(' 免费通道',''))} ▾</span></div>
    <div class="ftabs" style="margin:2px 12px 0">
      <div class="f ${tab==='chat'?'on':''}" data-act="ai-tab" data-v="chat">智能问答</div>
      <div class="f ${tab==='img'?'on':''}" data-act="ai-tab" data-v="img">AI 文生图</div>
    </div>
    ${tab==='chat'?aiChatHtml():aiImgHtml()}
  </div>`;
}
function sheetAiModel(){
  openSheet(`<h3>选择模型 · 全部免费</h3>
    ${AI_MODELS.map(m=>`<div class="it" data-act="ai-pick" data-v="${m.k}">
      <span>${esc(m.n)}<br><span style="font-size:9px;color:var(--t3)">${esc(m.tag)}</span></span>
      <span style="font-size:9px;color:var(--blue);font-weight:800">${state.aiModel===m.k?ico('check',10)+' 已选':'免费'}</span></div>`).join('')}
    <div style="margin-top:9px;font-size:9px;color:var(--t3);line-height:1.6">
      演示环境直连免费公开通道；正式上线改为「小程序 → 云函数 → 模型 API」，密钥只放云函数环境变量。</div>
    <div class="cl" data-act="close">关闭</div>`);
}
/* ---- 组件库页 ---- */
function pgKit(){
  const locStates=[['locating','定位中'],['ok','已定位'],['denied','未授权'],['manual','手选小区']];
  return `<div class="page noTab">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back">‹</span>组件库 · 本轮新增</div>
    <div style="margin:11px 12px 0;font-size:10.5px;color:var(--t2);line-height:1.68">
      先定组件、再落页面。下面是 4 个新组件的<b>全部视觉状态</b>与规格，首页/地图页/AI 页里用的就是它们。</div>

    <div class="kitsec"><div class="kh"><b>1 · LocBar 实时定位</b><em>首页右上角</em></div>
      <div class="kitbox">
        ${locStates.map(([k,n])=>`<div class="kitrow"><div class="cl2">${n}</div>
          <div class="demo"><div class="darker" style="display:flex">${locBar(k)}</div></div></div>`).join('')}
        <div class="spec"><b>规格</b> 高 26px · 圆角 99px · 字号 9.5px/700 · 内边距 0 8px<br>
          <b>颜色</b> 底 rgba(255,255,255,.16) · 描边 rgba(255,255,255,.32) · 未授权 #FFC400 22%<br>
          <b>交互</b> 点击 → 定位面板（重新定位 / 手选小区 / 隐私说明）<br>
          <b>状态机</b> locating →(1.3s)→ ok；denied 走系统授权引导</div>
      </div>
    </div>

    <div class="kitsec"><div class="kh"><b>2 · MapCard 地图卡</b><em>社区地图页</em></div>
      <div class="kitbox">
        <div style="position:relative;height:126px;border-radius:9px;overflow:hidden">${mapFallbackSvg()}
          <div class="mapbar" style="left:7px;top:7px"><div class="mc on">全部</div><div class="mc">服务点</div><div class="mc">便民设备</div></div>
          <div class="maplegend" style="right:7px;top:7px"><i style="background:#1F5FD6"></i>服务点<br><i style="background:#C9302C"></i>我的位置</div>
          <div class="mfab" style="right:7px;bottom:9px;width:26px;height:26px;font-size:0">${ico('disc',14)}</div>
          <div class="mscale" style="left:7px;bottom:6px">50 m</div>
        </div>
        <div class="spec"><b>规格</b> 高 238px · 圆角 12px · 标记 26×34px（白描边 2.4px）· 我的位置 18px<br>
          <b>图层</b> 真实底图（腾讯位置服务 GL，GCJ-02）／示意底图 可切换<br>
          <b>交互</b> 分类筛选 · 点击点位 → 详情卡 · 右下 FAB 重新定位 · 左下比例尺兼底图切换</div>
      </div>
    </div>

    <div class="kitsec"><div class="kh"><b>3 · AiBubble AI 回答</b><em>AI 助手 / 智能问答</em></div>
      <div class="kitbox" style="padding-bottom:4px">
        <div style="transform:scale(.96);transform-origin:top left;width:104%">
          ${aiMsg({r:'u',t:'共享雨伞怎么借？'})}
          ${aiMsg({r:'a',model:'openai',pending:true,ms:0,steps:[{t:'理解问题 · 识别服务意图',done:true},{t:'调用免费模型 · 并行检索社区知识库',done:false}],cites:[],t:''})}
          ${aiMsg({r:'a',model:'openai',ms:4200,steps:[{t:'理解问题 · 识别服务意图',done:true},{t:'调用免费模型 · 并行检索社区知识库',done:true},{t:'组织回答并标注来源',done:true}],cites:['服务指南 · 便民工具'],t:'1. 在 1 号楼大厅或南门岗亭扫码；\n2. 24 小时内免费，超时 1 元/小时；\n3. 归还到任意点位即可。'})}
          ${aiMsg({r:'a',model:'openai',ms:1200,fb:true,steps:[{t:'检索本地知识库',done:true}],cites:['服务指南 · 便民工具'],t:'（降级态）免费模型不可用时，用本地知识库作答，并明确标注来源。'})}
        </div>
        <div class="spec"><b>规格</b> 气泡最大宽 88% · 圆角 12px（对话侧 4px）· 正文 12px/1.68<br>
          <b>结构</b> 模型标签 → 思考步骤（虚线左边框）→ 正文 → 来源 chips → 建议追问<br>
          <b>状态</b> 思考中 / 已答（带耗时）/ 本地降级（金色提示条）</div>
      </div>
    </div>

    <div class="kitsec"><div class="kh"><b>4 · AiImage AI 文生图</b><em>AI 助手 / 文生图</em></div>
      <div class="kitbox">
        <div class="igrid" style="margin-top:0">
          <div class="cell"><div class="ph">${ico('image',22)}</div></div><div class="cell skel"></div>
          <div class="cell"><img src="${imgUrl('community garden cat','photorealistic, natural daylight',256,256,7)}" alt=""></div>
          <div class="cell"><img src="${imgUrl('community garden cat','flat vector illustration, soft pastel',256,256,11)}" alt=""></div>
        </div>
        <div style="display:flex;gap:5px;margin-top:6px;font-size:8.5px;color:var(--t3)">
          <span style="flex:1;text-align:center">空态</span><span style="flex:1;text-align:center">生成中骨架</span>
          <span style="flex:1;text-align:center">写实</span><span style="flex:1;text-align:center">插画</span></div>
        <div class="spec"><b>规格</b> 2 列 · 间距 6px · 1:1（另支持 3:4 / 16:9）· 圆角 9px · 角标 7.5px<br>
          <b>参数</b> 5 种风格 · 3 种比例 · 一次出 4 张（seed 随机）<br>
          <b>兜底</b> 加载失败保留占位块，不出现裂图</div>
      </div>
    </div>

    <div class="kitsec"><div class="kh"><b>5 · 图标 + 原子组件</b><em>iconfont 风格 · Ant Design Mobile 规范</em></div>
      <div class="kitbox">
        <div style="font-size:10px;font-weight:700;color:var(--t2);margin-bottom:4px">83 枚线性图标 · 24×24 网格 · 描边 1.9px · 圆头圆角 · 随字色变化</div>
        ${iconWall()}
        <div class="spec" style="margin-bottom:8px"><b>为什么自绘</b> 原型要能离线打开，CDN 字体加载不到就会退化成方框；
          这里用内联 <code>&lt;symbol&gt;</code> + <code>&lt;use&gt;</code>，等价于 iconfont 的 Symbol 引用方式，进小程序时换成 iconfont 字体文件即可，路径不用改。</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 8px">
          <span class="abtn abtn-p abtn-s">主按钮</span>
          <span class="abtn abtn-d abtn-s">次按钮</span>
          <span class="abtn abtn-f abtn-s">默认</span>
          <span class="abtn abtn-p abtn-s dis">禁用</span>
        </div>
        <div class="atagrow" style="margin-bottom:8px">
          <span class="atag">办理中</span><span class="atag g">已完成</span>
          <span class="atag y">待支付</span><span class="atag r">已驳回</span>
          <span class="atag o">可选</span>
        </div>
        <div class="acell"><div class="acell-i">${ico('clipboard',20)}</div>
          <div><div class="acell-t">办事进度查询</div><div class="acell-d">按事项编号或身份证查</div></div>
          <div class="acell-a">›</div></div>
        <div class="acell"><div class="acell-i">${ico('bell',20)}</div>
          <div><div class="acell-t">到期提醒</div><div class="acell-d">提前 1 天 18:00 推送</div></div>
          <div class="asw on"></div></div>
        <div style="display:flex;align-items:center;gap:8px;margin:10px 0 2px">
          <div class="abar" style="flex:1"><i style="width:72%"></i></div>
          <span style="font-size:9px;color:var(--t3)">72%</span>
        </div>
        <div class="spec" style="margin-top:8px"><b>按钮</b> 高 40（大 46 · 小 28）· 圆角 8 · 字号 14/600 · 按压缩放 .98<br>
          <b>标签</b> 圆角 4 · 字号 10/600 · 5 种语义色（蓝/绿/黄/红/描边）<br>
          <b>单元格</b> 最小高 48 · 图标 24 · 标题 14/500 · 描述 11.5 · 右箭头 17<br>
          <b>开关</b> 44×26 · 滑块 22 · 开启 #1FA97A；<b>进度条</b> 高 6 · 圆角 99</div>
      </div>
    </div>

    <div class="kitsec"><div class="kh"><b>6 · 页面原型</b><em>5 种骨架，功能决定用哪种</em></div>
      <div class="kitbox">
        ${[
          ['P1','向导型 Stepper','#1F5FD6','三段进度 · 一屏一步 · 底部浮动条','家政 / 助餐 / 助浴 / 适老化改造'],
          ['P2','票据型 Ticket','#0E7C6B','大字单据号 · 齿孔虚线 · 双按钮','快递代收 · 预约回执'],
          ['P3','数据型 Dashboard','#0E8F9E','KPI 大数字 · 折线 · 指标卡','健康档案 · 借用统计'],
          ['P4','卡片流 Stream','#F2A93B','一卡一项 · 占比条 · 金额右对齐','缴费账单 · 房源列表'],
          ['P5','设备型 Device','#12A08A','状态环 · 剩余时间 · 点位图','共享雨伞 · 充电宝']
        ].map(([k,n,c,d,use])=>`<div class="kitrow" style="align-items:flex-start">
          <div class="cl2" style="color:${c};font-weight:800;padding-top:2px">${k}</div>
          <div style="flex:1">
            <div style="font-size:11.5px;font-weight:800">${n}</div>
            <div style="font-size:9px;color:var(--t3);margin-top:2px;line-height:1.5">${d}</div>
            <div style="font-size:8.5px;color:${c};margin-top:3px">用在：${use}</div>
          </div></div>`).join('')}
        <div class="spec"><b>为什么这样分</b> 骨架应该由「用户要做的判断」决定：<br>
          要选好几项才能提交 → 向导（P1）；只要核对一个数字 → 票据（P2）；<br>
          要看趋势和异常 → 看板（P3）；要在多个同类里挑一个 → 卡片流（P4）；<br>
          要确认一个东西现在什么状态 → 设备环（P5）。</div>
      </div>
    </div>
    <div class="kitsec" style="margin-bottom:14px"><div class="kh"><b>8 · Token</b><em>沿用既有体系</em></div>
      <div class="kitbox">
        <div class="tokrow"><i style="background:#1F5FD6"></i>主色 #1F5FD6（政务蓝）</div>
        <div class="tokrow"><i style="background:#0E7C6B"></i>设备/活动 #0E7C6B</div>
        <div class="tokrow"><i style="background:#C9302C"></i>警示/我的位置 #C9302C</div>
        <div class="tokrow"><i style="background:#F3F5F9"></i>页面底 #F3F5F9</div>
        <div class="spec"><b>字号</b> 9 / 9.5 / 10.5 / 12 / 12.5 / 14 / 16<br>
          <b>圆角</b> 4（标签）· 8（chip）· 9-11（卡片）· 12（气泡/地图）· 99（胶囊）<br>
          <b>间距</b> 4 的倍数：5 / 6 / 7 / 9 / 10 / 11 / 12<br>
          <b>阴影</b> 卡片 0 1px 3px rgba(16,32,64,.06)</div>
      </div>
    </div>
  </div>`;
}


/* ============ v1.1.0 智慧配餐（P6 组合型） ============ */
const MEAL_GOALS=[
 {k:'sugar',n:'控糖',d:'低 GI · 少精制糖',c:'#1F5FD6',kcal:1600,na:1600},
 {k:'bp',n:'控压',d:'低钠 · 高钾',c:'#C9302C',kcal:1700,na:1300},
 {k:'fat',n:'减脂',d:'高蛋白 · 控油',c:'#0E7C6B',kcal:1400,na:1800},
 {k:'post',n:'术后恢复',d:'高蛋白 · 易消化',c:'#A86A05',kcal:1800,na:1500},
 {k:'elder',n:'老年软食',d:'软烂 · 少骨刺',c:'#4B45B8',kcal:1500,na:1400}
];
const GOAL_TAG={sugar:'低GI',bp:'低钠',fat:'高蛋白',post:'软食',elder:'软食'};
const MEAL_TABOO=['素食','海鲜','牛肉','蛋奶','辛辣'];
const DISHES=[
 {id:'b1',meal:'b',n:'燕麦牛奶粥 + 水煮蛋',e:'🥣',kcal:290,p:13,c:38,f:7,na:150,tags:['低GI','软食','奶','蛋'],ing:['燕麦 40g','牛奶 250ml','鸡蛋 1 个']},
 {id:'b2',meal:'b',n:'杂粮馒头 + 无糖豆浆',e:'🥟',kcal:300,p:14,c:45,f:6,na:260,tags:['低GI','豆制品'],ing:['杂粮馒头 2 个','黄豆 30g']},
 {id:'b3',meal:'b',n:'小米南瓜粥 + 拌黄瓜',e:'🎃',kcal:240,p:7,c:42,f:4,na:180,tags:['低GI','软食','素食'],ing:['小米 40g','南瓜 150g','黄瓜 1 根']},
 {id:'b4',meal:'b',n:'全麦三明治 + 无糖酸奶',e:'🥪',kcal:330,p:16,c:40,f:10,na:390,tags:['高蛋白','奶','蛋'],ing:['全麦面包 2 片','鸡胸 60g','酸奶 150g']},
 {id:'b5',meal:'b',n:'清汤素面 + 青菜',e:'🍜',kcal:270,p:9,c:46,f:5,na:410,tags:['素食','软食','低钠'],ing:['挂面 70g','青菜 100g','香菇 3 朵']},
 {id:'l1',meal:'l',n:'清蒸鲈鱼 + 杂粮饭 + 西兰花',e:'🐟',kcal:520,p:32,c:55,f:14,na:520,tags:['高蛋白','低GI','海鲜'],ing:['鲈鱼 200g','杂粮米 70g','西兰花 150g']},
 {id:'l2',meal:'l',n:'香菇鸡胸 + 荞麦面 + 时蔬',e:'🍗',kcal:480,p:34,c:48,f:12,na:460,tags:['高蛋白','低GI'],ing:['鸡胸 150g','荞麦面 70g','香菇 4 朵']},
 {id:'l3',meal:'l',n:'番茄豆腐 + 糙米饭 + 青菜',e:'🍅',kcal:430,p:20,c:58,f:10,na:380,tags:['素食','软食','低钠'],ing:['北豆腐 200g','番茄 2 个','糙米 70g']},
 {id:'l4',meal:'l',n:'萝卜炖牛腩 + 米饭 + 青菜',e:'🥩',kcal:560,p:30,c:52,f:22,na:640,tags:['高蛋白','牛肉'],ing:['牛腩 150g','白萝卜 200g','大米 70g']},
 {id:'l5',meal:'l',n:'虾仁蒸蛋 + 杂粮饭 + 菠菜',e:'🍤',kcal:400,p:26,c:44,f:12,na:450,tags:['高蛋白','软食','海鲜','蛋'],ing:['虾仁 100g','鸡蛋 2 个','菠菜 150g']},
 {id:'d1',meal:'d',n:'冬瓜丸子汤 + 小米粥 + 炒时蔬',e:'🍲',kcal:360,p:18,c:40,f:10,na:420,tags:['低钠','软食'],ing:['瘦肉馅 100g','冬瓜 200g','小米 40g']},
 {id:'d2',meal:'d',n:'清炒虾仁 + 藜麦饭 + 西兰花',e:'🍤',kcal:400,p:28,c:45,f:10,na:380,tags:['高蛋白','低钠','海鲜'],ing:['虾仁 120g','藜麦 70g','西兰花 150g']},
 {id:'d3',meal:'d',n:'南瓜蒸鸡 + 杂粮饭 + 菌菇汤',e:'🎃',kcal:420,p:26,c:46,f:12,na:340,tags:['高蛋白','低钠'],ing:['鸡腿肉 150g','南瓜 200g','杂粮米 70g']},
 {id:'d4',meal:'d',n:'素食什锦煲 + 糙米饭',e:'🥘',kcal:380,p:16,c:52,f:9,na:300,tags:['素食','低钠','软食'],ing:['豆腐 150g','菌菇 100g','糙米 70g']},
 {id:'d5',meal:'d',n:'番茄鸡蛋面 + 凉拌菠菜',e:'🍜',kcal:390,p:18,c:50,f:11,na:460,tags:['蛋','软食'],ing:['挂面 70g','番茄 2 个','鸡蛋 2 个']}
];
function goalOf(){return MEAL_GOALS.find(x=>x.k===state.meal.goal)||MEAL_GOALS[0];}
function dishOk(d,m){
  const t=m.taboos||[];
  if(t.indexOf('素食')>=0 && d.tags.indexOf('素食')<0) return false;
  if(t.indexOf('海鲜')>=0 && d.tags.indexOf('海鲜')>=0) return false;
  if(t.indexOf('牛肉')>=0 && d.tags.indexOf('牛肉')>=0) return false;
  if(t.indexOf('蛋奶')>=0 && (d.tags.indexOf('蛋')>=0||d.tags.indexOf('奶')>=0)) return false;
  if(t.indexOf('辛辣')>=0 && d.tags.indexOf('辛辣')>=0) return false;
  return true;
}
function pickDish(slot,idx,m,g){
  const want=GOAL_TAG[m.goal];
  let pool=DISHES.filter(d=>d.meal===slot&&dishOk(d,m));
  pool=pool.slice().sort((a,b)=>(b.tags.indexOf(want)>=0?1:0)-(a.tags.indexOf(want)>=0?1:0));
  if(!pool.length) pool=DISHES.filter(d=>d.meal===slot);
  return pool[idx%pool.length]||null;
}
function todayPlan(){
  const m=state.meal,g=goalOf(),out={};
  ['b','l','d'].forEach(slot=>{
    const key=m.day+'_'+slot;
    const id=m.plan[key];
    let d=id?DISHES.find(x=>x.id===id):null;
    if(!d) d=pickDish(slot,m.day,m,g);
    out[slot]=d;
  });
  return out;
}
function planSum(plan){
  const t={kcal:0,p:0,c:0,f:0,na:0};
  ['b','l','d'].forEach(k=>{const d=plan[k]; if(d){t.kcal+=d.kcal;t.p+=d.p;t.c+=d.c;t.f+=d.f;t.na+=d.na;}});
  return t;
}
function genMealPlan(){
  const m=state.meal,g=goalOf();
  m.plan={};
  ['b','l','d'].forEach(slot=>{const d=pickDish(slot,0,m,g); if(d)m.plan['0_'+slot]=d.id;});
  m.onboarded=true; m.day=0; m.locked={};
}
function swapDish(slot){
  const m=state.meal;
  if(m.locked[slot]){toast('这一餐已锁定，先解锁再换');return;}
  const pool=DISHES.filter(d=>d.meal===slot&&dishOk(d,m));
  const key=m.day+'_'+slot, cur=m.plan[key]||(todayPlan()[slot]||{}).id;
  let i=pool.findIndex(d=>d.id===cur);
  if(i<0)i=-1;
  const next=pool[(i+1)%pool.length];
  if(!next){toast('没有更多可选菜品');return;}
  m.plan[key]=next.id; render(); toast('已换成：'+next.n);
}
/* 设置页 */
function mealSetup(){
  const m=state.meal,g=goalOf();
  return `<div class="page noTab" style="padding-bottom:0">
    <div class="pgh" style="--h1:#1FA97A;--h2:#0B6146">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">智慧配餐</span>
        <span class="pgh-rt" data-act="sheet-meal-help">怎么算的</span></div>
      <div class="pgh-k">
        <div class="pgh-ic">${icoE('🥗',21)}</div>
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">先告诉我你要吃成什么样</div>
          <div class="pgh-num" style="font-size:17px;letter-spacing:0">按目标生成一周三餐</div>
        </div>
      </div>
    </div>
    <div class="body" style="margin-top:-26px">
      <div class="lbl" style="padding:0 14px">配餐目标 <em>单选</em></div>
      <div class="ogrid">
        ${MEAL_GOALS.map(x=>`<div class="opt ${m.goal===x.k?'on':''}" data-act="meal-goal" data-v="${x.k}">
          <div class="ok2">${m.goal===x.k?ico('check',12):''}</div>
          <b>${x.n}</b><span>${x.d}</span></div>`).join('')}
      </div>
      <div class="lbl" style="padding:16px 14px 0">用餐人数</div>
      <div style="padding:0 12px;display:flex;align-items:center;gap:10px">
        ${[1,2,3,4].map(n=>`<div class="dchip ${m.people===n?'on':''}" data-act="meal-people" data-v="${n}" style="width:58px;min-width:0">
          <b>${n} 人</b><span>${n===1?'独居':n===2?'两口':n===3?'三口':'多人'}</span></div>`).join('')}
      </div>
      <div class="lbl" style="padding:16px 14px 0">忌口 <em>可多选</em></div>
      <div class="chips" style="padding:0 12px">
        ${MEAL_TABOO.map(t=>`<div class="chip ${m.taboos.indexOf(t)>=0?'on':''}" data-act="meal-taboo" data-v="${t}">${t}</div>`).join('')}
      </div>
      <div class="tip" style="margin-top:14px">按《中国居民膳食指南》配比生成，热量为参考值；有慢性病请以签约医生意见为准。</div>
      <div style="height:12px"></div>
    </div>
    <div class="fbar">
      <div class="sum"><b>${g.n} · ${m.people} 人份</b>目标 ${g.kcal} kcal / 日 · 钠 ${g.na} mg</div>
      <div class="btn2" data-act="meal-start">生成一周配餐</div>
    </div>
  </div>`;
}
/* 方案页 */
function pgMeal(){
  const m=state.meal;
  if(!m.onboarded) return mealSetup();
  const g=goalOf(), plan=todayPlan(), sum=planSum(plan);
  const pct=Math.min(999,Math.round(sum.kcal/g.kcal*100));
  const pt=Math.round(g.kcal*0.18/4), ct=Math.round(g.kcal*0.52/4), ft=Math.round(g.kcal*0.30/9);
  const bar=(v,t,c)=>`<div class="nbr"><i>${c.n}</i>
    <span class="tr"><b style="width:${Math.min(100,Math.round(v/t*100))}%;background:${c.c}"></b></span>
    <em>${v} / ${t} ${c.u}</em></div>`;
  const days=['今天','明天','周二','周三','周四','周五','周六'];
  const dayMeta=['10-18','10-19','10-20','10-21','10-22','10-23','10-24'];
  const slots=[['b','早餐','#1F5FD6'],['l','午餐','#0E7C6B'],['d','晚餐','#A86A05']];
  return `<div class="page noTab" style="padding-bottom:0">
    <div class="pgh" style="--h1:#1FA97A;--h2:#0B6146">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div class="pgh-nav"><span class="pgh-bk" data-act="back">‹</span><span class="pgh-t">智慧配餐</span>
        <span class="pgh-rt" data-act="meal-reset">改目标</span></div>
      <div class="pgh-k">
        <div>
          <div class="pgh-lb" style="margin-bottom:6px">今日能量 · ${esc(g.n)}方案</div>
          <div class="pgh-num">${sum.kcal}<u>/ ${g.kcal} kcal</u></div>
        </div>
        <div class="pgh-lb">${esc(days[m.day])} · ${m.people} 人份<br>钠 ${sum.na} / ${g.na} mg</div>
        <div class="pgh-chip" data-act="meal-list">食材清单 ›</div>
      </div>
    </div>
    <div class="body" style="margin-top:-30px">
      <div class="dash" style="display:flex;align-items:center;gap:14px">
        <div class="mring" style="--mc:#1FA97A;--p:${Math.min(100,pct)}">
          <div class="mr"><b>${pct}%</b><span>热量达成</span></div>
        </div>
        <div class="nbl">
          ${bar(sum.p,pt,{n:'蛋白',u:'g',c:'#1F5FD6'})}
          ${bar(sum.c,ct,{n:'碳水',u:'g',c:'#F2A93B'})}
          ${bar(sum.f,ft,{n:'脂肪',u:'g',c:'#C9302C'})}
        </div>
      </div>
      <div class="wkr" style="margin-top:12px">
        ${days.map((d,i)=>`<div class="wkd ${m.day===i?'on':''}" data-act="meal-day" data-v="${i}">
          <b>${d}</b><span>${dayMeta[i]}</span></div>`).join('')}
      </div>
      ${slots.map(([slot,label,col])=>{
        const d=plan[slot]; if(!d) return '';
        const locked=!!m.locked[slot];
        return `<div class="dish">
          <div class="dhd"><span class="dt" style="background:${col}">${label}</span>
            <span class="dkc">${d.kcal} kcal · 蛋白 ${d.p}g</span></div>
          <div class="dbd">
            <div class="dim">${d.e}</div>
            <div style="flex:1;min-width:0">
              <div class="dnm">${esc(d.n)}</div>
              <div class="dnu">碳水 ${d.c}g · 脂肪 ${d.f}g · 钠 ${d.na}mg</div>
              <div class="dtg">${d.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
            </div>
          </div>
          <div class="dac">
            <div data-act="meal-swap" data-slot="${slot}">${ico('refresh',13)} 换一道</div>
            <div class="${locked?'on':''}" data-act="meal-lock" data-slot="${slot}">${locked?ico('lock',13)+' 已锁定':ico('unlock',13)+' 锁定'}</div>
          </div>
        </div>`;
      }).join('')}
      <div style="margin:12px 14px 16px;font-size:9px;color:var(--t3);line-height:1.65;text-align:center">
        配餐依据《中国居民膳食指南（2022）》与目标人群能量需求估算；<br>菜品可按忌口自动替换，仅供参考，不替代医生或营养师处方。</div>
    </div>
    <div class="fbar">
      <div class="sum"><b>${m.people} 人份 · ${esc(g.n)}</b>今日三餐 ${sum.kcal} kcal</div>
      <div class="btn2" data-act="meal-order">预约助餐</div>
    </div>
  </div>`;
}
function sheetMealHelp(){
  openSheet(`<h3>配餐怎么算的</h3>
    <div style="font-size:10.5px;color:var(--t2);line-height:1.85">
      1. 能量按目标人群估算：控糖 1600、控压 1700、减脂 1400、术后 1800、老年软食 1500 kcal；<br>
      2. 三大营养素按 蛋白 18% / 碳水 52% / 脂肪 30% 配比；<br>
      3. 菜品优先匹配目标标签（低 GI、低钠、高蛋白、软食），再按忌口过滤；<br>
      4. 钠摄入上限：控压 1300mg，其余 1400-1800mg。
    </div>
    <div style="margin-top:10px;font-size:9px;color:#8A5A00;background:var(--gold-l);padding:8px 10px;border-radius:6px;line-height:1.6">
      以上为膳食建议，不替代医生或营养师处方；糖尿病、肾病、术后患者请遵医嘱。</div>
    <div class="cl" data-act="close">知道了</div>`);
}
function sheetMealList(){
  const plan=todayPlan(), items=[];
  ['b','l','d'].forEach(k=>{const d=plan[k]; if(d)d.ing.forEach(x=>items.push(x));});
  const seen={}; const uniq=items.filter(x=>seen[x]?false:(seen[x]=1));
  openSheet(`<h3>今日食材清单</h3>
    <div style="font-size:9.5px;color:var(--t3);margin-bottom:6px">${state.meal.people} 人份 · 共 ${uniq.length} 项</div>
    ${uniq.map(x=>`<div class="it"><span>${esc(x)}</span><span style="font-size:9px;color:var(--t3)">×${state.meal.people}</span></div>`).join('')}
    <div class="cl p" data-act="meal-buy">一键加进生鲜预订</div>
    <div class="cl" data-act="close">关闭</div>`);
}

/* ============ 消息 / 我的 ============ */
function pgNotice(){
  return `<div class="page">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav" style="border-bottom:0"><span class="bk" data-act="back">‹</span>消息通知</div>
    ${NOTICES.map(n=>`<div class="nt"><div class="h"><span class="tag ${n.type}">${n.lb}</span></div>
      <div class="tt">${esc(n.t)}</div><div class="bd">${esc(n.b)}</div><div class="mt"><span>${esc(n.m)}</span></div></div>`).join('')}
    <div class="nt"><div class="h"><span class="tag">系统</span></div>
      <div class="tt">你的报修已派单</div><div class="bd">张师傅预计今天 14:00 上门，如需改期请点工单详情。</div>
      <div class="mt"><span>工单 · 2 小时前</span></div></div>
    <div style="height:14px"></div>
  </div>`;
}

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

/* ============ v1.3.1 开局登录（P7 授权型） ============ */
function shake(el){
  if(!el) return;
  el.classList.remove('shk'); void el.offsetWidth;
  el.classList.add('shk'); setTimeout(function(){el.classList.remove('shk');},460);
}
function pgLogin(){
  return `<div class="page noTab authp">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="au-hero">
      <div class="au-logo">猎</div>
      <div class="au-nm">猎奇便民服务</div>
      <div class="au-sb">阳光社区 · 报修缴费挂号，一个入口办完</div>
      <div class="au-pts">
        <div><b>38</b><span>项服务</span></div>
        <div><b>8</b><span>个板块</span></div>
        <div><b>24h</b><span>自助办理</span></div>
      </div>
    </div>
    <div class="au-card">
      <div class="au-t">登录后即可预约、报修与发布</div>
      <div class="au-btn ${state.loginBusy?'busy':''}" data-act="login-wx">
        <span class="au-wx">${ico('chat',15)}</span>
        <b>${state.loginBusy?'正在登录…':'微信一键登录'}</b>
      </div>
      <div class="au-alt" data-act="login-phone">手机号登录
        <em>个人主体无法获取手机号，当前版本未开放</em></div>
      <div class="ckb ${state.agree?'on':''}" id="ckAgree" data-act="agree-toggle">
        <i>${state.agree?ico('check',10):''}</i>
        <span>我已阅读并同意<b data-act="doc-user">《用户协议》</b>和<b data-act="doc-priv">《隐私政策》</b></span>
      </div>
      <div class="au-tip">${ico('lock',11)}
        <span>仅收集办事必需信息：昵称、楼栋房号、联系方式；不下单不采集位置，不向第三方共享。</span></div>
    </div>
    <div class="au-foot">${APP_VER} · 猎奇小分队 · 演示原型，不产生真实账号</div>
  </div>`;
}
function pgWelcome(){
  const d=state.prof, ch=(d.name||'?').slice(0,1);
  return `<div class="page noTab">
    <div class="sbar dark"><span>08:42</span><span>●●● ▮</span></div>
    <div class="nav"><span class="bk" data-act="back-login">‹</span>完善资料<span class="rt">1 / 1</span></div>
    <div class="au-wel">
      <div class="pfa" style="width:56px;height:56px;font-size:22px;background:${d.color}">${esc(ch)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:800">欢迎加入阳光社区</div>
        <div style="font-size:9.5px;color:var(--t3);margin-top:3px;line-height:1.5">
          资料用于社区内展示与上门服务定位，可随时修改</div>
      </div>
    </div>
    <div class="lbl" style="padding:6px 14px 0">昵称 <em>2-12 字，邻居会看到</em></div>
    <div style="padding:8px 14px 0">
      <input class="inp" id="welcomeName" maxlength="12" value="${esc(d.name)}" placeholder="给自己起个名字">
    </div>
    <div class="lbl" style="padding:13px 14px 0">头像底色</div>
    <div class="chips" style="padding:8px 14px 0">
      ${AV_COLORS.map(c=>`<div data-act="welcome-color" data-v="${c}"
        style="width:26px;height:26px;border-radius:50%;background:${c};cursor:pointer;
        border:2px solid ${d.color===c?'#fff':'transparent'};
        box-shadow:${d.color===c?`0 0 0 2px ${c}`:'none'}"></div>`).join('')}
    </div>
    <div class="lbl" style="padding:13px 14px 0">楼栋房号 <em>上门服务定位用</em></div>
    <div style="padding:8px 14px 0;display:flex;gap:8px;align-items:center">
      <input class="inp" id="welcomeAddr" maxlength="20" value="${esc(d.addr)}" placeholder="例：3 号楼 2 单元 502">
      <div class="abtn abtn-d abtn-s" style="height:38px;flex:none;padding:0 11px" data-act="addr-auto">
        ${ico('pin',12)} 自动</div>
    </div>
    <div class="tip" style="margin:13px 14px 0">房号只用于上门服务定位，<b>不对其他居民公开</b>；
      在「我的 → 编辑资料」里可以随时改。</div>
    <div style="height:8px"></div>
    <div class="fbar">
      <div class="sum"><b>${esc((d.name||'…').slice(0,11))}</b>
        ${d.addr?esc(d.addr):'还没填楼栋房号'}</div>
      <div class="btn2" data-act="welcome-ok">进入社区</div>
    </div>
  </div>`;
}
function sheetDoc(isUser){
  openSheet(`<h3>${isUser?'用户协议':'隐私政策'}</h3>
    <div style="font-size:10.5px;color:var(--t2);line-height:1.9;max-height:250px;overflow:auto">
      ${isUser?`<b>一、服务性质</b><br>本小程序只提供社区服务的信息发布与预约登记，<b>不收款、不担保交易、不提供医疗诊断</b>；
        实际服务由社区与入驻师傅线下履约。<br><br>
        <b>二、账号</b><br>一个微信仅对应一个社区账号；账号仅限本人使用，不得转让。<br><br>
        <b>三、发布规范</b><br>圈子内不得发布广告、涉政涉黄、谣言与他人隐私；违规内容将被删除并限制发布。<br><br>
        <b>四、免责</b><br>闲置转让由邻居自行约定，社区不介入交易纠纷；突发疾病请直接拨打 120。`
      :`<b>一、收集什么</b><br>昵称、头像底色、楼栋房号、联系方式；仅在提交单据时收集。<br><br>
        <b>二、用来做什么</b><br>就近匹配服务、上门定位、通知送达。<b>不用于画像、不用于广告推送</b>。<br><br>
        <b>三、位置信息</b><br>仅在你使用「附近服务」时读取一次，<b>不保存轨迹</b>，不对其他居民展示。<br><br>
        <b>四、健康数据</b><br>健康档案仅本人与签约医生可见，不对外提供。<br><br>
        <b>五、你的权利</b><br>可随时修改资料、关闭通知，或在「我的 → 注销账号」清空全部数据。`}
    </div>
    <div style="margin-top:10px;font-size:8.5px;color:var(--t3);line-height:1.6">
      以上为演示摘要，正式上线前需由法务出全文并经微信审核。</div>
    <div class="cl" data-act="close">我知道了</div>`);
}

function pgProfile(){
  const P=state.prof;
  const c1=myPosts().length;
  const c2=POSTS.filter(p=>p.comments.some(x=>x.w==='阿明')).length;
  const c3=Object.keys(state.saved).filter(k=>state.saved[k]).length;
  return `<div class="page">
    <div class="hd" style="padding-bottom:56px">
      <div class="sbar light"><span>08:42</span><span>●●● ▮</span></div>
      <div style="display:flex;align-items:flex-start;gap:11px;padding:12px 0 4px">
        <div class="pfa" style="background:${P.color}" data-act="prof-edit">${esc(P.av)}
          <div class="cam">${ico('pencil',11)}</div></div>
        <div style="flex:1;min-width:0;padding-top:2px">
          <div class="pnm" data-act="prof-edit">${esc(P.name)}<span class="ed">${ico('pencil',12)}</span></div>
          <div class="psg">${esc(P.sign)}</div>
          <div style="display:flex;gap:5px;margin-top:7px;align-items:center">
            <span class="pbadge">${ico('pin',9)} ${esc(P.addr)}</span>
            <span class="pbadge" style="background:rgba(255,255,255,.28)">${ico('check-c',9)} 已实名</span>
          </div>
        </div>
        <div style="display:flex;padding-top:4px;opacity:.9" data-act="prof-qr">${ico('share',17)}</div>
      </div>
    </div>
    <div class="body">
      <div class="pstats">
        ${[[c1,'我发的','prof-mine','post'],[c2,'我回复的','prof-mine','reply'],
           [c3,'我收藏的','prof-mine','save'],[3,'我的预约','go','book']]
          .map(([n,t,act,v])=>`<div class="c" data-act="${act}" ${act==='prof-mine'?`data-v="${v}"`:`data-v="${v}"`}>
            <b>${n}</b><span>${t}</span></div>`).join('')}
      </div>

      <div class="sec">
        <div class="st"><b>家庭与地址</b><em>可为家人代下单</em>
          <span class="more" data-act="member-add">＋ 添加</span></div>
        <div class="card" style="padding-bottom:6px">
          <div class="memb">
            <div class="mb" data-act="prof-edit"><div class="a" style="background:${P.color}">${esc(P.av)}</div><span>本人</span></div>
            ${P.members.map(m=>`<div class="mb" data-act="member-del" data-k="${m.k}">
              <div class="a" style="background:${m.c}">${esc(m.av)}</div><span>${esc(m.n)}</span></div>`).join('')}
            <div class="mb add" data-act="member-add"><div class="a">${ico('plus',16)}</div><span>添加</span></div>
          </div>
          <div style="padding:2px 12px 0">
            ${P.addrs.map(x=>`<div class="row" data-act="addr-def" data-k="${x.k}">
              <div class="k" style="background:${x.tag==='默认'?'#EAF1FE':'#F1F4F9'};color:${x.tag==='默认'?BLUE:'#8A95A5'}">${ico('pin',16)}</div>
              <div class="m"><b>${esc(x.t)}</b><span>${x.tag==='默认'?'默认地址 · 上门服务优先':'备用地址'}</span></div>
              ${x.tag==='默认'?`<div class="v" style="color:${BLUE};font-weight:700">默认</div>`:`<div class="v" style="color:var(--blue);font-size:9px">设为默认</div>`}
            </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="st"><b>我的服务</b></div>
        <div class="card" style="padding:0 12px">
          <div class="row" data-act="go|book"><div class="k" style="background:${TINT.blue[0]};color:${BLUE}">${ico('clipboard',17)}</div>
            <div class="m"><b>我的预约</b><span>家政 / 助餐 / 助浴 / 改造登记</span></div><div class="v">3 条</div><div class="ar">›</div></div>
          <div class="row" data-act="go|bill"><div class="k" style="background:${TINT.gold[0]};color:${GOLD}">${ico('bulb',17)}</div>
            <div class="m"><b>户号绑定</b><span>水 / 电 / 燃气 · 代缴登记</span></div><div class="v">2 / 3</div><div class="ar">›</div></div>
          <div class="row" data-act="go|record"><div class="k" style="background:${TINT.teal[0]};color:${TEAL}">${ico('clipboard',17)}</div>
            <div class="m"><b>健康档案</b><span>建档 · 测量记录 · 签约医生</span></div><div class="ar">›</div></div>
          <div class="row" data-act="go|tool"><div class="k" style="background:${TINT.teal[0]};color:${TEAL}">${ico('umbrella',17)}</div>
            <div class="m"><b>借用中的设备</b><span>共享雨伞 · 剩余 22:15</span></div><div class="v" style="color:${TEAL}">1 件</div><div class="ar">›</div></div>
        </div>
      </div>

      <div class="sec">
        <div class="st"><b>设置中心</b><em>通知只发你要的</em></div>
        <div class="card">
          <div class="pset">
            ${[['wo','工单进度','报修派单 / 上门 / 完成时通知'],
               ['out','停水停电','提前 1 天提醒，家有老人优先'],
               ['act','社区活动','每周最多 2 条，不发广告']].map(([k,t,d])=>`
              <div class="pr"><div class="plb"><div class="t">${t}</div><div class="d">${d}</div></div>
                <div class="asw ${P.notice[k]?'on':''}" data-act="prof-sw" data-k="${k}"></div></div>`).join('')}
            <div class="pr" style="cursor:default"><div class="plb"><div class="t">字号</div>
                <div class="d">特大等同关怀模式（宫格两列）</div></div>
              <div class="seg" style="width:126px;margin:0;flex:none">
                ${[['std','标准'],['lg','大'],['xl','特大']].map(([k,n])=>
                  `<div class="g ${P.font===k?'on':''}" data-act="prof-font" data-v="${k}">${n}</div>`).join('')}
              </div></div>
            <div class="pr" data-act="prof-privacy"><div class="plb"><div class="t">隐私与授权</div>
                <div class="d">定位 · 相册 · 订阅消息</div></div><div class="ar">›</div></div>
            <div class="pr" data-act="prof-clear"><div class="plb"><div class="t">清除缓存</div>
                <div class="d">12.4 MB · 不影响已提交的单据</div></div><div class="ar">›</div></div>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="card">
          <div class="pset">
            <div class="pr" data-act="prof-help"><div class="plb"><div class="t">帮助与反馈</div>
                <div class="d">常见问题 · 意见反馈 · 人工客服</div></div><div class="ar">›</div></div>
            <div class="pr" data-act="prof-about"><div class="plb"><div class="t">关于小程序</div>
                <div class="d">${APP_VER} · 猎奇小分队</div></div><div class="ar">›</div></div>
            <div class="pr" data-act="prof-del"><div class="plb"><div class="t" style="color:var(--red)">注销账号</div>
                <div class="d">清空资料与历史记录，不可恢复</div></div><div class="ar">›</div></div>
          </div>
        </div>
      </div>
      <div style="text-align:center;font-size:9px;color:var(--t3);padding:16px 12px 22px;line-height:1.7">
        ${APP_VER} · 社区便民原型 · 仅用于设计评审<br>本页数据均为演示数据，不做真实存储
      </div>
    </div>
  </div>`;
}
/* ===== v1.3.0 编辑资料 ===== */
function grabProfD(){
  if(!state.profD) return;
  const n=$('#pName'),g=$('#pSign'),a=$('#pAddr');
  if(n) state.profD.n=n.value.trim();
  if(g) state.profD.s=g.value.trim();
  if(a) state.profD.a=a.value.trim();
}
function openProfEdit(){
  state.profD={n:state.prof.name,s:state.prof.sign,a:state.prof.addr,c:state.prof.color};
  sheetProf();
}
function sheetProf(){
  const d=state.profD||{n:'',s:'',a:'',c:AV_COLORS[0]};
  const ch=(d.n||'?').slice(0,1);
  openSheet(`<h3>编辑资料</h3>
    <div style="display:flex;justify-content:center;margin:2px 0 12px">
      <div class="pfa" style="width:64px;height:64px;font-size:24px;background:${d.c};border-color:#fff;
        box-shadow:0 6px 18px rgba(16,32,64,.16)">${esc(ch)}</div>
    </div>
    <div class="lbl" style="margin:0 0 6px">昵称 <em>2-12 字，会显示在帖子和单据上</em></div>
    <input class="inp" id="pName" maxlength="12" value="${esc(d.n)}" placeholder="给自己起个名字">
    <div class="lbl" style="margin:11px 0 6px">头像底色</div>
    <div class="chips">${AV_COLORS.map(c=>`<div data-act="prof-color" data-v="${c}"
      style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;
      border:2px solid ${d.c===c?'#fff':'transparent'};box-shadow:${d.c===c?`0 0 0 2px ${c}`:'none'}"></div>`).join('')}</div>
    <div class="lbl" style="margin:11px 0 6px">一句话签名 <em>最多 24 字</em></div>
    <input class="inp" id="pSign" maxlength="24" value="${esc(d.s)}" placeholder="让邻居认识你，例如：爱帮邻居搭把手">
    <div class="lbl" style="margin:11px 0 6px">楼栋房号</div>
    <input class="inp" id="pAddr" maxlength="20" value="${esc(d.a)}" placeholder="例：3 号楼 2 单元 502">
    <div class="tip" style="margin-top:10px">昵称与签名会显示在你发的圈子里；房号只用于上门服务定位，
      <b>不对其他居民公开</b>。</div>
    <div class="cl p" data-act="prof-save">保存</div>
    <div class="cl" data-act="close">取消</div>`);
}
function openMemberAdd(){
  state.memD={n:'',r:'父亲'};
  sheetMember();
}
function sheetMember(){
  const d=state.memD||(state.memD={n:'',r:'父亲'});
  openSheet(`<h3>添加家庭成员</h3>
    <div class="lbl" style="margin:0 0 6px">称呼 <em>最多 6 字</em></div>
    <input class="inp" id="mName" maxlength="6" value="${esc(d.n)}" placeholder="例如：爸爸 / 奶奶 / 小满">
    <div class="lbl" style="margin:11px 0 6px">关系</div>
    <div class="chips">${['父亲','母亲','子女','配偶','其他'].map(r=>
      `<div class="chip ${d.r===r?'on':''}" data-act="member-rel" data-v="${r}">${r}</div>`).join('')}</div>
    <div class="tip" style="margin-top:10px">添加后可在预约服务时直接选择服务对象，不用每次重填；
      成员的手机号仅在提交单据时使用。</div>
    <div class="cl p" data-act="member-ok">添加</div>
    <div class="cl" data-act="close">取消</div>`);
}
function sheetDanger(){
  openSheet(`<h3 style="color:var(--red)">注销账号</h3>
    <div style="font-size:11px;line-height:1.8;color:var(--t2)">
      注销后将<b>立即清除</b>以下内容，且<b>无法恢复</b>：<br>
      · 昵称、头像、签名与房号<br>· 3 条预约记录与 2 条待办<br>· 圈子里的 2 条发布与全部收藏<br>· 健康档案与绑定户号
    </div>
    <div style="margin-top:10px;font-size:9px;color:#8A5A00;background:var(--gold-l);padding:8px 10px;border-radius:6px;line-height:1.65">
      正在办理中的工单需先完成后才能注销；注销后 7 天内可联系物业撤销。</div>
    <div class="cl" style="background:var(--red-l);color:var(--red);font-weight:800" data-act="prof-del-ok">确认注销</div>
    <div class="cl" data-act="close">再想想</div>`);
}
function pgBackEmpty(t){return `<div class="page noTab"><div class="nav"><span class="bk" data-act="back">‹</span>${t}</div><div class="empty">请从服务列表进入</div></div>`;}

/* ============ 弹层 ============ */
function openSheet(h){$('#sheet').innerHTML=h;$('#mask').classList.add('show');$('#sheet').classList.add('show');}
function closeSheet(){$('#mask').classList.remove('show');$('#sheet').classList.remove('show');}

/* ============ 路由 ============ */
function goCat(k){state.cat=k;state.page='hall';state.kw='';}
function openItem(grpName,name){
  const f=findItem(grpName,name);
  if(!f){toast('该服务暂未开通');return;}
  const {c,g,it}=f;
  state.backTo=state.page;
  if(it.flow==='book'){
    state.book={svc:it.n,icon:it.i,grpName:g.name,catName:c.full,opts:[],opts_:it.opts||[],slot:'',unit:'',room:'',note:'',done:false,no:'',step:1};
    state.page='book';
  } else if(it.flow==='bill') state.page='bill';
  else if(it.flow==='fresh'){state.page='fresh';state.freshTab=it.tab||'veg';}
  else if(it.flow==='tool'){state.page='tool';state.tool={n:it.n,spots:it.spots,free:it.free};}
  else if(it.flow==='lease') state.page='lease';
  else if(it.flow==='booking'){state.page='booking';state.booking={dept:'',doctor:'',slot:'',no:'',prev:0};}
  else if(it.flow==='meal'){state.page='meal';}
  else if(it.flow==='record') state.page='record';
  else if(it.flow==='express') state.page='express';
  else if(it.flow==='notice') state.page='notice';
  else if(it.flow==='ask'){
    const hit=(KB.find(k=>k.k.some(x=>it.q.indexOf(x)>=0))||{}).a
      ||'这个问题我还没学会，可以先在办事大厅找对应服务，或打物业 020-88888888。';
    openSheet(`<h3>AI 管家</h3>
      <div style="font-size:11px;color:var(--t3);margin-bottom:6px">你问：${esc(it.q)}</div>
      <div style="font-size:12px;color:var(--t1);line-height:1.75">${esc(hit)}</div>
      <div style="margin-top:9px;font-size:9.5px;color:var(--t3);line-height:1.5">AI 仅做健康与办事指引，不替代医生诊断；急症请拨 120。</div>
      <div class="cl p" data-act="close">我知道了</div>`);
    return;
  }
  render();
}

/* ============ 事件 ============ */
$('#phone').addEventListener('click',e=>{
  const tabEl=e.target.closest('[data-tab]');
  if(tabEl&&tabEl.classList.contains('t')){vibrate();state.page=tabEl.dataset.tab;render();return;}
  if(tabEl){state.page=tabEl.dataset.tab;render();return;}
  const el=e.target.closest('[data-act]');
  if(!el)return;
  const a=el.dataset.act; vibrate();
  /* 组合动作：go|页面 / tab|页面 / item|板块|服务 / ask|问题 */
  const p=a.split('|');
  if(p.length>1){
    if(p[0]==='go'){state.backTo='home';state.page=p[1];render();return;}
    if(p[0]==='tab'){state.page=p[1];render();return;}
    if(p[0]==='item'){openItem(p[1],p[2]);return;}
    if(p[0]==='ask'){
      openSheet(`<h3>AI 管家</h3>
        <div style="font-size:11px;color:var(--t3);margin-bottom:6px">你问：${esc(p[1])}</div>
        <div style="font-size:12px;line-height:1.75">体检报告由社区卫生服务站出具，历年结果可在「健康档案」查看；指标异常建议挂号由医生解读，AI 不替代诊断。</div>
        <div class="cl p" data-act="close">我知道了</div>`);
      return;
    }
  }
  if(a==='cat'){goCat(el.dataset.k);render();return;}
  if(a==='item'){openItem(el.dataset.g,el.dataset.n);return;}
  if(a==='go'){state.backTo=state.page;state.page=el.dataset.v||'hall';render();return;}
  if(a==='back'){state.page=state.backTo||'home';render();return;}
  if(a==='search'){state.page='hall';render();return;}
  if(a==='care'){state.care=!state.care;render();return;}
  if(a==='opt'){
    const b=state.book,v=el.dataset.v;
    const i=b.opts.indexOf(v); i>=0?b.opts.splice(i,1):b.opts.push(v);
    grabBook(); render(); return;
  }
  if(a==='slot'){grabBook();state.book.slot=el.dataset.v;render();return;}
  if(a==='bstp'){
    grabBook();
    const b=state.book; if(!b)return;
    const v=+el.dataset.v;
    if(v===2&&b.opts.length===0){toast('先选一个服务类型');return;}
    if(v===3&&!b.slot){toast('先选上门时间');return;}
    b.step=(v>=1&&v<=3)?v:1; render(); return;
  }
  if(a==='unit'){grabBook();state.book.unit=el.dataset.v;render();return;}
  if(a==='book-submit'){
    grabBook();
    const b=state.book;
    if(!b.slot||!b.unit){toast('请先选时间和楼栋');return;}
    b.no='SQ'+String(202600000+Math.floor(Math.random()*99999));
    b.done=true;render();toast('预约已提交');return;
  }
  if(a==='ftab'){state.freshTab=el.dataset.v;render();return;}
  if(a==='plus'||a==='minus'){
    const k=el.dataset.t+'#'+el.dataset.i;
    if(a==='plus')state.cart[k]=(state.cart[k]||0)+1;
    else{state.cart[k]=(state.cart[k]||0)-1;if(state.cart[k]<=0)delete state.cart[k];}
    render();return;
  }
  if(a==='fresh-submit'){
    const n=Object.keys(state.cart).reduce((s,k)=>s+state.cart[k],0);
    openSheet(`<h3>预订已提交</h3>
      <div style="font-size:12px;color:var(--t2);line-height:1.75;text-align:center">共 ${n} 件 · 明早 6:00 到货<br>到货后到 1 号楼驿站取，或由团长配送到家</div>
      <div style="margin-top:10px;background:var(--gold-l);color:#8A5A00;font-size:10px;line-height:1.65;padding:9px 10px;border-radius:8px">
        本页只做预订登记，不在小程序内支付；货款到货时当面结算。</div>
      <div class="cl p" data-act="close">知道了</div>`);
    return;
  }
  if(a==='borrow'){
    state.borrowing={n:(state.tool||{}).n||'共享雨伞',no:'YS-'+String(300+Math.floor(Math.random()*600))};
    render();toast('借用成功');return;
  }
  if(a==='give-back'){state.borrowing=null;render();toast('已归还，未产生费用');return;}
  if(a==='remind'){toast('到期提醒已开启（微信服务通知）');return;}
  if(a==='lty'){state.leaseTy=el.dataset.v;render();return;}
  if(a==='dept'){state.booking={...state.booking,dept:el.dataset.v,doctor:'',slot:'',no:''};render();return;}
  if(a==='doctor'){state.booking={...state.booking,doctor:el.dataset.v,slot:'',no:''};render();return;}
  if(a==='bslot'){
    if(el.dataset.off==='1'){toast('该时段已约满');return;}
    state.booking={...state.booking,slot:el.dataset.v};render();return;
  }
  if(a==='take'){
    const b=state.booking;
    if(!b.dept||!b.doctor||!b.slot){toast('请先选完科室、医生和时间');return;}
    state.booking={...b,no:'A'+String(20+Math.floor(Math.random()*60)).padStart(3,'0'),prev:2+Math.floor(Math.random()*4)};
    render();toast('取号成功');return;
  }
  if(a==='booking-reset'){state.booking={dept:'',doctor:'',slot:'',no:'',prev:0};render();return;}
  if(a==='bill-pay'||a==='bill-detail'){
    const b=BILLS[Number(el.dataset.i)];
    openSheet(`<h3>${esc(b.k)}</h3>
      <div class="it"><span>户号</span><span>${esc(b.acc)}</span></div>
      <div class="it"><span>本期应缴</span><span style="color:#C9302C;font-weight:800">${b.amt==='—'?'待绑定':'¥'+b.amt}</span></div>
      <div class="it"><span>出账时间</span><span>${esc(b.day)}</span></div>
      <div style="margin-top:10px;font-size:10px;color:var(--t2);line-height:1.65">
        ${b.amt==='—'?'绑定户号后可代查欠费、代为登记代缴。':'付款请到微信「生活缴费」完成，本小程序不经手资金；也可登记由社区代为办理。'}</div>
      <div class="cl p" data-act="${b.amt==='—'?'bind':'order-bill'}" data-k="${esc(b.k)}">${b.amt==='—'?'绑定户号':'登记代办'}</div>
      <div class="cl" data-act="close">关闭</div>`);
    return;
  }
  if(a==='bind'){closeSheet();toast('绑定户号：输入 8 位户号 → 短信验证');return;}
  if(a==='order-bill'){closeSheet();toast((el.dataset.k||'')+' 代缴已登记，进度可查');return;}
  if(a==='sheet-help'){
    openSheet(`<h3>缴费代办说明</h3><div style="font-size:11px;color:var(--t2);line-height:1.8">
      1. 本功能只做<b>户号绑定</b>与<b>代缴登记</b>；<br>2. 资金通过微信「生活缴费」支付，小程序不经手；<br>
      3. 登记后由社区志愿者代为办理，进度可在本页查看；<br>4. 户号属敏感信息，仅本人可见。</div>
      <div class="cl" data-act="close">知道了</div>`);
    return;
  }
  if(a==='sheet-spot'){
    openSheet(`<h3>投放点 / 存放点</h3>
      <div class="it"><span>1 号楼大厅</span><span class="tag ok">可借</span></div>
      <div class="it"><span>南门岗亭</span><span class="tag ok">可借</span></div>
      <div class="it"><span>3 号楼架空层</span><span class="tag warn">仅归还</span></div>
      <div class="cl" data-act="close">关闭</div>`);return;
  }
  if(a==='sheet-post'){
    openSheet(`<h3>业主发布房源</h3>
      <div class="it"><span>1. 上传房产证明</span><span class="ar">›</span></div>
      <div class="it"><span>2. 填写面积 / 楼层 / 租金</span><span class="ar">›</span></div>
      <div class="it"><span>3. 社区核验后展示</span><span class="ar">›</span></div>
      <div style="margin-top:10px;font-size:10px;color:#8A5A00;background:var(--gold-l);padding:9px 10px;border-radius:8px;line-height:1.6">
        社区不做中介、不收佣金、不代收租金；请勿发布虚假房源。</div>
      <div class="cl p" data-act="close">开始发布</div><div class="cl" data-act="close">关闭</div>`);return;
  }
  if(a==='sheet-want'){
    openSheet(`<h3>求租 / 求售登记</h3>
      <div class="it"><span>意向</span><span>求租 · 2 室以内</span></div>
      <div class="it"><span>预算</span><span>2000-3000 元/月</span></div>
      <div class="it"><span>联系方式</span><span>138****6688</span></div>
      <div class="cl p" data-act="want-ok">提交登记</div><div class="cl" data-act="close">关闭</div>`);return;
  }
  if(a==='want-ok'){closeSheet();toast('已提交，有匹配房源会通知你');return;}
  if(a==='pickup-order'){toast('已预约上门取件，快递员 18:00 前联系你');return;}
  if(a==='house'){openSheet(`<h3>${esc(el.dataset.t)}</h3>
      <div style="height:96px;border-radius:10px;background:linear-gradient(135deg,#DCE8F8,#C6D9F2);display:flex;align-items:center;justify-content:center;font-size:38px">🏢</div>
      <div class="it"><span>核验状态</span><span class="tag ok">已核验</span></div>
      <div class="it"><span>发布方</span><span>业主本人</span></div>
      <div style="margin-top:10px;font-size:10px;color:var(--t2);line-height:1.65">看房请联系业主，社区不参与交易、不收取任何费用。</div>
      <div class="cl p" data-act="call">联系业主</div><div class="cl" data-act="close">关闭</div>`);return;}
  if(a==='call'){closeSheet();toast('拨打业主电话（演示不拨号）');return;}
  if(a==='sheet-block'){toast('该功能在下一版开放');return;}
  if(a==='feed'){state.feed=el.dataset.v;render();return;}
  if(a==='topic'){state.backTo=state.page;state.topic=el.dataset.v;state.page='topic';render();return;}
  if(a==='topic-on'){
    const v=el.dataset.v, on=!state.topicOn[v]; state.topicOn[v]=on;
    render(); toast(on?'已关注 #'+v:'已取消关注 #'+v); return;
  }
  if(a==='topic-post'){
    state.draftTopic=state.topic; state.draftType=state.topic==='闲置转让'?'sell':state.topic==='活动召集'?'event':'ask';
    state.draft=''; state.draftImgs=[]; sheetPostNew(); return;
  }
  if(a==='digest'){state.backTo=state.page;state.page='digest';render();return;}
  if(a==='like'){const id=el.dataset.id;state.liked[id]=!state.liked[id];render();return;}
  if(a==='save'){
    const id=el.dataset.id, on=!state.saved[id]; state.saved[id]=on;
    render(); toast(on?'已收藏，可在「我的圈子」查看':'已取消收藏'); return;
  }
  if(a==='join-ev'){
    const id=el.dataset.id,p=findPost(id); if(!p)return;
    const on=!state.joined[id]; state.joined[id]=on;
    if(p.x&&typeof p.x.join==='number') p.x.join=Math.max(0,p.x.join+(on?1:-1));
    render(); toast(on?'报名成功，记得准时到':'已取消报名'); return;
  }
  if(a==='post-open'){state.backTo=state.page;state.detail=el.dataset.id;state.replyTo='';state.page='post';render();return;}
  if(a==='post-more'){
    openSheet(`<h3>更多操作</h3>
      <div class="it" data-act="sheet-block"><span>举报这条动态</span><span>›</span></div>
      <div class="it" data-act="sheet-block"><span>不看这个话题</span><span>›</span></div>
      <div class="it" data-act="save-close" data-id="${esc(el.dataset.id||'')}"><span>${state.saved[el.dataset.id]?'取消收藏':'收藏这条'}</span><span>›</span></div>
      <div class="cl" data-act="close">取消</div>`);return;
  }
  if(a==='save-close'){
    const id=el.dataset.id, on=!state.saved[id]; state.saved[id]=on;
    closeSheet(); render(); toast(on?'已收藏':'已取消收藏'); return;
  }
  if(a==='share'){toast('已复制动态链接（演示）');return;}
  if(a==='join'){toast('你已加入阳光社区圈子');return;}
  if(a==='post-new'){state.draft='';state.draftImgs=[];state.draftType='ask';sheetPostNew();return;}
  if(a==='dtype'){grabDraft();state.draftType=el.dataset.v;sheetPostNew();return;}
  if(a==='dimg'){
    grabDraft();
    const v=el.dataset.v,i=state.draftImgs.indexOf(v);
    if(i>=0)state.draftImgs.splice(i,1);
    else if(state.draftImgs.length<9)state.draftImgs.push(v);
    else{toast('最多 9 张');return;}
    sheetPostNew();return;
  }
  if(a==='dimg-more'){toast('已选满 9 张（演示不上传真实图片）');return;}
  if(a==='ai-polish'){
    grabDraft();
    const t=aiPolish(state.draft);
    if(!t){toast('先写几个字，AI 帮你补成一条动态');return;}
    state.draft=t; sheetPostNew(); toast('AI 已补全，可再手动改'); return;
  }
  if(a==='dtopic'){grabDraft();state.draftTopic=el.dataset.v;sheetPostNew();return;}
  if(a==='post-publish'){
    grabDraft();
    const t=(state.draft||'').trim();
    if(!t){toast('先写点什么再发布');return;}
    const ty=state.draftType||'ask';
    const np={id:'p'+Date.now(),type:ty,who:'3 栋阿明',unit:'3 号楼 2 单元',time:'刚刚',
      topic:state.draftTopic,c:'#4B45B8',av:'明',text:t,imgs:state.draftImgs.slice(),
      tag:'#'+state.draftTopic,likes:0,comments:[],x:{}};
    if(ty==='ask')np.solved=false;
    if(ty==='sell')np.x={price:'￥80',origin:'原价 ￥299',cond:'九成新 · 楼下自提'};
    if(ty==='event')np.x={when:'本周日 15:00',where:'社区活动室 2 楼',join:1,cap:15};
    POSTS.unshift(np);
    state.draft='';state.draftImgs=[];state.draftType='ask';
    closeSheet();state.circleTab='全部';state.feed='rec';state.page='circle';render();toast('已发布');return;
  }
  if(a==='reply'){state.replyTo=el.dataset.v;render();toast('正在回复 @'+state.replyTo);return;}
  if(a==='unreply'){state.replyTo='';render();return;}
  if(a==='cmt-send'){
    const i=$('#cmtIn'); const t=((i?i.value:'')||'').trim();
    if(!t){toast('先写点什么');return;}
    const p=findPost(state.detail);
    if(p){const c={w:'阿明',t,m:'刚刚'}; if(state.replyTo)c.re=state.replyTo; p.comments.push(c);}
    state.replyTo=''; render(); toast('评论已发布'); return;
  }
  if(a==='mine-tab'){state.mineTab=el.dataset.v;render();return;}
  if(a==='loc'){sheetLoc();return;}
  if(a==='relocate'){if($('#mask').classList.contains('show'))closeSheet();reLocate();return;}
  if(a==='map-ty'){state.mapTy=el.dataset.v;render();return;}
  if(a==='map-mode'){
    state.mapSchematic=!state.mapSchematic;render();
    toast(state.mapSchematic?'已切到示意底图':'已切到矢量底图');return;
  }
  if(a==='poi'){poiSheet(el.dataset.id);return;}
  if(a==='nav-to'){closeSheet();toast('调起微信内置地图导航（演示不跳转）');return;}
  if(a==='ai-tab'){state.aiTab=el.dataset.v;render();return;}
  if(a==='ai-send'){const i=$('#aiIn');const q=(i?i.value:'').trim();if(i)i.value='';aiAsk(q);return;}
  if(a==='ai-ask'){aiAsk(el.dataset.q);return;}
  if(a==='ai-voice'){toast('按住说话（演示）');return;}
  if(a==='ai-model'){sheetAiModel();return;}
  if(a==='ai-pick'){
    state.aiModel=el.dataset.v;closeSheet();render();
    toast('已切换：'+((AI_MODELS.find(m=>m.k===el.dataset.v)||{}).n||''));return;
  }
  if(a==='img-style'){const t=$('#imgQ');if(t)state.imgPrompt=t.value;state.imgStyle=el.dataset.v;render();return;}
  if(a==='img-ratio'){const t=$('#imgQ');if(t)state.imgPrompt=t.value;state.imgRatio=el.dataset.v;render();return;}
  if(a==='img-gen'){
    const t=$('#imgQ'); if(t)state.imgPrompt=t.value.trim();
    const q=(state.imgPrompt||'').trim();
    if(!q){toast('先描述一下想生成的画面');return;}
    const r=IMG_RATIOS.find(x=>x[0]===(state.imgRatio||'1:1'))||IMG_RATIOS[0];
    const sty=(IMG_STYLES.find(x=>x[0]===(state.imgStyle||'写实'))||IMG_STYLES[0])[1];
    state.imgBusy=true; state.imgs=[]; render();
    const seeds=[0,0,0,0].map(()=>Math.floor(Math.random()*999999));
    const tag=state.imgStyle||'写实';
    setTimeout(()=>{
      state.imgs=seeds.map(s=>({u:imgUrl(q,sty,r[1],r[2],s),tag}));
      state.imgBusy=false;
      if(state.page==='ai')render();
      toast('4 张图已生成');
    },1300);
    return;
  }
  if(a==='meal-goal'){state.meal.goal=el.dataset.v;state.meal.onboarded=false;render();return;}
  if(a==='meal-people'){state.meal.people=+el.dataset.v||2;render();return;}
  if(a==='meal-taboo'){
    const t=el.dataset.v,i=state.meal.taboos.indexOf(t);
    i>=0?state.meal.taboos.splice(i,1):state.meal.taboos.push(t);
    render();return;
  }
  if(a==='meal-start'){genMealPlan();render();toast('已按「'+goalOf().n+'」生成一周配餐');return;}
  if(a==='meal-reset'){state.meal.onboarded=false;render();return;}
  if(a==='meal-day'){state.meal.day=+el.dataset.v||0;state.meal.locked={};render();return;}
  if(a==='meal-swap'){swapDish(el.dataset.slot);return;}
  if(a==='meal-lock'){
    const k=el.dataset.slot, on=!state.meal.locked[k];
    state.meal.locked[k]=on; render();
    toast(on?'已锁定这一餐':'已解锁'); return;
  }
  if(a==='meal-order'){
    openSheet(`<h3>预约助餐</h3>
      <div class="it"><span>取餐方式</span><span>送餐上门</span></div>
      <div class="it"><span>份数</span><span>${state.meal.people} 份</span></div>
      <div class="it"><span>送达时段</span><span>11:00-12:30</span></div>
      <div style="margin-top:10px;font-size:9.5px;color:var(--t3);line-height:1.6">
        助餐由社区食堂按配餐方案出餐；60 岁以上登记后享补贴，费用到餐时结算，本页只登记。</div>
      <div class="cl p" data-act="meal-order-ok">确认登记</div>
      <div class="cl" data-act="close">关闭</div>`);return;
  }
  if(a==='meal-order-ok'){closeSheet();toast('助餐已登记，今日 11:00 前送达');return;}
  if(a==='meal-list'){sheetMealList();return;}
  if(a==='meal-buy'){closeSheet();state.page='fresh';state.freshTab='veg';render();toast('已转入生鲜预订');return;}
  if(a==='sheet-meal-help'){sheetMealHelp();return;}
  if(a==='kit'){state.page='kit';render();return;}
  if(a==='prof-edit'){openProfEdit();return;}
  if(a==='prof-color'){grabProfD();state.profD.c=el.dataset.v;sheetProf();return;}
  if(a==='prof-save'){
    grabProfD(); const d=state.profD||{};
    if(!d.n||d.n.length<2){toast('昵称至少 2 个字');return;}
    state.prof.name=d.n; state.prof.av=d.n.slice(0,1); state.prof.sign=d.s||'';
    state.prof.addr=d.a||''; state.prof.color=d.c||AV_COLORS[0];
    closeSheet(); render(); toast('资料已保存'); return;}
  if(a==='prof-sw'){const k=el.dataset.k;state.prof.notice[k]=!state.prof.notice[k];render();
    toast(state.prof.notice[k]?'已开启':'已关闭');return;}
  if(a==='prof-font'){const v=el.dataset.v;state.prof.font=v;state.care=(v==='xl');
    $('#phone').classList.toggle('fsl',v==='lg'); render();
    toast(v==='std'?'字号：标准':v==='lg'?'字号：大（1.08×）':'字号：特大（关怀模式）');return;}
  if(a==='prof-clear'){toast('已清除 12.4 MB 缓存');return;}
  if(a==='prof-privacy'){openSheet(`<h3>隐私与授权</h3>
      <div class="it"><span>位置信息</span><span style="color:#0E7C6B">仅使用期间</span></div>
      <div class="it"><span>相册 / 摄像头</span><span style="color:#0E7C6B">发布时询问</span></div>
      <div class="it"><span>订阅消息</span><span>3 项已开启</span></div>
      <div class="it"><span>健康数据</span><span style="color:#0E7C6B">仅本人可见</span></div>
      <div style="margin-top:10px;font-size:10px;color:var(--t2);line-height:1.75">
        只收集办事必需的信息；位置用于就近匹配与上门服务，不保存轨迹、不对其他居民展示。
        健康档案仅本人与签约医生可见。</div>
      <div class="cl" data-act="close">我知道了</div>`);return;}
  if(a==='prof-help'){openSheet(`<h3>帮助与反馈</h3>
      <div class="it"><span>工单没派单怎么办</span><span style="color:var(--t3)">›</span></div>
      <div class="it"><span>预约想改时间</span><span style="color:var(--t3)">›</span></div>
      <div class="it"><span>设备归还失败</span><span style="color:var(--t3)">›</span></div>
      <div class="it"><span>联系物业客服</span><span style="color:var(--blue)">020-8888 1234</span></div>
      <div class="cl p" data-act="close">提交意见反馈</div>
      <div class="cl" data-act="close">关闭</div>`);return;}
  if(a==='prof-about'){openSheet(`<h3>关于小程序</h3>
      <div class="it"><span>版本</span><span>${APP_VER}</span></div>
      <div class="it"><span>开发</span><span>猎奇小分队</span></div>
      <div class="it"><span>适用范围</span><span>阳光社区（演示）</span></div>
      <div style="margin-top:10px;font-size:10px;color:var(--t2);line-height:1.75">
        本小程序只做<b>信息发布与预约登记</b>，不收款、不担保交易、不提供医疗诊断。
        所有服务由社区与入驻师傅线下履约。</div>
      <div class="cl" data-act="close">关闭</div>`);return;}
  if(a==='prof-del'){sheetDanger();return;}
  if(a==='prof-del-ok'){closeSheet();toast('注销申请已提交，7 天内可撤销（演示不真实注销）');return;}
  if(a==='prof-qr'){toast('出示给物业扫码可核验身份（演示）');return;}
  if(a==='prof-mine'){state.mineTab=el.dataset.v||'post';state.page='mine';render();return;}
  if(a==='member-add'){openMemberAdd();return;}
  if(a==='member-rel'){
    const n=$('#mName'); if(n) state.memD.n=n.value.trim();
    state.memD.r=el.dataset.v; sheetMember(); return;}
  if(a==='member-ok'){
    const n=$('#mName'), nm=n?n.value.trim():'';
    if(!nm){toast('先填一个称呼');return;}
    const cs=AV_COLORS.slice(1,7);
    state.prof.members.push({k:'m'+Date.now(),n:nm,r:state.memD.r,av:nm.slice(0,1),c:cs[state.prof.members.length%cs.length]});
    closeSheet(); render(); toast('已添加「'+nm+'」'); return;}
  if(a==='member-del'){
    const k=el.dataset.k, m=state.prof.members.find(x=>x.k===k); if(!m)return;
    openSheet(`<h3>移除家庭成员</h3>
      <div style="font-size:11px;color:var(--t2);line-height:1.75">移除「${esc(m.n)}」后，
        该成员的历史单据仍保留在记录里，但不能再作为服务对象快速选择。</div>
      <div class="cl" style="color:var(--red)" data-act="member-del-ok" data-k="${k}">确认移除</div>
      <div class="cl" data-act="close">取消</div>`);return;}
  if(a==='member-del-ok'){
    state.prof.members=state.prof.members.filter(x=>x.k!==el.dataset.k);
    closeSheet(); render(); toast('已移除'); return;}
  if(a==='addr-def'){
    const k=el.dataset.k;
    state.prof.addrs.forEach(x=>{x.tag = x.k===k?'默认':'备用';});
    render(); toast('已设为默认地址'); return;}
  if(a==='agree-toggle'){state.agree=!state.agree;render();
    const k=$('#ckAgree'); if(k) k.classList.remove('warn'); return;}
  if(a==='login-wx'){
    if(!state.agree){toast('请先阅读并勾选同意协议');shake($('#ckAgree'));
      if($('#ckAgree')) $('#ckAgree').classList.add('warn'); return;}
    state.loginBusy=true; render();
    setTimeout(function(){state.loginBusy=false;state.auth='welcome';render();
      toast('登录成功，先完善一下资料');},700);
    return;}
  if(a==='login-phone'){toast('个人主体无法获取手机号，演示请用微信登录');return;}
  if(a==='doc-user'){sheetDoc(true);return;}
  if(a==='doc-priv'){sheetDoc(false);return;}
  if(a==='back-login'){state.auth='login';render();return;}
  if(a==='welcome-color'){state.prof.color=el.dataset.v;
    const n=$('#welcomeName'),ad=$('#welcomeAddr');
    if(n) state.prof.name=n.value;
    if(ad) state.prof.addr=ad.value; render(); return;}
  if(a==='addr-auto'){
    const ad=$('#welcomeAddr');
    if(ad) ad.value='3 号楼 2 单元 502';
    state.prof.addr='3 号楼 2 单元 502';
    render(); toast('已按定位填写：3 号楼 2 单元 502'); return;}
  if(a==='welcome-ok'){
    const n=$('#welcomeName'), ad=$('#welcomeAddr');
    if(n) state.prof.name=n.value.trim();
    if(ad) state.prof.addr=ad.value.trim();
    const nm=(state.prof.name||'').trim();
    if(nm.length<2){toast('昵称至少 2 个字');return;}
    if(!(state.prof.addr||'').trim()){toast('请填写楼栋房号');return;}
    state.prof.name=nm; state.prof.av=nm.slice(0,1);
    state.auth='done'; state.page='home'; render();
    toast('欢迎，'+nm); return;}
  if(a==='ap-open'){
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
  if(a==='close'){closeSheet();return;}
});

document.addEventListener('input',e=>{
  if(e.target&&e.target.id==='kw'){state.kw=e.target.value;}
  if(e.target&&e.target.id==='room'&&state.book)state.book.room=e.target.value;
  if(e.target&&e.target.id==='note'&&state.book)state.book.note=e.target.value;
  if(e.target&&e.target.id==='pName'&&state.profD)state.profD.n=e.target.value;
  if(e.target&&e.target.id==='pSign'&&state.profD)state.profD.s=e.target.value;
  if(e.target&&e.target.id==='pAddr'&&state.profD)state.profD.a=e.target.value;
  if(e.target&&e.target.id==='mName'&&state.memD)state.memD.n=e.target.value;
  if(e.target&&e.target.id==='welcomeName')state.prof.name=e.target.value;
  if(e.target&&e.target.id==='welcomeAddr')state.prof.addr=e.target.value;
});
document.addEventListener('keydown',e=>{
  if(e.target&&e.target.id==='kw'&&e.key==='Enter'){e.preventDefault();state.page='hall';render();}
  if(e.target&&e.target.id==='aiIn'&&e.key==='Enter'){e.preventDefault();const q=e.target.value.trim();e.target.value='';aiAsk(q);}
  if(e.target&&e.target.id==='apIn'&&e.key==='Enter'){e.preventDefault();
    const q=e.target.value.trim(); if(!q)return; e.target.value=''; askInline(q);}
});
$('#mask').addEventListener('click',closeSheet);
$('#swCare').addEventListener('click',()=>{state.care=!state.care;render();});
$('#swKit').addEventListener('click',()=>{state.backTo='home';state.page='kit';render();});
$('#swLogin').addEventListener('click',()=>{state.auth='login';state.agree=false;closeSheet();render();});
$('#swReset').addEventListener('click',()=>{
  state.page='home';state.cat='life';state.kw='';state.book=null;state.cart={};
  state.tool=null;state.borrowing=null;state.leaseTy='all';state.booking=null;state.care=false;
  state.feed='rec';state.circleTab='全部';state.liked={};state.saved={};state.replyTo='';
  state.draft='';state.draftImgs=[];state.draftType='ask';state.joined={};state.mineTab='post';
  state.prof.name='阿明的小院';state.prof.av='阿';state.prof.color='#1F5FD6';
  state.prof.sign='住 3 号楼，爱帮邻居搭把手';state.prof.addr='3 号楼 2 单元 502';
  state.prof.font='std';state.prof.notice={wo:true,out:true,act:false};
  $('#phone').classList.remove('fsl');
  closeSheet();render();toast('已重置');
});

/* 重渲染前把输入框内容收回 state，避免点选项后已填内容丢失 */
function grabBook(){
  const r=$('#room'),n=$('#note'),k=$('#kw');
  if(r&&state.book)state.book.room=r.value.trim();
  if(n&&state.book)state.book.note=n.value.trim();
  if(k)state.kw=k.value;
}
function grabDraft(){const d=$('#draftIn');if(d)state.draft=d.value;}

render();

/* 首屏模拟一次实时定位：定位中 → 已定位 */
setTimeout(()=>{
  if(state.loc&&state.loc.st==='locating'){
    state.loc={st:'ok',acc:ME.acc};
    if(['home','map','kit','profile','ai'].indexOf(state.page)>=0)render();
  }
},1400);
/* 底图 SDK 异步到达后补挂地图 */
window.addEventListener('load',()=>{if(state.page==='map')mountMap();});
