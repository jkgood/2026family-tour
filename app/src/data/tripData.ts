export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string[];
  tags: string[];
  link?: string;
  mapQuery?: string;
  phone?: string;
  address?: string;
  hours?: string;
}

export interface DayPlan {
  date: string;
  weekday: string;
  title: string;
  items: ItineraryItem[];
}

export interface DishItem {
  id: string;
  name: string;
  price: number;
  priceLarge?: number;
  unit?: string; // e.g. "份", "隻", "顆"
  category: string;
  note?: string;
  isVegetarian?: boolean;
}

export interface HotpotOption {
  meats: { id: string; name: string; price: number }[];
  soups: string[];
  sides: string[];
}

export interface MealInfo {
  id: string;
  dateKey: string; // '1031_lunch' | '1031_dinner' | '1101_lunch'
  restaurant: string;
  mealType: '合菜 (預先點)' | '火鍋 (現場點)';
  timing: string;
  phone?: string;
  address?: string;
  note: string;
  serviceChargePercent?: number;
  originalMenuImages?: string[];
  dishes?: DishItem[];
  hotpot?: HotpotOption;
}

export const ITINERARY_DATA: DayPlan[] = [
  {
    date: '2026/10/31',
    weekday: '星期六',
    title: '苗栗客家文化之旅 ＆ 飛牛牧場宿營',
    items: [
      {
        id: 'day1-1',
        time: '10:00',
        title: '臺灣客家文化館',
        location: '苗栗縣銅鑼鄉九湖村銅科南路6號',
        description: [
          '參觀園區 + 親子手作活動',
          '活動項目：客家食(福菜) + 翻閱舊篇章(橡木桌遊)',
          '美拍玻璃空橋、暢遊免門票親子遊戲室',
          '（若時間充裕可彈性順遊銅鑼茶廠）'
        ],
        tags: ['免門票', '親子手作', '室內冷氣', '打卡熱點'],
        link: 'https://almablog.tw/blog/post/seal-duck',
        mapQuery: '臺灣客家文化館'
      },
      {
        id: 'day1-2',
        time: '13:00',
        title: '連記甘味音樂花園餐廳（午餐）',
        location: '苗栗縣銅鑼鄉九湖村五鄰40號',
        description: [
          '百年祖傳封鴨、招牌客家特色料理',
          '提供合菜提前點餐，合菜需加收 10% 服務費',
          '小份約2-4人份，大份約8-10人份'
        ],
        tags: ['合菜預點', '百年封鴨', '花園餐廳'],
        phone: '037-981228 / 037-981-848',
        hours: '11:00-14:00 / 17:00-20:00',
        address: '苗栗縣銅鑼鄉九湖村五鄰40號',
        mapQuery: '連記甘味音樂花園餐廳'
      },
      {
        id: 'day1-3',
        time: '15:00',
        title: '飛牛牧場（午後入園與牧場體驗）',
        location: '苗栗縣通霄鎮南和里166號',
        description: [
          '大片草皮放風、動物互動餵食體驗（牛、羊、鴨寶寶大遊行）',
          '住宿房型包含：入園門票、停車費、迎賓乳製品、翌日森呼吸早餐',
          '進房時間：16:00 以後'
        ],
        tags: ['親子首選', '動物餵食', '大草原', '迎賓牛奶'],
        mapQuery: '飛牛牧場'
      },
      {
        id: 'day1-4',
        time: '17:00',
        title: '犇牛牛火鍋（晚餐 - 牧場內）',
        location: '飛牛牧場園區內餐廳',
        description: [
          '招牌牧場自產「鮮奶湯底」個人鍋',
          '兒童身高 100cm 以下免費',
          '若二人共鍋加收 $200（可全額折抵單點）'
        ],
        tags: ['牧場鮮奶鍋', '個人火鍋', '現場點餐'],
        mapQuery: '飛牛牧場 犇牛牛餐廳'
      }
    ]
  },
  {
    date: '2026/11/01',
    weekday: '星期日',
    title: '晨曦牧場野趣 ＆ 蒸烹派客家老滋味',
    items: [
      {
        id: 'day2-1',
        time: '08:00',
        title: '飛牛牧場（活力早餐）',
        location: '飛牛牧場餐廳',
        description: ['住宿附贈「森呼吸早饗宴」，享受晨光與健康早餐'],
        tags: ['住宿附贈', '自助早餐']
      },
      {
        id: 'day2-2',
        time: '09:30',
        title: '晨間牧場互動 ＆ 散步',
        location: '飛牛牧場園區',
        description: [
          '觀賞擠牛奶、鴨鴨逛大街等晨間活動',
          '⚠️ 提醒：請於 11:00 前辦妥退房手續'
        ],
        tags: ['晨間體驗', '退房提醒 11:00']
      },
      {
        id: 'day2-3',
        time: '12:00',
        title: '三義蒸烹派客家美食餐廳（午餐）',
        location: '苗栗縣三義鄉雙湖村雙湖5之5號1樓',
        description: [
          '傳承三代傳統客家阿嬤好味道、客家小炒比賽冠軍名店',
          '素食需提前預約，可先選好大小份',
          '預先點菜快速出餐不用等'
        ],
        tags: ['冠軍客家小炒', '三代老店', '合菜預點'],
        phone: '037-876482 / 0928-809067',
        address: '苗栗縣三義鄉雙湖村雙湖5之5號1樓',
        mapQuery: '三義蒸烹派客家美食餐廳'
      },
      {
        id: 'day2-4',
        time: '14:00',
        title: '採果歡樂行程（四姐洽詢中）',
        location: '苗栗在地果園',
        description: [
          '四姐洽詢中，視當週店家果園產量與開放狀況彈性調整',
          '體驗親採當令新鮮水果的樂趣'
        ],
        tags: ['採果體驗', '依季節開放', '歡樂賦歸'],
        link: 'https://maps.app.goo.gl/sct55RtLdyfHvBRK6?g_st=il',
        mapQuery: '苗栗採果'
      }
    ]
  }
];

export const MEALS_DATA: MealInfo[] = [
  {
    id: 'meal-1',
    dateKey: '1031_lunch',
    restaurant: '連記甘味音樂花園餐廳',
    mealType: '合菜 (預先點)',
    timing: '10/31 (六) 13:00 午餐',
    phone: '037-981228 / 037-981-848',
    address: '苗栗縣銅鑼鄉九湖村五鄰40號',
    serviceChargePercent: 10,
    note: '計費說明：小份約 2-4 人份，大份約 8-10 人份。需加收 10% 服務費。',
    originalMenuImages: ['/images/image1.png', '/images/messageImage_1792056658006.jpg'],
    dishes: [
      { id: 'lj-1', name: '百年祖傳封鴨二吃 (小)', price: 880, category: '招牌必點', note: '鎮店之寶招牌' },
      { id: 'lj-2', name: '百年祖傳封鴨二吃 (大)', price: 1280, category: '招牌必點', note: '推薦多人份' },
      { id: 'lj-3', name: '清蒸魚', price: 750, category: '招牌海鮮' },
      { id: 'lj-4', name: '泰式檸檬魚', price: 750, category: '招牌海鮮' },
      { id: 'lj-5', name: '高麗魚', price: 750, category: '招牌海鮮' },
      { id: 'lj-6', name: '起士海鮮酥', price: 880, category: '招牌海鮮' },
      { id: 'lj-7', name: '凱撒蝦球 (小)', price: 380, category: '招牌海鮮' },
      { id: 'lj-8', name: '凱撒蝦球 (大)', price: 680, category: '招牌海鮮' },
      { id: 'lj-9', name: '乾燒蝦球 (小)', price: 380, category: '招牌海鮮' },
      { id: 'lj-10', name: '乾燒蝦球 (大)', price: 680, category: '招牌海鮮' },
      { id: 'lj-11', name: '白醬蝦球 (小)', price: 380, category: '招牌海鮮' },
      { id: 'lj-12', name: '白醬蝦球 (大)', price: 680, category: '招牌海鮮' },
      { id: 'lj-13', name: '鹽酥溪蝦 (小)', price: 280, category: '招牌海鮮' },
      { id: 'lj-14', name: '鹽酥溪蝦 (大)', price: 380, category: '招牌海鮮' },
      { id: 'lj-15', name: '晶鹽烤大蝦 (每隻)', price: 100, category: '招牌海鮮', unit: '隻' },
      
      { id: 'lj-16', name: '大漠孜然沙朗 (小)', price: 480, category: '肉品肉類' },
      { id: 'lj-17', name: '大漠孜然沙朗 (大)', price: 680, category: '肉品肉類' },
      { id: 'lj-18', name: '火山牛 (小)', price: 480, category: '肉品肉類' },
      { id: 'lj-19', name: '火山牛 (大)', price: 680, category: '肉品肉類' },
      { id: 'lj-20', name: '客家小炒 (小)', price: 380, category: '肉品肉類' },
      { id: 'lj-21', name: '客家小炒 (大)', price: 480, category: '肉品肉類' },
      { id: 'lj-22', name: '薑絲大腸 (小)', price: 380, category: '肉品肉類' },
      { id: 'lj-23', name: '薑絲大腸 (大)', price: 480, category: '肉品肉類' },
      { id: 'lj-24', name: '糖醋里肌 (小)', price: 350, category: '肉品肉類' },
      { id: 'lj-25', name: '糖醋里肌 (大)', price: 480, category: '肉品肉類' },
      { id: 'lj-26', name: '客家爌肉-限量 (小)', price: 380, category: '肉品肉類' },
      { id: 'lj-27', name: '客家爌肉-限量 (大)', price: 650, category: '肉品肉類' },

      { id: 'lj-28', name: '金沙豆腐 (小)', price: 200, category: '蔬菜蛋品' },
      { id: 'lj-29', name: '金沙豆腐 (大)', price: 300, category: '蔬菜蛋品' },
      { id: 'lj-30', name: '打拋四季豆 (小)', price: 280, category: '蔬菜蛋品' },
      { id: 'lj-31', name: '櫻花蝦高麗菜 (小)', price: 280, category: '蔬菜蛋品' },
      { id: 'lj-32', name: '櫻花蝦高麗菜 (大)', price: 380, category: '蔬菜蛋品' },
      { id: 'lj-33', name: '塔香茄子 (小)', price: 280, category: '蔬菜蛋品' },
      { id: 'lj-34', name: '時令鮮蔬 (小)', price: 160, category: '蔬菜蛋品' },
      { id: 'lj-35', name: '時令鮮蔬 (大)', price: 250, category: '蔬菜蛋品' },
      { id: 'lj-36', name: '菜脯蛋', price: 200, category: '蔬菜蛋品' },
      { id: 'lj-37', name: '九層塔蛋 (平日限量)', price: 200, category: '蔬菜蛋品' },

      { id: 'lj-38', name: '古早味雲片湯 (小)', price: 380, category: '湯品點心' },
      { id: 'lj-39', name: '古早味雲片湯 (大)', price: 680, category: '湯品點心' },
      { id: 'lj-40', name: '懷舊 QQ 圓 (每顆)', price: 48, category: '湯品點心', unit: '顆' },
      { id: 'lj-41', name: '流口水芝麻包 (每顆)', price: 25, category: '湯品點心', unit: '顆' }
    ]
  },
  {
    id: 'meal-2',
    dateKey: '1031_dinner',
    restaurant: '犇牛牛火鍋（飛牛牧場內）',
    mealType: '火鍋 (現場點)',
    timing: '10/31 (六) 17:00 晚餐',
    note: '兒童 100cm 以下免費。採個人套餐模式，二人共鍋須加收 $200（可抵單點）。',
    originalMenuImages: ['/images/image2.png'],
    hotpot: {
      meats: [
        { id: 'hp-1', name: '板腱牛肉鍋套餐', price: 450 },
        { id: 'hp-2', name: '雪花五花牛肉鍋套餐', price: 480 },
        { id: 'hp-3', name: '梅花豬肉鍋套餐', price: 420 },
        { id: 'hp-4', name: '去骨雞腿肉鍋套餐', price: 400 },
        { id: 'hp-5', name: '羊五花肉捲鍋套餐', price: 420 },
        { id: 'hp-6', name: '農園鮮菇蔬菜盤鍋套餐 (蔬食)', price: 380 },
        { id: 'hp-7', name: '鮭魚菲力鍋套餐', price: 450 },
        { id: 'hp-8', name: '無骨牛小排鍋套餐', price: 620 }
      ],
      soups: ['牧場自產鮮奶湯底 (最推薦)', '日式昆布湯底', '進口韓式泡菜湯底'],
      sides: ['白飯', '非基改冬粉', '王子麵']
    }
  },
  {
    id: 'meal-3',
    dateKey: '1101_lunch',
    restaurant: '三義蒸烹派客家美食餐廳',
    mealType: '合菜 (預先點)',
    timing: '11/01 (日) 12:00 午餐',
    phone: '037-876482 / 0928-809067',
    address: '苗栗縣三義鄉雙湖村雙湖5之5號1樓',
    note: '傳承三代客家美味。欲吃客製化素食者請註記提前準備。「需預訂」分頁的菜色須事先電話預訂，★ 為招牌菜；「合菜」分頁為套餐價，另有「★客製化菜單」價格另計，請洽店家。',
    originalMenuImages: ['/images/image3.png', '/images/messageImage_1792056678713.jpg'],
    dishes: [
      // ===== 需預訂（★ 為招牌菜）=====
      { id: 'zpr-1', name: '客味香酥鴨', price: 900, category: '需預訂', note: '★ 招牌菜・需預訂' },
      { id: 'zpr-2', name: '蒸烹芋香鴨 (大)', price: 600, category: '需預訂', note: '★ 招牌菜・需預訂' },
      { id: 'zpr-3', name: '蒸烹芋香鴨 (小)', price: 300, category: '需預訂', note: '★ 招牌菜・需預訂' },
      { id: 'zpr-4', name: '家傳回味魚 (大)', price: 600, category: '需預訂', note: '★ 招牌菜・需預訂' },
      { id: 'zpr-5', name: '家傳回味魚 (小)', price: 300, category: '需預訂', note: '★ 招牌菜・需預訂' },
      { id: 'zpr-6', name: '麻油土雞', price: 700, category: '需預訂', note: '需預訂' },
      { id: 'zpr-7', name: '金雞抱蛋', price: 800, category: '需預訂', note: '需預訂' },
      { id: 'zpr-8', name: '紅燒蹄膀', price: 500, category: '需預訂', note: '需預訂' },
      { id: 'zpr-9', name: '椒鹽全蹄', price: 700, category: '需預訂', note: '需預訂' },
      { id: 'zpr-10', name: '幸福香鬆', price: 660, category: '需預訂', note: '需預訂' },
      { id: 'zpr-11', name: '傳家八寶扣香芋 (可素食)', price: 900, category: '需預訂', note: '需預訂', isVegetarian: true },
      { id: 'zpr-12', name: '福氣滿堂', price: 900, category: '需預訂', note: '需預訂' },
      { id: 'zpr-13', name: '爵士鴨', price: 900, category: '需預訂', note: '需預訂' },
      { id: 'zpr-14', name: '藥膳羊肉', price: 750, category: '需預訂', note: '需預訂' },
      { id: 'zpr-15', name: '清燉羊肉', price: 700, category: '需預訂', note: '需預訂' },
      { id: 'zpr-16', name: '紅燒牛腩', price: 600, category: '需預訂', note: '需預訂' },
      { id: 'zpr-17', name: '牛腩火鍋', price: 700, category: '需預訂', note: '需預訂' },
      { id: 'zpr-18', name: '果律四寶湯 (可素食)', price: 650, category: '需預訂', note: '需預訂', isVegetarian: true },
      { id: 'zpr-19', name: '客味四寶湯', price: 600, category: '需預訂', note: '需預訂' },
      { id: 'zpr-20', name: '筍尖蹄膀', price: 600, category: '需預訂', note: '需預訂' },

      // ===== 合菜套餐（★客製化菜單另計，請洽店家）=====
      { id: 'zph-1', name: '三菜一湯', price: 800, unit: '套', category: '合菜' },
      { id: 'zph-2', name: '五菜一湯', price: 1500, unit: '套', category: '合菜' },
      { id: 'zph-3', name: '六菜一湯', price: 2000, unit: '套', category: '合菜' },
      { id: 'zph-4', name: '七菜一湯', price: 2500, unit: '套', category: '合菜' },
      { id: 'zph-5', name: '八菜一湯', price: 3200, unit: '套', category: '合菜' },
      { id: 'zph-6', name: '九菜一湯', price: 4000, unit: '套', category: '合菜' },

      { id: 'zpp-1', name: '跑山黃金雞 (小)', price: 480, category: '禽肉經典' },
      { id: 'zpp-2', name: '跑山黃金雞 (大)', price: 600, category: '禽肉經典' },
      { id: 'zpp-3', name: '蔥油土雞 (小)', price: 480, category: '禽肉經典' },
      { id: 'zpp-4', name: '蔥油土雞 (大)', price: 600, category: '禽肉經典' },
      { id: 'zpp-5', name: '梅干扣肉 (小)', price: 300, category: '豬牛熱炒', note: '招牌下飯' },
      { id: 'zpp-6', name: '梅干扣肉 (大)', price: 500, category: '豬牛熱炒', note: '招牌下飯' },
      { id: 'zpp-7', name: '坊間/冠軍客家小炒 (小)', price: 350, category: '招牌必點' },
      { id: 'zpp-8', name: '坊間/冠軍客家小炒 (大)', price: 450, category: '招牌必點' },
      { id: 'zpp-9', name: '苗栗客家小炒 (小)', price: 450, category: '招牌必點' },
      { id: 'zpp-10', name: '苗栗客家小炒 (大)', price: 550, category: '招牌必點' },
      { id: 'zpp-11', name: '薑絲大腸 (小)', price: 300, category: '招牌必點' },
      { id: 'zpp-12', name: '薑絲大腸 (大)', price: 450, category: '招牌必點' },
      { id: 'zpp-13', name: '紅燒爌肉 (小)', price: 420, category: '豬牛熱炒' },
      { id: 'zpp-14', name: '紅燒爌肉 (大)', price: 550, category: '豬牛熱炒' },
      { id: 'zpp-15', name: '酥炸肥腸 (小)', price: 250, category: '豬牛熱炒' },
      { id: 'zpp-16', name: '酥炸肥腸 (大)', price: 380, category: '豬牛熱炒' },
      { id: 'zpp-17', name: '炒客家鹹豬肉 (小)', price: 220, category: '豬牛熱炒' },
      { id: 'zpp-18', name: '炒客家鹹豬肉 (大)', price: 350, category: '豬牛熱炒' },
      { id: 'zpp-19', name: '炸客家鹹豬肉 (小)', price: 250, category: '豬牛熱炒' },
      { id: 'zpp-20', name: '炸客家鹹豬肉 (大)', price: 400, category: '豬牛熱炒' },
      { id: 'zpp-21', name: '清蒸客味鮮魚', price: 420, category: '海鮮料理' },
      { id: 'zpp-22', name: '糖醋魚', price: 520, category: '海鮮料理' },
      { id: 'zpp-23', name: '清蒸海上鮮', price: 600, category: '海鮮料理' },
      { id: 'zpp-24', name: '炒麵 (小-可素)', price: 80, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-25', name: '炒麵 (大-可素)', price: 240, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-26', name: '炒飯 (小-可素)', price: 80, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-27', name: '炒飯 (大-可素)', price: 240, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-28', name: '炒粄條 (小-可素)', price: 80, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-29', name: '炒粄條 (大-可素)', price: 240, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-30', name: '炒米粉 (小-可素)', price: 100, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-31', name: '炒米粉 (大-可素)', price: 300, category: '主食米麵', isVegetarian: true },
      { id: 'zpp-32', name: '客家茄子 (小-可素)', price: 180, category: '時蔬豆腐', isVegetarian: true },
      { id: 'zpp-33', name: '客家茄子 (大-可素)', price: 220, category: '時蔬豆腐', isVegetarian: true },
      { id: 'zpp-34', name: '苦瓜鹹蛋 (小-可素)', price: 180, category: '時蔬豆腐', isVegetarian: true },
      { id: 'zpp-35', name: '客家豆腐 (小-可素)', price: 180, category: '時蔬豆腐', isVegetarian: true },
      { id: 'zpp-36', name: '炒當季時蔬 (小-可素)', price: 150, category: '時蔬豆腐', isVegetarian: true },
      { id: 'zpp-37', name: '炒當季時蔬 (大-可素)', price: 250, category: '時蔬豆腐', isVegetarian: true },
      { id: 'zpp-38', name: '福菜肉片湯', price: 220, category: '客家傳統湯品' },
      { id: 'zpp-39', name: '酸菜肉片湯', price: 220, category: '客家傳統湯品' },
      { id: 'zpp-40', name: '酸菜豬肚湯', price: 350, category: '客家傳統湯品' },
      { id: 'zpp-41', name: '福菜肚片湯', price: 350, category: '客家傳統湯品' },
      { id: 'zpp-42', name: '鳳梨苦瓜雞湯', price: 350, category: '客家傳統湯品' },
      { id: 'zpp-43', name: '青菜蛋花湯', price: 100, category: '客家傳統湯品', isVegetarian: true }
    ]
  }
];

export const DEFAULT_MEMBERS = [
  '大姊', '二姊', '三姊', '四姊', '爸爸', '媽媽', '五妹', '小美', '小宇'
];
