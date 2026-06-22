// ========== 数据定义 ==========
export const SURNAMES = ['苍','凌','墨','赤','白','青','金','银','铁','烈','暗','雷','霜','炎','破','天','云','雪','狂','玄','风','星','潮','岩','烬','冰','暮','曜','寒','炽','啸','逐','踏','裂','焚','镇','凌','破','惊','断','孤','残','醉','浮','忘','归','离','挽','听','画','弄','拾','寻','渡','浣','抚','弈','书','吟','煮','品','观','采','折','葬','问','追','乘','傲','啸','揽','摘','擎','封','定','安','横','赋','击','高','长','独','远','问道','听雪','画眉','弄影','拾光','寻梦','渡尘','浣花','抚琴','弈棋','书墨','吟诗','煮酒','品茶','观云','采菊','折柳','葬花','问月','追星','乘风','傲雪','啸风','揽星','摘云','擎天','封疆','定国','安邦','横槊','赋诗','击筑','高歌','长啸','独行','远游','归隐'];
export const GIVEN_NAMES = ['炎','风','云','月','星','阳','影','霜','尘','羽','夜','凌','墨','赤','白','青','金','银','铁','烈','雷','寒','炽','啸','逐','踏','裂','焚','镇','破','惊','断','孤','残','醉','浮','忘','归','离','挽','听','画','弄','拾','寻','渡','浣','抚','弈','书','吟','煮','品','观','采','折','葬','问','追','乘','傲','揽','摘','擎','封','定','安','横','赋','击','高','长','独','远'];
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const RACE_DATA = {
    '狼族': { emoji: '🐺', type: '肉食', trait: '擅长协作，嗅觉敏锐', pet: '银白巨狼', environment: '北境雪原', ability: '夜视、呼唤狼群' },
    '虎族': { emoji: '🐯', type: '肉食', trait: '力量强悍，独行王者', pet: '橙黑猛虎', environment: '南方丛林', ability: '巨力、虎啸' },
    '狐族': { emoji: '🦊', type: '杂食', trait: '狡黠聪慧，魅惑天成', pet: '九尾灵狐', environment: '东方丘陵', ability: '炼药、幻术' },
    '龙族': { emoji: '🐉', type: '肉食', trait: '鳞甲坚固，寿元绵长', pet: '碧鳞苍龙', environment: '中央山脉', ability: '龙威、鳞甲' },
    '豹族': { emoji: '🐆', type: '肉食', trait: '迅捷如电，爆发惊人', pet: '玄纹猎豹', environment: '热带草原', ability: '疾速、夜视' },
    '熊族': { emoji: '🐻', type: '杂食', trait: '体魄雄壮，力大无穷', pet: '大地棕熊', environment: '北方雪林', ability: '怪力、锻造' },
    '蛇族': { emoji: '🐍', type: '肉食', trait: '阴柔诡谲，毒牙致命', pet: '碧鳞大蛇', environment: '南方湿地', ability: '毒牙、感知' },
    '鹰族': { emoji: '🦅', type: '肉食', trait: '目力千里，翼展遮天', pet: '苍羽金鹰', environment: '西方高峰', ability: '远视、飞行' },
    '鹿族': { emoji: '🦌', type: '草食', trait: '温驯优雅，善辨药草', pet: '白斑灵鹿', environment: '东方森林', ability: '采集、医术' },
    '狮族': { emoji: '🦁', type: '肉食', trait: '王者风范，群体协作', pet: '赤金雄狮', environment: '中央平原', ability: '协作、震慑' },
    '兔族': { emoji: '🐰', type: '草食', trait: '繁殖力强，听觉出众', pet: '雪绒玉兔', environment: '丘陵草地', ability: '听觉、繁殖' },
    '羊族': { emoji: '🐏', type: '草食', trait: '性情温和，善织毛绒', pet: '卷云灵羊', environment: '山地牧场', ability: '织造、群居' },
    '马族': { emoji: '🐴', type: '草食', trait: '奔跑如风，耐力持久', pet: '踏雪乌骓', environment: '广阔草原', ability: '奔跑、耐力' },
    '猫族': { emoji: '🐱', type: '杂食', trait: '灵巧敏捷，夜视极佳', pet: '墨玉灵猫', environment: '月光之城', ability: '夜视、灵巧' },
    '犬族': { emoji: '🐶', type: '杂食', trait: '忠诚护主，嗅觉超群', pet: '赤焰灵犬', environment: '忠诚之丘', ability: '嗅觉、忠诚' },
    '人鱼族': { emoji: '🧜‍♂️', type: '杂食', trait: '水中霸主，歌喉惑心', pet: '沧澜人鱼', environment: '人鱼海湾', ability: '水中霸主、惑心' },
    '鹏族': { emoji: '🦅', type: '肉食', trait: '翼展千里，风驰电掣', pet: '金翅大鹏', environment: '天柱山巅', ability: '极速飞行、千里目' },
    '象族': { emoji: '🐘', type: '草食', trait: '体型庞大，力拔山兮', pet: '巨象', environment: '热带雨林', ability: '巨力、记忆' },
    '犀牛族': { emoji: '🦏', type: '草食', trait: '皮糙肉厚，冲锋陷阵', pet: '铁甲犀牛', environment: '草原湿地', ability: '冲锋、铁甲' },
    '鳄鱼族': { emoji: '🐊', type: '肉食', trait: '潜伏猎手，咬合力惊人', pet: '巨鳄', environment: '沼泽水域', ability: '潜伏、咬合' }
};
export const RACE_KEYS = Object.keys(RACE_DATA);

export const NATION_DATA = [
    { name: '苍狼国', race: '狼族', desc: '北境雪原狼族之国', x: 0, y: 0 },
    { name: '赤虎国', race: '虎族', desc: '南方丛林虎族霸主', x: 60, y: 80 },
    { name: '九尾国', race: '狐族', desc: '东方丘陵狐族智国', x: 100, y: 20 },
    { name: '龙鳞国', race: '龙族', desc: '中央山脉龙族古国', x: 30, y: 40 },
    { name: '金鹰国', race: '鹰族', desc: '西方高峰鹰族大国', x: -50, y: 30 },
    { name: '碧蛇国', race: '蛇族', desc: '南方湿地蛇族密国', x: 70, y: 90 },
    { name: '铁熊国', race: '熊族', desc: '北方雪林熊族雪国', x: -20, y: -40 },
    { name: '灵鹿国', race: '鹿族', desc: '东方森林鹿族善国', x: 120, y: 10 },
    { name: '金狮国', race: '狮族', desc: '中央平原狮族强权', x: 20, y: 30 },
    { name: '银月国', race: '狼族', desc: '月下狼族', x: -10, y: -20 },
    { name: '踏雪国', race: '马族', desc: '草原马族王国', x: 90, y: 60 },
    { name: '人鱼国', race: '人鱼族', desc: '深海人鱼国度', x: 140, y: 50 },
    { name: '天鹏国', race: '鹏族', desc: '天柱山巅鹏族王国', x: -70, y: -60 },
    { name: '象国', race: '象族', desc: '热带雨林象族王国', x: 80, y: 110 },
    { name: '犀牛国', race: '犀牛族', desc: '草原湿地犀牛国度', x: 110, y: 70 },
    { name: '鳄鱼国', race: '鳄鱼族', desc: '沼泽水域鳄鱼之国', x: 50, y: 130 }
];

export const PLACE_DATA = {
    palace: [
        { id: 'qin_dian', name: '女王寝殿', icon: '🛏️', desc: '休息与就寝之处', realm: 'palace', fixed: 'first' },
        { id: 'yi_shi_ting', name: '议事厅', icon: '⚖️', desc: '与臣子共议国事', realm: 'palace' },
        { id: 'hou_hua_yuan', name: '后花园', icon: '🌺', desc: '赏花休憩', realm: 'palace' },
        { id: 'hou_gong', name: '后宫', icon: '💕', desc: '妃子居住的宫殿群', realm: 'palace', action: 'enter_harem' },
        { id: 'gong_dian_zheng_ting', name: '宫殿正厅', icon: '🏛️', desc: '接待外国使臣', realm: 'palace' },
        { id: 'yan_hui_ting', name: '宴会厅', icon: '🎭', desc: '举办舞会与宴席', realm: 'palace' },
        { id: 'gong_yi_suo', name: '宫医所', icon: '💉', desc: '宫医诊疗之处', realm: 'palace' },
        { id: 'di_lao', name: '地牢', icon: '⛓️', desc: '关押犯人', realm: 'palace' },
        { id: 'chu_gong', name: '🚪出宫', icon: '🚪', desc: '走出王宫，前往王都', realm: 'palace', fixed: 'last', action: 'exit_palace' }
    ],
    city: [
        { id: 'wang_gong', name: '王宫', icon: '🏰', desc: '返回王宫', realm: 'city', fixed: 'first', action: 'enter_palace' },
        { id: 'tie_jiang_pu', name: '铁匠铺', icon: '🔨', desc: '锻造兵器与工具', realm: 'city' },
        { id: 'xun_lian_chang', name: '训练场', icon: '💪', desc: '勇士操练，武艺精进', realm: 'city' },
        { id: 'sa_man_ji_tan', name: '萨满祭坛', icon: '🔮', desc: '祈福占卜', realm: 'city' },
        { id: 'shi_ji', name: '市集', icon: '🏪', desc: '以物易物，贸易往来', realm: 'city' },
        { id: 'pai_mai_chang', name: '拍卖场', icon: '🔨', desc: '珍品竞拍', realm: 'city' },
        { id: 'jue_dou_chang', name: '角斗场', icon: '⚔️', desc: '勇士对决', realm: 'city' },
        { id: 'jiu_guan', name: '酒馆', icon: '🍺', desc: '鱼龙混杂，消息集散地', realm: 'city' },
        { id: 'gong_fang', name: '工坊', icon: '🔧', desc: '手工艺制作', realm: 'city' },
        { id: 'xiang_yao_pu', name: '香药铺', icon: '🌿', desc: '香料与药材买卖', realm: 'city' },
        { id: 'hei_shi', name: '黑市', icon: '🌙', desc: '地下交易', realm: 'city' },
        { id: 'di_xia_jue_dou_chang', name: '地下角斗场', icon: '💀', desc: '残酷的地下竞技', realm: 'city' },
        { id: 'zhong_yang_guang_chang', name: '中央广场', icon: '🏛️', desc: '王都中心广场', realm: 'city' },
        { id: 'pin_min_qu', name: '贫民窟', icon: '🏚️', desc: '底层民众聚居地', realm: 'city' },
        { id: 'fu_min_qu', name: '富民区', icon: '🏘️', desc: '富商贵族宅邸', realm: 'city' },
        { id: 'fan_dian', name: '饭店', icon: '🍽️', desc: '品尝各地美食', realm: 'city' },
        { id: 'mao_xian_zhe_xie_hui', name: '冒险者协会', icon: '🎯', desc: '接受委托，招募勇士', realm: 'city' },
        { id: 'cheng_men', name: '🚪城门', icon: '🚪', desc: '出城前往城外', realm: 'city', fixed: 'last', action: 'exit_city' }
    ],
    outcity: [
        { id: 'cheng_men_wai', name: '🚪城门', icon: '🚪', desc: '返回王都', realm: 'outcity', fixed: 'first', action: 'enter_city' },
        { id: 'he_bian', name: '河边', icon: '🌊', desc: '水流清澈，鱼群游弋', realm: 'outcity' },
        { id: 'shao_ta', name: '哨塔', icon: '🗼', desc: '高耸入云，俯瞰四方', realm: 'outcity' },
        { id: 'mi_lin', name: '密林', icon: '🌲', desc: '古木参天，药草遍地', realm: 'outcity' },
        { id: 'yue_ya', name: '月崖', icon: '🌙', desc: '狼族圣地，月光笼罩', realm: 'outcity' },
        { id: 'shi_lin_shan_mai', name: '石林山脉', icon: '⛰️', desc: '险峻多石，野兽出没', realm: 'outcity' }
    ]
};

export const ALL_ACHIEVEMENTS = [
    { id: 'first_meet', name: '初次邂逅', desc: '遇到第一位兽人', icon: '👤' },
    { id: 'first_harem', name: '初纳妃子', desc: '招揽第一位雄性兽人', icon: '💕' },
    { id: 'first_child', name: '血脉延续', desc: '诞下第一位子嗣', icon: '👶' },
    { id: 'harem_3', name: '后宫三千', desc: '拥有3位妃子', icon: '💕' },
    { id: 'char_10', name: '广结善缘', desc: '遇到10位兽人', icon: '👥' },
    { id: 'wealth_1', name: '万贯家财', desc: '个人财富达到1金', icon: '💰' },
    { id: 'day_30', name: '在位一月', desc: '游戏天数达到30天', icon: '📅' },
    { id: 'vassal_1', name: '附属之始', desc: '获得第一个附属国', icon: '📜' }
];

// 工具函数（不依赖 G）
export const getRaceData = r => RACE_DATA[r] || null;
export const getRaceEmoji = r => (getRaceData(r) || {}).emoji || '👤';
export const isMale = g => g === '雄性';
export const genderText = g => isMale(g) ? '♂' : '♀';
export const genderClass = g => isMale(g) ? 'gender-male' : 'gender-female';
export const wealthToCopper = w => (w.gold || 0) * 1000000 + (w.silver || 0) * 1000 + (w.copper || 0);
export const formatWealth = w => { if (!w) return '0金'; let p = []; if (w.gold > 0) p.push(w.gold + '金'); if (w.silver > 0) p.push(w.silver + '银'); if (w.copper > 0) p.push(w.copper + '铜'); return p.length ? p.join(' ') : '0铜'; };
export const addWealth = (w, amt) => { let t = wealthToCopper(w) + amt; w.gold = Math.floor(t / 1000000); t -= w.gold * 1000000; w.silver = Math.floor(t / 1000); w.copper = t - w.silver * 1000; return w; };