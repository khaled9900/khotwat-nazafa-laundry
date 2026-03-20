export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  price_per_meter?: number | null;
}

export interface CartItem extends Product {
  quantity: number;
  itemLength?: number;
  itemWidth?: number;
  meters?: number;
  notes?: string;
  price_per_meter?: number | null;
}

export const categories = [
  "كل الاصناف",
  "كنب ومراتب",
  "مفارش",
  "بطانيات",
  "جلسة نفرين حديد",
  "البسطة",
];

export const products: Product[] = [
  { id: "1", name: "موكيت", price: 8.40, category: "مفارش", emoji: "🟫" },
  { id: "2", name: "مخدة", price: 15.00, category: "مفارش", emoji: "🛌" },
  { id: "3", name: "بيت مخدة", price: 5.00, category: "مفارش", emoji: "🛏️" },
  { id: "4", name: "ستائر صغيرة", price: 30.00, category: "مفارش", emoji: "🪟" },
  { id: "5", name: "ستائر كبيرة", price: 50.00, category: "مفارش", emoji: "🪟" },
  { id: "6", name: "أ (مفرشة)", price: 7.00, category: "مفارش", emoji: "🧣" },
  { id: "7", name: "فروة سيارة", price: 15.00, category: "مفارش", emoji: "🐑" },
  { id: "8", name: "بطانية", price: 15.00, category: "بطانيات", emoji: "🧶" },
  { id: "9", name: "طوالة", price: 7.00, category: "مفارش", emoji: "🧶" },
  { id: "10", name: "موكيت فرو", price: 7.00, category: "مفارش", emoji: "🟫" },
  { id: "11", name: "سجاد صالة", price: 5.00, category: "مفارش", emoji: "🟫" },
  { id: "12", name: "كنب ثلاثي", price: 350.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "13", name: "قطعة 15", price: 15.00, category: "مفارش", emoji: "🧩" },
  { id: "14", name: "قطعة 10", price: 10.00, category: "مفارش", emoji: "🧩" },
  { id: "15", name: "قطعة 20", price: 20.00, category: "مفارش", emoji: "🧩" },
  { id: "16", name: "قطعة 25", price: 25.00, category: "مفارش", emoji: "🧩" },
  { id: "17", name: "30", price: 30.00, category: "مفارش", emoji: "🧩" },
  { id: "18", name: "35", price: 35.00, category: "مفارش", emoji: "🧩" },
  { id: "19", name: "قطعه 40", price: 40.00, category: "مفارش", emoji: "🧩" },
  { id: "20", name: "شرشف", price: 5.00, category: "مفارش", emoji: "🛏️" },
  { id: "21", name: "دعاسة", price: 5.00, category: "مفارش", emoji: "🟫" },
  { id: "22", name: "مفرشة4 متر", price: 10.00, category: "مفارش", emoji: "🧣" },
  { id: "23", name: "مرتبة", price: 75.00, category: "كنب ومراتب", emoji: "🛏️" },
  { id: "24", name: "سجادة رحلات", price: 30.00, category: "مفارش", emoji: "🟫" },
  { id: "25", name: "مرتبة نفرين", price: 200.00, category: "كنب ومراتب", emoji: "🛏️" },
  { id: "26", name: "نفرين 150", price: 150.00, category: "كنب ومراتب", emoji: "🛏️" },
  { id: "27", name: "بيت مسند وسط", price: 15.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "28", name: "مسند", price: 20.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "29", name: "جاكيت", price: 15.00, category: "مفارش", emoji: "🧥" },
  { id: "30", name: "بيت تكاية", price: 10.00, category: "مفارش", emoji: "🛌" },
  { id: "31", name: "جلسة نفرين حد", price: 18.00, category: "جلسة نفرين حديد", emoji: "🪑" },
  { id: "32", name: "بطانية نفرين", price: 20.00, category: "بطانيات", emoji: "🧶" },
  { id: "33", name: "سجادة رحلات20", price: 20.00, category: "مفارش", emoji: "🟫" },
  { id: "34", name: "سجادة رحلات25", price: 25.00, category: "مفارش", emoji: "🟫" },
  { id: "35", name: "سجادة رحلات 1", price: 15.00, category: "مفارش", emoji: "🟫" },
  { id: "36", name: "كنب 100ريال", price: 100.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "37", name: "كنب 150ريال", price: 150.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "38", name: "كنب 200 ريال", price: 200.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "39", name: "كنب 250 ريال", price: 250.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "40", name: "كنب 300 ريال", price: 300.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "41", name: "كنب 450ريال", price: 450.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "42", name: "كنب 500ريال", price: 500.00, category: "كنب ومراتب", emoji: "🛋️" },
  { id: "43", name: "لباد سرير نفر", price: 20.00, category: "كنب ومراتب", emoji: "🛏️" },
  { id: "44", name: "لباد سرير نفر", price: 40.00, category: "كنب ومراتب", emoji: "🛏️" },
  { id: "45", name: "مرتبة نفرين", price: 15.00, category: "كنب ومراتب", emoji: "🛏️" },
  { id: "46", name: "مفرشة4 متر", price: 60.00, category: "مفارش", emoji: "🧣" },
];
