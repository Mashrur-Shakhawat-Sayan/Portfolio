(function () {
  const year = document.getElementById('year');
  const pageloc = document.getElementById('pageloc');
  const lastmod = document.getElementById('lastmod');
  const toggle = document.getElementById('theme-toggle'); // top toggle (in header)
  const backToTop = document.getElementById('backToTop');
  const themeToggleFixed = document.getElementById('theme-toggle-fixed'); // floating toggle
  const fpvVideo = document.getElementById('fpvVideo');
  const body = document.body;

  // ===== Footer Info =====
  if (year) year.textContent = new Date().getFullYear();
  if (pageloc) pageloc.textContent = window.location.href;
  if (lastmod) lastmod.textContent = document.lastModified || 'Unknown';

  // ===== Load Saved Theme =====
  if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark');
    if (toggle) toggle.textContent = '☀️';
    if (themeToggleFixed) themeToggleFixed.textContent = '☀️';
  } else {
    if (toggle) toggle.textContent = '🌙';
    if (themeToggleFixed) themeToggleFixed.textContent = '🌙';
  }

  // ===== Top Theme Toggle =====
  if (toggle) {
    toggle.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDark = body.classList.contains('dark');
      toggle.textContent = isDark ? '☀️' : '🌙';
      if (themeToggleFixed) themeToggleFixed.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // ===== Typing Animation =====
  const dynamicLine = document.getElementById("dynamic-line");
  if (dynamicLine) {
    const phrases = [
      "Full-Stack ML Engineer",
      "Cloud & Edge Computing Researcher",
      "Passionate about AI-Driven Automation",
      "Building Scalable, Intelligent Systems",
      "Exploring Federated Learning & Privacy Tech",
      "Turning Data into Actionable Insights",
      "Machinery, Robotics & Smart Systems Enthusiast",
      "BRAC University Graduate"
    ];

    let index = 0, charIndex = 0, typing = true;

    function typeDynamic() {
      const current = phrases[index];
      dynamicLine.textContent = typing
        ? current.substring(0, ++charIndex)
        : current.substring(0, --charIndex);

      if (typing && charIndex === current.length) {
        typing = false;
        setTimeout(typeDynamic, 1500);
      } else if (!typing && charIndex === 0) {
        typing = true;
        index = (index + 1) % phrases.length;
        setTimeout(typeDynamic, 300);
      } else {
        setTimeout(typeDynamic, typing ? 60 : 40);
      }
    }

    typeDynamic();
  }

  // ===== Scroll: Show Floating Buttons =====
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 300;
    if (backToTop) backToTop.classList.toggle('show', show);
    if (themeToggleFixed) themeToggleFixed.classList.toggle('show', show);
  });

  // ===== Smooth Scroll to Top =====
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== Floating Theme Toggle =====
  if (themeToggleFixed) {
    themeToggleFixed.addEventListener('click', () => {
      body.classList.toggle('dark');
      const isDark = body.classList.contains('dark');
      themeToggleFixed.textContent = isDark ? '☀️' : '🌙';
      if (toggle) toggle.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // ===== FPV Video: Autoplay When Visible =====
  if (fpvVideo) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) fpvVideo.play();
        else fpvVideo.pause();
      });
    }, { threshold: 0.5 });

    observer.observe(fpvVideo);

    // Mute when not fullscreen, unmute in fullscreen
    fpvVideo.addEventListener('fullscreenchange', () => {
      fpvVideo.muted = !document.fullscreenElement;
    });
  }

})();
