/* Видео в hero. Пока видео не загрузилось (или отключено), виден постер. */
(() => {
  const video = document.querySelector('#hero-video');
  if (!video) return;
  const stage = video.closest('.hero');
  const plane = video.parentElement;
  const toggle = document.querySelector('#hero-video-toggle');
  const toggleText = toggle?.querySelector('.toggle-text');
  const config = window.NEUROLAB_CONFIG || {};
  const small = matchMedia('(max-width: 650px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let visible = true, userPaused = false, manualPlay = false, failed = false;
  let selectedSource = '', attempt = 0;
  const source = () => (small.matches && config.heroVideoMobile) ? config.heroVideoMobile : config.heroVideo;
  const automatic = () => !reduced.matches && !connection?.saveData && !userPaused;

  function updateButton() {
    if (!toggle) return;
    const playing = !video.paused;
    if (toggleText) toggleText.textContent = playing ? 'Пауза' : 'Видео';
    toggle.setAttribute('aria-label', playing ? 'Приостановить видео' : 'Включить видео');
    toggle.setAttribute('aria-pressed', String(playing));
  }
  function stop() { attempt++; video.pause(); updateButton(); }
  async function play() {
    if (!source() || failed || !visible || document.hidden) return;
    if (!selectedSource) {
      selectedSource = source();
      video.src = selectedSource;
      video.muted = true;
      video.load();
    }
    const current = ++attempt;
    try { await video.play(); if (current === attempt) updateButton(); }
    catch { if (current === attempt) updateButton(); }
  }
  function reconcile() {
    if (visible && !document.hidden && (automatic() || manualPlay)) play();
    else stop();
  }
  function configure() {
    stop();
    video.removeAttribute('src'); video.load(); selectedSource = '';
    plane.classList.remove('video-ready'); failed = false;
    if (toggle) toggle.hidden = !source();
    if (source()) reconcile();
  }

  toggle?.addEventListener('click', () => {
    if (!video.paused) { userPaused = true; manualPlay = false; stop(); }
    else { userPaused = false; manualPlay = true; play(); }
  });
  video.addEventListener('playing', () => { plane.classList.add('video-ready'); updateButton(); });
  video.addEventListener('pause', updateButton);
  video.addEventListener('error', () => {
    failed = true; stop(); plane.classList.remove('video-ready');
    if (toggle) toggle.hidden = true;
  });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; reconcile(); }, { threshold: 0.05 }).observe(stage);
  document.addEventListener('visibilitychange', reconcile);
  reduced.addEventListener('change', () => { manualPlay = false; reconcile(); });
  connection?.addEventListener?.('change', () => { manualPlay = false; reconcile(); });
  small.addEventListener('change', configure);
  configure();
})();
