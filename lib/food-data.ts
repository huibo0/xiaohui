/**
 * 小惠食物数据库
 * 针对 UCTD / 狼疮倾向 患者的饮食指南
 *
 * safety: 'good' = 推荐  |  'ok' = 适量  |  'caution' = 少吃  |  'avoid' = 避免
 * category: 食物分类
 */

export interface FoodItem {
  name: string;        // 中文名
  alias?: string[];    // 别名/拼音/英文，用于搜索
  emoji: string;
  category: string;
  safety: 'good' | 'ok' | 'caution' | 'avoid';
  reason: string;      // 为什么推荐/限制
  tip?: string;        // 额外小贴士
}

export const FOOD_DATABASE: FoodItem[] = [
  // ==================== 蔬菜 ====================
  { name: '西兰花', alias: ['花椰菜','broccoli','xilan'], emoji: '🥦', category: '蔬菜', safety: 'good', reason: '十字花科蔬菜，抗炎抗氧化', tip: '蒸或轻炒保留营养' },
  { name: '菠菜', alias: ['spinach','bocai'], emoji: '🥬', category: '蔬菜', safety: 'good', reason: '富含叶酸、铁、维生素K，抗炎' },
  { name: '羽衣甘蓝', alias: ['kale','yuyi'], emoji: '🥬', category: '蔬菜', safety: 'good', reason: '超级蔬菜，抗氧化能力强' },
  { name: '胡萝卜', alias: ['carrot','huluobo'], emoji: '🥕', category: '蔬菜', safety: 'good', reason: '富含β-胡萝卜素，保护皮肤' },
  { name: '白菜', alias: ['大白菜','Chinese cabbage','baicai'], emoji: '🥬', category: '蔬菜', safety: 'good', reason: '温和易消化，维生素C丰富' },
  { name: '黄瓜', alias: ['cucumber','huanggua'], emoji: '🥒', category: '蔬菜', safety: 'good', reason: '清热补水，低热量' },
  { name: '芹菜', alias: ['celery','qincai'], emoji: '🥬', category: '蔬菜', safety: 'good', reason: '含芹菜素，有一定抗炎作用' },
  { name: '南瓜', alias: ['pumpkin','nangua'], emoji: '🎃', category: '蔬菜', safety: 'good', reason: '富含维A和纤维，温和易消化' },
  { name: '红薯', alias: ['地瓜','番薯','sweet potato','hongshu'], emoji: '🍠', category: '蔬菜', safety: 'good', reason: '复合碳水+抗氧化物，稳定血糖' },
  { name: '西葫芦', alias: ['zucchini','xihulu'], emoji: '🥒', category: '蔬菜', safety: 'good', reason: '低热量高纤维，温和不刺激' },
  { name: '丝瓜', alias: ['sigua','luffa'], emoji: '🥒', category: '蔬菜', safety: 'good', reason: '清热利湿，适合日常食用' },
  { name: '莲藕', alias: ['lotus root','lianou'], emoji: '🪷', category: '蔬菜', safety: 'good', reason: '健脾养胃，营养丰富' },
  { name: '山药', alias: ['shanyao','yam'], emoji: '🥔', category: '蔬菜', safety: 'good', reason: '补脾益肺，温和滋养' },
  { name: '冬瓜', alias: ['donggua','winter melon'], emoji: '🍈', category: '蔬菜', safety: 'good', reason: '利尿消肿，清热' },
  { name: '番茄', alias: ['西红柿','tomato','fanqie'], emoji: '🍅', category: '蔬菜', safety: 'ok', reason: '茄科蔬菜，部分患者可能敏感', tip: '观察吃后反应，煮熟比生吃好' },
  { name: '茄子', alias: ['eggplant','qiezi'], emoji: '🍆', category: '蔬菜', safety: 'ok', reason: '茄科蔬菜，因人而异', tip: '如果吃后关节不适建议减少' },
  { name: '青椒', alias: ['辣椒','pepper','qingjiao'], emoji: '🫑', category: '蔬菜', safety: 'ok', reason: '茄科蔬菜，少量可以', tip: '辣椒素有一定抗炎作用但可能刺激肠胃' },
  { name: '土豆', alias: ['马铃薯','potato','tudou'], emoji: '🥔', category: '蔬菜', safety: 'ok', reason: '茄科蔬菜，大多数人可以正常吃', tip: '发芽的土豆不要吃' },
  { name: '苜蓿', alias: ['苜蓿芽','alfalfa','muxu'], emoji: '🌱', category: '蔬菜', safety: 'avoid', reason: '含L-刀豆氨酸，可直接触发狼疮症状！', tip: '这是最重要的饮食禁忌，任何含苜蓿的食品都要避免' },
  { name: '苜蓿芽', alias: ['alfalfa sprouts'], emoji: '🌱', category: '蔬菜', safety: 'avoid', reason: '含L-刀豆氨酸，严禁食用' },
  { name: '大蒜', alias: ['garlic','dasuan'], emoji: '🧄', category: '蔬菜', safety: 'ok', reason: '有免疫增强作用，少量调味可以', tip: '做菜放几瓣没问题，不建议大量生吃' },
  { name: '洋葱', alias: ['onion','yangcong'], emoji: '🧅', category: '蔬菜', safety: 'good', reason: '含槲皮素，有一定抗炎效果' },
  { name: '生姜', alias: ['姜','ginger','shengjiang'], emoji: '🫚', category: '蔬菜', safety: 'good', reason: '天然抗炎，缓解恶心' },
  { name: '蘑菇', alias: ['香菇','mushroom','mogu'], emoji: '🍄', category: '蔬菜', safety: 'good', reason: '富含维生素D和多糖，增强免疫' },
  { name: '木耳', alias: ['黑木耳','muer','black fungus'], emoji: '🍄', category: '蔬菜', safety: 'good', reason: '补铁活血，膳食纤维丰富' },
  { name: '豆芽', alias: ['bean sprout','douya'], emoji: '🌱', category: '蔬菜', safety: 'good', reason: '黄豆芽/绿豆芽都可以，注意不是苜蓿芽' },

  // ==================== 水果 ====================
  { name: '蓝莓', alias: ['blueberry','lanmei'], emoji: '🫐', category: '水果', safety: 'good', reason: '抗氧化之王，花青素丰富' },
  { name: '樱桃', alias: ['cherry','yingtao'], emoji: '🍒', category: '水果', safety: 'good', reason: '抗炎+抗氧化，适量食用' },
  { name: '苹果', alias: ['apple','pingguo'], emoji: '🍎', category: '水果', safety: 'good', reason: '温和水果，富含纤维和维C' },
  { name: '橙子', alias: ['柑橘','orange','chengzi'], emoji: '🍊', category: '水果', safety: 'good', reason: '维生素C丰富，增强免疫' },
  { name: '猕猴桃', alias: ['奇异果','kiwi','mihoutao'], emoji: '🥝', category: '水果', safety: 'good', reason: '维C含量极高，抗氧化' },
  { name: '香蕉', alias: ['banana','xiangjiao'], emoji: '🍌', category: '水果', safety: 'good', reason: '富含钾，缓解肌肉紧张' },
  { name: '葡萄', alias: ['grape','putao'], emoji: '🍇', category: '水果', safety: 'good', reason: '含白藜芦醇，抗炎抗氧化' },
  { name: '草莓', alias: ['strawberry','caomei'], emoji: '🍓', category: '水果', safety: 'good', reason: '富含维C和花青素' },
  { name: '西瓜', alias: ['watermelon','xigua'], emoji: '🍉', category: '水果', safety: 'ok', reason: '补水解暑，但含糖较高', tip: '适量吃，不要当饭吃' },
  { name: '芒果', alias: ['mango','mangguo'], emoji: '🥭', category: '水果', safety: 'ok', reason: '营养丰富但部分人可能过敏', tip: '如果从未过敏可以正常吃' },
  { name: '牛油果', alias: ['鳄梨','avocado','niuyouguo'], emoji: '🥑', category: '水果', safety: 'good', reason: '富含好脂肪和维生素E，抗炎' },
  { name: '柠檬', alias: ['lemon','ningmeng'], emoji: '🍋', category: '水果', safety: 'good', reason: '维C丰富，泡水喝很好' },
  { name: '梨', alias: ['pear','li'], emoji: '🍐', category: '水果', safety: 'good', reason: '润肺止咳，温和水果' },
  { name: '石榴', alias: ['pomegranate','shiliu'], emoji: '🫐', category: '水果', safety: 'good', reason: '抗氧化能力很强' },
  { name: '火龙果', alias: ['dragon fruit','huolongguo'], emoji: '🐉', category: '水果', safety: 'good', reason: '富含纤维和抗氧化物' },
  { name: '木瓜', alias: ['papaya','mugua'], emoji: '🍈', category: '水果', safety: 'good', reason: '含木瓜蛋白酶，助消化抗炎' },

  // ==================== 肉类蛋白 ====================
  { name: '三文鱼', alias: ['鲑鱼','salmon','sanwenyu'], emoji: '🐟', category: '肉蛋', safety: 'good', reason: 'Omega-3 含量最高的鱼，强效抗炎' },
  { name: '鲭鱼', alias: ['mackerel','qingyu'], emoji: '🐟', category: '肉蛋', safety: 'good', reason: '富含Omega-3，价格比三文鱼亲民' },
  { name: '沙丁鱼', alias: ['sardine','shadingyu'], emoji: '🐟', category: '肉蛋', safety: 'good', reason: 'Omega-3+钙+维D，小鱼重金属少' },
  { name: '鸡胸肉', alias: ['鸡肉','chicken','jixiong'], emoji: '🍗', category: '肉蛋', safety: 'good', reason: '优质低脂蛋白质' },
  { name: '鸡蛋', alias: ['egg','jidan'], emoji: '🥚', category: '肉蛋', safety: 'good', reason: '全营养食品，维D来源', tip: '每天1-2个完全没问题' },
  { name: '虾', alias: ['shrimp','xia'], emoji: '🦐', category: '肉蛋', safety: 'ok', reason: '优质蛋白，但部分人过敏', tip: '如果不过敏可以正常吃' },
  { name: '牛肉', alias: ['beef','niurou'], emoji: '🥩', category: '肉蛋', safety: 'ok', reason: '补铁补锌，适量吃', tip: '选瘦牛肉，红肉每周2-3次为宜' },
  { name: '猪肉', alias: ['pork','zhurou'], emoji: '🥩', category: '肉蛋', safety: 'ok', reason: '日常肉类，选瘦的', tip: '避免肥肉和五花肉' },
  { name: '羊肉', alias: ['lamb','yangrou'], emoji: '🍖', category: '肉蛋', safety: 'ok', reason: '温补，冬天可以适量吃', tip: '不要吃太多，红肉总量控制' },
  { name: '鸭肉', alias: ['duck','yarou'], emoji: '🦆', category: '肉蛋', safety: 'ok', reason: '比较温和的肉类' },
  { name: '带鱼', alias: ['hairtail','daiyu'], emoji: '🐟', category: '肉蛋', safety: 'good', reason: '含Omega-3和维A' },
  { name: '鲈鱼', alias: ['sea bass','luyu'], emoji: '🐟', category: '肉蛋', safety: 'good', reason: '高蛋白低脂肪' },
  { name: '加工肉类', alias: ['香肠','腊肉','培根','火腿','processed meat'], emoji: '🥓', category: '肉蛋', safety: 'caution', reason: '含亚硝酸盐和高盐，促进炎症', tip: '尽量少吃，偶尔吃一次影响不大' },

  // ==================== 谷物主食 ====================
  { name: '糙米', alias: ['brown rice','caomi'], emoji: '🍚', category: '主食', safety: 'good', reason: '全谷物，GI低，纤维丰富' },
  { name: '燕麦', alias: ['oat','yanmai'], emoji: '🥣', category: '主食', safety: 'good', reason: '降胆固醇，β-葡聚糖抗炎' },
  { name: '全麦面包', alias: ['whole wheat','quanmai'], emoji: '🍞', category: '主食', safety: 'good', reason: '全谷物，比白面包好很多' },
  { name: '白米饭', alias: ['米饭','rice','mifan'], emoji: '🍚', category: '主食', safety: 'ok', reason: '日常主食，可以吃', tip: '可以掺一些糙米或杂粮' },
  { name: '面条', alias: ['noodle','miantiao'], emoji: '🍜', category: '主食', safety: 'ok', reason: '普通面条没问题', tip: '有条件选全麦面条' },
  { name: '小米', alias: ['millet','xiaomi'], emoji: '🌾', category: '主食', safety: 'good', reason: '养胃暖胃，富含B族维生素' },
  { name: '红薯', alias: ['sweet potato'], emoji: '🍠', category: '主食', safety: 'good', reason: '复合碳水+抗氧化物' },
  { name: '玉米', alias: ['corn','yumi'], emoji: '🌽', category: '主食', safety: 'good', reason: '富含纤维和叶黄素' },
  { name: '荞麦', alias: ['buckwheat','qiaomai'], emoji: '🌾', category: '主食', safety: 'good', reason: '无麸质杂粮，营养丰富' },
  { name: '藜麦', alias: ['quinoa','limai'], emoji: '🌾', category: '主食', safety: 'good', reason: '超级谷物，完全蛋白质' },
  { name: '面包', alias: ['bread','mianbao'], emoji: '🍞', category: '主食', safety: 'ok', reason: '白面包GI偏高', tip: '尽量选全麦面包' },
  { name: '方便面', alias: ['泡面','instant noodle','fangbianmian'], emoji: '🍜', category: '主食', safety: 'caution', reason: '高盐高油，营养单一', tip: '偶尔吃解馋可以，不要经常吃' },

  // ==================== 豆类 ====================
  { name: '豆腐', alias: ['tofu','doufu'], emoji: '🧈', category: '豆类', safety: 'good', reason: '优质植物蛋白，钙丰富' },
  { name: '黑豆', alias: ['black bean','heidou'], emoji: '🫘', category: '豆类', safety: 'good', reason: '花青素+植物蛋白' },
  { name: '鹰嘴豆', alias: ['chickpea','yingzuidou'], emoji: '🫘', category: '豆类', safety: 'good', reason: '高蛋白高纤维，地中海饮食常用' },
  { name: '红豆', alias: ['赤豆','red bean','hongdou'], emoji: '🫘', category: '豆类', safety: 'good', reason: '补铁利湿' },
  { name: '绿豆', alias: ['mung bean','lvdou'], emoji: '🫘', category: '豆类', safety: 'good', reason: '清热解毒' },
  { name: '黄豆', alias: ['大豆','soybean','huangdou'], emoji: '🫘', category: '豆类', safety: 'ok', reason: '含植物雌激素，适量吃', tip: '每天适量豆制品没问题，不需要刻意回避' },
  { name: '豆浆', alias: ['soy milk','doujiang'], emoji: '🥛', category: '豆类', safety: 'ok', reason: '同黄豆，适量饮用即可' },
  { name: '毛豆', alias: ['edamame','maodou'], emoji: '🫛', category: '豆类', safety: 'good', reason: '高蛋白低脂，好零食' },

  // ==================== 乳制品 ====================
  { name: '牛奶', alias: ['milk','niunai'], emoji: '🥛', category: '乳制品', safety: 'good', reason: '补钙护骨，羟氯喹最好随牛奶服用', tip: '吃药时搭配牛奶效果更好' },
  { name: '酸奶', alias: ['yogurt','suannai'], emoji: '🥛', category: '乳制品', safety: 'good', reason: '补钙+益生菌，保护肠道' },
  { name: '奶酪', alias: ['芝士','cheese','nailao'], emoji: '🧀', category: '乳制品', safety: 'ok', reason: '高钙但也高脂高盐', tip: '选低脂奶酪，每次少量' },

  // ==================== 坚果 ====================
  { name: '核桃', alias: ['walnut','hetao'], emoji: '🥜', category: '坚果', safety: 'good', reason: '富含Omega-3和维E，脑健康' },
  { name: '杏仁', alias: ['almond','xingren'], emoji: '🥜', category: '坚果', safety: 'good', reason: '维E+钙+好脂肪' },
  { name: '腰果', alias: ['cashew','yaoguo'], emoji: '🥜', category: '坚果', safety: 'good', reason: '富含锌和镁' },
  { name: '花生', alias: ['peanut','huasheng'], emoji: '🥜', category: '坚果', safety: 'ok', reason: '营养但属于高过敏原食物', tip: '不过敏就可以正常吃' },
  { name: '开心果', alias: ['pistachio','kaixinguo'], emoji: '🥜', category: '坚果', safety: 'good', reason: '抗氧化+纤维' },
  { name: '亚麻籽', alias: ['flaxseed','yamazi'], emoji: '🌰', category: '坚果', safety: 'good', reason: 'Omega-3植物来源之王', tip: '磨碎了吃吸收更好' },
  { name: '奇亚籽', alias: ['chia seed','qiyazi'], emoji: '🌰', category: '坚果', safety: 'good', reason: 'Omega-3+纤维+蛋白' },

  // ==================== 油脂调料 ====================
  { name: '橄榄油', alias: ['olive oil','ganlanyou'], emoji: '🫒', category: '油脂', safety: 'good', reason: '单不饱和脂肪酸，地中海饮食核心', tip: '适合凉拌和低温烹饪' },
  { name: '菜籽油', alias: ['canola oil','caiziyou'], emoji: '🫗', category: '油脂', safety: 'ok', reason: '日常炒菜用油，还可以' },
  { name: '猪油', alias: ['lard','zhuyou'], emoji: '🫗', category: '油脂', safety: 'caution', reason: '饱和脂肪高，促进炎症' },
  { name: '黄油', alias: ['butter','huangyou'], emoji: '🧈', category: '油脂', safety: 'caution', reason: '饱和脂肪高', tip: '少量烘焙可以，不要大量使用' },
  { name: '姜黄', alias: ['turmeric','jianghuang'], emoji: '🟡', category: '调料', safety: 'good', reason: '姜黄素是天然抗炎明星', tip: '加点黑胡椒吸收更好' },

  // ==================== 饮品 ====================
  { name: '绿茶', alias: ['green tea','lvcha'], emoji: '🍵', category: '饮品', safety: 'good', reason: '茶多酚抗氧化抗炎', tip: '不要喝太浓，下午3点后少喝避免影响睡眠' },
  { name: '白开水', alias: ['温水','水','water','shui'], emoji: '💧', category: '饮品', safety: 'good', reason: '最好的饮品！每天至少1.5L' },
  { name: '咖啡', alias: ['coffee','kafei'], emoji: '☕', category: '饮品', safety: 'ok', reason: '适量可以，每天不超过2杯', tip: '不要空腹喝，服药前后1小时避免' },
  { name: '奶茶', alias: ['milk tea','naicha'], emoji: '🧋', category: '饮品', safety: 'caution', reason: '高糖高热量，偶尔解馋', tip: '选少糖或无糖，不要天天喝' },
  { name: '可乐', alias: ['cola','kele','碳酸饮料'], emoji: '🥤', category: '饮品', safety: 'caution', reason: '高糖+磷酸影响钙吸收', tip: '偶尔喝一口可以，别当水喝' },
  { name: '酒', alias: ['啤酒','白酒','红酒','wine','beer','alcohol','jiu'], emoji: '🍷', category: '饮品', safety: 'caution', reason: '可能与羟氯喹相互作用，加重肝脏负担', tip: '如果要喝，每天不超过一小杯红酒' },
  { name: '蜂蜜水', alias: ['honey','fengmi'], emoji: '🍯', category: '饮品', safety: 'ok', reason: '天然甜味剂，比白糖好' },

  // ==================== 零食甜品 ====================
  { name: '黑巧克力', alias: ['dark chocolate','heiqiaokeli'], emoji: '🍫', category: '零食', safety: 'ok', reason: '70%以上可可含量的有抗氧化作用', tip: '每天一小块（20g左右）' },
  { name: '蛋糕', alias: ['cake','dangao'], emoji: '🍰', category: '零食', safety: 'caution', reason: '高糖高脂，促进炎症', tip: '特殊日子吃一块没关系' },
  { name: '饼干', alias: ['cookie','binggan'], emoji: '🍪', category: '零食', safety: 'caution', reason: '高糖+反式脂肪', tip: '选全麦少糖的品种' },
  { name: '薯片', alias: ['chips','shupian'], emoji: '🍟', category: '零食', safety: 'caution', reason: '高盐高油，促进炎症' },
  { name: '冰淇淋', alias: ['ice cream','bingqilin'], emoji: '🍦', category: '零食', safety: 'caution', reason: '高糖高脂', tip: '偶尔吃一个没关系，别天天吃' },
  { name: '坚果棒', alias: ['nut bar','jianguobang'], emoji: '🥜', category: '零食', safety: 'ok', reason: '比薯片好的零食选择', tip: '注意看含糖量' },
  { name: '红枣', alias: ['大枣','date','hongzao'], emoji: '🫘', category: '零食', safety: 'good', reason: '补血养气，天然甜味' },
  { name: '枸杞', alias: ['goji','gouqi'], emoji: '🔴', category: '零食', safety: 'ok', reason: '抗氧化，但可能增强免疫', tip: 'UCTD患者适量食用，不要大量吃（免疫增强可能是双刃剑）' },
  { name: '糖果', alias: ['candy','tangguo'], emoji: '🍬', category: '零食', safety: 'caution', reason: '纯糖，促进炎症，无营养' },

  // ==================== 加工食品 ====================
  { name: '罐头', alias: ['canned food','guantou'], emoji: '🥫', category: '加工', safety: 'caution', reason: '高盐高糖+防腐剂' },
  { name: '腌菜', alias: ['泡菜','咸菜','pickles','yancai'], emoji: '🥒', category: '加工', safety: 'caution', reason: '高盐，长期吃加重水肿' },
  { name: '速冻饺子', alias: ['frozen dumpling','jiaozi'], emoji: '🥟', category: '加工', safety: 'ok', reason: '偶尔吃方便', tip: '不如自己包的新鲜饺子' },
  { name: '外卖', alias: ['快餐','fast food','waimai'], emoji: '🥡', category: '加工', safety: 'caution', reason: '普遍高油高盐，不知道用什么油', tip: '偶尔吃可以，尽量选清淡的菜' },
  { name: '火锅', alias: ['hotpot','huoguo'], emoji: '🍲', category: '加工', safety: 'ok', reason: '底料高油高盐', tip: '选清汤锅底，多涮蔬菜和鱼肉' },
  { name: '烧烤', alias: ['BBQ','shaokao'], emoji: '🍖', category: '加工', safety: 'caution', reason: '高温烤制产生致癌物+高盐', tip: '偶尔吃，避免烤焦的部分' },

  // ==================== 保健品 ====================
  { name: '鱼油', alias: ['fish oil','yuyou','omega3'], emoji: '💊', category: '保健品', safety: 'good', reason: 'Omega-3补充剂，抗炎', tip: '选EPA+DHA含量高的品牌' },
  { name: '维生素D', alias: ['vitamin D','weishengsuD'], emoji: '💊', category: '保健品', safety: 'good', reason: '羟氯喹长期服用可能需要补充', tip: '建议查血后在医生指导下补充' },
  { name: '钙片', alias: ['calcium','gaipian'], emoji: '💊', category: '保健品', safety: 'ok', reason: '长期服药需要关注骨密度', tip: '食补优先，不够再吃钙片' },
  { name: '苜蓿补充剂', alias: ['alfalfa supplement'], emoji: '💊', category: '保健品', safety: 'avoid', reason: '严禁！任何含苜蓿成分的保健品都不能吃' },
  { name: '紫锥菊', alias: ['echinacea','zizhuiju'], emoji: '💊', category: '保健品', safety: 'avoid', reason: '免疫增强剂，可能刺激自身免疫', tip: '所有「增强免疫力」的保健品都要谨慎' },
];

// Category info for display
export const FOOD_CATEGORIES = [
  { key: '蔬菜', emoji: '🥬' },
  { key: '水果', emoji: '🍎' },
  { key: '肉蛋', emoji: '🥩' },
  { key: '主食', emoji: '🍚' },
  { key: '豆类', emoji: '🫘' },
  { key: '乳制品', emoji: '🥛' },
  { key: '坚果', emoji: '🥜' },
  { key: '油脂', emoji: '🫗' },
  { key: '调料', emoji: '🧂' },
  { key: '饮品', emoji: '🍵' },
  { key: '零食', emoji: '🍬' },
  { key: '加工', emoji: '🥫' },
  { key: '保健品', emoji: '💊' },
];

export const SAFETY_INFO = {
  good:    { label: '推荐', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', emoji: '✅' },
  ok:      { label: '适量', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', emoji: '👌' },
  caution: { label: '少吃', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', emoji: '⚠️' },
  avoid:   { label: '避免', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', emoji: '🚫' },
};

/**
 * Simple fuzzy search - matches name and aliases
 * Supports partial match, case insensitive
 */
export function searchFood(query: string): FoodItem[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();

  return FOOD_DATABASE.filter((food) => {
    if (food.name.toLowerCase().includes(q)) return true;
    if (food.alias?.some((a) => a.toLowerCase().includes(q))) return true;
    if (food.category.includes(q)) return true;
    if (food.reason.includes(q)) return true;
    return false;
  }).sort((a, b) => {
    // Exact name match first
    const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    // Then by safety level importance
    const order = { avoid: 0, caution: 1, ok: 2, good: 3 };
    return order[a.safety] - order[b.safety];
  });
}
