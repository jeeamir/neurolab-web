// Видео для первого экрана. Положите файл в папку assets/ и укажите путь ниже.
// Путь пишется БЕЗ слэша в начале (assets/..., а не /assets/...), иначе на GitHub Pages файл не найдётся.
// heroVideoMobile — необязательная вертикальная версия для телефонов.
window.NEUROLAB_CONFIG = Object.assign({
  heroVideo: 'assets/clinic-hero.mp4',
  heroVideoMobile: 'assets/clinic-hero-mobile.mp4',
  // Номер WhatsApp клиники: только цифры, с кодом страны. Все кнопки «Записаться» открывают чат с ним.
  whatsapp: '77085904094'
}, window.NEUROLAB_CONFIG || {});
