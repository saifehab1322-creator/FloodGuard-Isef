// Project-generated alerts only. They are NOT official government warnings.
const RECS = {
  moderate: {
    en: ['Follow official weather forecasts and warnings.', 'Avoid low-lying roads, wadis and underpasses during rainfall.', 'Keep emergency contacts and a charged phone ready.'],
    ar: ['تابع التوقعات والتحذيرات الرسمية للطقس.', 'تجنب الطرق المنخفضة والأودية والأنفاق أثناء هطول الأمطار.', 'جهّز أرقام الطوارئ وهاتفًا مشحونًا.'],
  },
  high: {
    en: ['Do not cross flooded roads or wadis on foot or by car.', 'Move vehicles and valuables to higher ground.', 'Follow instructions from civil protection and local authorities.', 'Contact emergency services if you are in danger.'],
    ar: ['لا تعبر الطرق أو الأودية المغمورة سيرًا أو بالسيارة.', 'انقل المركبات والمقتنيات الثمينة إلى مكان مرتفع.', 'اتبع تعليمات الحماية المدنية والجهات المحلية.', 'اتصل بخدمات الطوارئ إذا كنت في خطر.'],
  },
};
export function buildAlert(level, score, loc) {
  if (level !== 'moderate' && level !== 'high') return null;
  const en = level === 'high' ? 'High' : 'Moderate';
  const ar = level === 'high' ? 'مرتفع' : 'متوسط';
  return {
    severity: level,
    message_en: `${loc.name_en}: ${en} flood risk index (${score}/100). Project-generated indicator, not an official warning.`,
    message_ar: `${loc.name_ar || loc.name_en}: مؤشر خطر السيول ${ar} (${score}/100). مؤشر من المشروع وليس تحذيرًا رسميًا.`,
    recommendations: RECS[level],
  };
}
