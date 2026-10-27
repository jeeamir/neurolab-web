'use strict';
// Preview configuration. Add only clinic-confirmed contacts and media before public release.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const state = { selected: 'Неврология', filter: 'all', search: '' };
try { state.selected = sessionStorage.getItem('neurolab-direction') || 'Неврология'; } catch {}
const allowed = ['Первая консультация', 'Неврология', 'МРТ', 'КТ', 'УЗИ', 'Иглотерапия', 'ЛФК', 'Реабилитация'];
if (!allowed.includes(state.selected)) state.selected = 'Неврология';
let toastTimer;
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
function selectDirection(name, announce = false) {
  if (!allowed.includes(name)) return;
  state.selected = name;
  try { sessionStorage.setItem('neurolab-direction', name); } catch {}
  $$('[data-selected-text]').forEach(el => el.textContent = name);
  $$('[data-select]').forEach(el => {
    const selected = el.dataset.select === name;
    el.setAttribute('aria-pressed', String(selected));
    el.closest('.choice-card')?.classList.toggle('chosen', selected);
    const label = el.querySelector('.select-label');
    const mark = el.querySelector('.select-mark');
    if (label) label.textContent = selected ? 'Выбрано' : 'Выбрать';
    if (mark) mark.textContent = selected ? '−' : '+';
  });
  if (announce) toast('Выбрано: ' + name + '. Направление добавлено в запрос.');
}
selectDirection(state.selected);
$$('[data-select]').forEach(button => button.addEventListener('click', () => selectDirection(button.dataset.select, true)));

const menu = $('#mobile-nav');
const menuButton = $('.menu-toggle');
function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Открыть меню'); }
menuButton.addEventListener('click', () => {
  const open = menu.hidden; menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
$$('a', menu).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); } });
matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

// Native dialogs provide focus trapping, Escape dismissal and focus restoration.
function openDialog(dialog) {
  $$('dialog[open]').forEach(d => d.close());
  dialog.showModal(); document.body.classList.add('dialog-open');
}
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
  });
});
const booking = $('#booking-dialog');
const form = $('#booking-form');
const result = $('#booking-result');
function openBooking(service) {
  const selected = service === 'selected' ? state.selected : service || state.selected;
  $('#booking-service').value = allowed.includes(selected) ? selected : 'Первая консультация';
  form.hidden = false; result.hidden = true; $('#copy-status').textContent = '';
  openDialog(booking);
}
document.addEventListener('click', e => {
  const button = e.target.closest('[data-book]');
  if (button) openBooking(button.dataset.book);
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const phone = $('#booking-phone');
  const digits = phone.value.replace(/\D/g, '');
  phone.setCustomValidity(digits.length >= 10 && digits.length <= 15 ? '' : 'Введите корректный номер телефона: от 10 до 15 цифр.');
  if (!form.reportValidity()) return;
  const name = $('#booking-name').value.trim();
  if (!name) { $('#booking-name').setCustomValidity('Укажите ваше имя.'); form.reportValidity(); return; }
  const service = $('#booking-service').value;
  selectDirection(service);
  const message = `Здравствуйте! Хочу записаться в Neurolab Plus.\nНаправление: ${service}.\nИмя: ${name}.\nТелефон: ${phone.value.trim()}.\nУдобное время для связи: ${$('#booking-time').value}.\nПожалуйста, подскажите ближайшее время приёма и подтвердите стоимость.`;
  $('#message-preview').value = message;
  form.hidden = true; result.hidden = false;
  $('#copy-message').focus();
});
$('#booking-phone').addEventListener('input', e => e.target.setCustomValidity(''));
$('#booking-name').addEventListener('input', e => e.target.setCustomValidity(''));
$('#edit-message').addEventListener('click', () => { result.hidden = true; form.hidden = false; $('#booking-name').focus(); });
$('#copy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#message-preview').value);
    $('#copy-status').textContent = 'Сообщение скопировано. В клинику оно не отправлено.';
  } catch {
    $('#message-preview').focus(); $('#message-preview').select();
    $('#copy-status').textContent = 'Автоматическое копирование недоступно. Текст выделен: скопируйте его вручную.';
  }
});
booking.addEventListener('close', () => { form.reset(); $('#message-preview').value = ''; $('#copy-status').textContent = ''; });

const info = {
  license: ['Медицинская лицензия', 'Лицензия клиники будет доступна здесь для увеличения и просмотра.', '[НУЖНО: скан, номер, срок действия и разрешённые юридические формулировки]. В превью документ не подменяется образцом.'],
  certificates: ['Сертификаты специалистов', 'Здесь появится галерея подтверждённых документов врачей.', '[НУЖНО: сертификаты, имена специалистов и согласие на публикацию].'],
  equipment: ['Документы на оборудование', 'Документы будут сгруппированы по оборудованию и методам.', '[НУЖНО: подтверждённые сертификаты и список действующего оборудования].'],
  doctor: ['Познакомимся ближе', 'Карточка врача будет содержать имя, специальность, квалификацию, опыт и расписание.', '[НУЖНО: данные врача, настоящее фото, сертификаты и согласие на публикацию]. Изображение в этом превью иллюстративное.'],
  procedures: ['Две процедуры после консультации', 'По брифу Neurolab Plus после консультации предусмотрены две бесплатные процедуры. Их подбирает врач индивидуально по показаниям.', '[НУЖНО: перечень процедур, критерии участия, ограничения и срок действия предложения].'],
  route: ['Как добраться', 'После подтверждения адреса здесь появятся карта, ориентиры и ссылка на построение маршрута.', '[НУЖНО: точный адрес клиники, вход, парковка и ссылка на карту].'],
  privacy: ['Конфиденциальность в превью', 'Форма работает в вашем браузере. Имя и телефон не передаются на сервер, не записываются в хранилище и удаляются при закрытии окна. Вы сами можете скопировать подготовленное сообщение.', 'В течение сессии браузер запоминает только выбранное направление. [НУЖНО: утверждённая политика клиники и юридические данные перед запуском реальной записи].']
};
function showInfo(key) {
  const data = info[key]; if (!data) return;
  const root = $('#info-content'); root.replaceChildren();
  const heading = document.createElement('h2'); heading.textContent = data[0]; root.append(heading);
  data.slice(1).forEach(text => { const p = document.createElement('p'); p.textContent = text; root.append(p); });
  openDialog($('#info-dialog'));
}
$$('[data-info]').forEach(el => el.addEventListener('click', () => showInfo(el.dataset.info)));
$$('[data-service-detail]').forEach(el => el.addEventListener('click', () => {
  const name = el.dataset.serviceDetail;
  const root = $('#info-content'); root.replaceChildren();
  const h = document.createElement('h2'); h.textContent = name; root.append(h);
  const p = document.createElement('p'); p.textContent = 'Направление указано в брифе клиники. Состав услуги, доступность и стоимость уточняются перед записью.'; root.append(p);
  const note = document.createElement('p'); note.textContent = '[НУЖНО: описание, условия и цена услуги]'; root.append(note);
  const button = document.createElement('button'); button.className = 'btn btn-primary'; button.textContent = 'Записаться'; button.dataset.book = name; root.append(button);
  openDialog($('#info-dialog'));
}));

// Tab groups are independent. Each keeps its own selected panel and focus order.
$$('[role="tablist"]').forEach(list => {
  const tabs = $$('[role="tab"]', list);
  function activateTab(tab) {
    tabs.forEach(t => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
      const vertical = list.getAttribute('aria-orientation') === 'vertical';
      let next;
      if (e.key === 'ArrowRight' || (vertical && e.key === 'ArrowDown')) next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft' || (vertical && e.key === 'ArrowUp')) next = tabs[(i + tabs.length - 1) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs.at(-1);
      if (next) { e.preventDefault(); activateTab(next); next.focus(); }
    });
  });
});

const search = $('#service-search');
function filterServices() {
  let count = 0;
  $$('.catalog-card').forEach(card => {
    const visible = (state.filter === 'all' || card.dataset.category === state.filter) && card.dataset.search.includes(state.search.trim().toLocaleLowerCase('ru'));
    card.hidden = !visible; if (visible) count++;
  });
  $('#result-count').textContent = `Найдено направлений: ${count}`;
  $('#empty-state').hidden = count !== 0;
  $('#reset-filters').hidden = state.filter === 'all' && !state.search;
  $$('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.filter === state.filter)));
}
function resetFilters() { state.filter = 'all'; state.search = ''; search.value = ''; filterServices(); }
if (search) {
  search.addEventListener('input', () => { state.search = search.value; filterServices(); });
  $$('[data-filter]').forEach(el => el.addEventListener('click', () => {
    state.filter = el.dataset.filter; filterServices();
    if (el.hasAttribute('data-scroll')) $('#catalog')?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  }));
  $('#reset-filters').addEventListener('click', resetFilters);
  $('[data-reset]').addEventListener('click', resetFilters);
}
$('#download-checklist')?.addEventListener('click', () => {
  const text = 'NEUROLAB PLUS\nПАМЯТКА ПЕРЕД ПЕРВОЙ КОНСУЛЬТАЦИЕЙ\n\nВозьмите с собой:\n• Предыдущие заключения и результаты обследований.\n• Список принимаемых препаратов.\n• Вопросы, которые хотите задать врачу.\n\nДо визита уточните у администратора:\n• Адрес, дату и время приёма.\n• Имя специалиста и стоимость консультации.\n• Условия предложения с двумя процедурами.\n\nЭто памятка из дизайн-превью, а не подтверждение записи.\nКонтакты клиники ещё не предоставлены.';
  const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'Neurolab-Plus-памятка.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Памятка сохранена');
});

// Reserve the image composition while an actual file is loading.
// Missing clinic documents are explained as missing, not shown as loading forever.
$$('.consultation-photo img, .portrait-image img, .catalog-image img, .neuro-doctor-photo img').forEach(img => {
  const frame = img.parentElement;
  let skeleton;
  const finish = () => {
    frame.removeAttribute('aria-busy');
    skeleton?.remove();
    if (!img.naturalWidth && !frame.querySelector('.media-failure')) {
      const fallback = document.createElement('span');
      fallback.className = 'media-failure';
      fallback.textContent = 'Изображение временно недоступно';
      frame.append(fallback);
    }
  };
  if (img.complete) { finish(); return; }
  frame.classList.add('media-loading');
  frame.setAttribute('aria-busy', 'true');
  skeleton = document.createElement('span');
  skeleton.className = 'media-skeleton';
  skeleton.setAttribute('aria-hidden', 'true');
  frame.append(skeleton);
  img.addEventListener('load', finish, {once:true});
  img.addEventListener('error', finish, {once:true});
});
