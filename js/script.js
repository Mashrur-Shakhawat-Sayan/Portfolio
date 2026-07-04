"use strict";

(() => {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");
  const currentYear = document.getElementById("current-year");
  const backToTop = document.getElementById("back-to-top");
  const certificateModal = document.getElementById("certificate-modal");
  const certificateImage = document.getElementById("modal-certificate-image");
  const modalClose = document.getElementById("modal-close");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
  }

  const updateThemeButton = () => {
    if (!themeToggle) return;

    const isLight = body.classList.contains("light-theme");
    themeToggle.textContent = isLight ? "Dark" : "Light";
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Switch to dark theme" : "Switch to light theme"
    );
    themeToggle.setAttribute("aria-pressed", String(isLight));
  };

  const savedTheme = localStorage.getItem("portfolio-theme");
  if (savedTheme === "light") {
    body.classList.add("light-theme");
  }
  updateThemeButton();

  themeToggle?.addEventListener("click", () => {
    body.classList.toggle("light-theme");
    localStorage.setItem(
      "portfolio-theme",
      body.classList.contains("light-theme") ? "light" : "dark"
    );
    updateThemeButton();
  });

  const closeNavigation = () => {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle?.addEventListener("click", () => {
    if (!navMenu) return;
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNavigation);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNavigation();
    }
  });

  document.addEventListener("click", (event) => {
    if (!navMenu || !navToggle || !navMenu.classList.contains("open")) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!navMenu.contains(target) && !navToggle.contains(target)) {
      closeNavigation();
    }
  });

  const certificateButtons = document.querySelectorAll("[data-certificate]");
  certificateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!certificateModal || !certificateImage) return;

      const source = button.getAttribute("data-certificate");
      const preview = button.querySelector("img");
      if (!source) return;

      certificateImage.src = source;
      certificateImage.alt = preview?.alt
        ? `${preview.alt} enlarged preview`
        : "Certificate enlarged preview";

      if (typeof certificateModal.showModal === "function") {
        certificateModal.showModal();
      } else {
        certificateModal.setAttribute("open", "");
      }
    });
  });

  const closeCertificateModal = () => {
    if (!certificateModal) return;
    if (typeof certificateModal.close === "function") {
      certificateModal.close();
    } else {
      certificateModal.removeAttribute("open");
    }
  };

  modalClose?.addEventListener("click", closeCertificateModal);

  certificateModal?.addEventListener("click", (event) => {
    if (event.target === certificateModal) {
      closeCertificateModal();
    }
  });

  const updateBackToTop = () => {
    if (!backToTop) return;
    backToTop.classList.toggle("visible", window.scrollY > 520);
  };

  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion.matches ? "auto" : "smooth"
    });
  });

  const navLinks = Array.from(
    document.querySelectorAll('.nav-link[href^="#"]')
  );
  const observedSections = navLinks
    .map((link) => {
      const selector = link.getAttribute("href");
      return selector ? document.querySelector(selector) : null;
    })
    .filter((section) => section instanceof HTMLElement);

  if ("IntersectionObserver" in window && observedSections.length > 0) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${visibleEntry.target.id}`;
          link.classList.toggle("active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      {
        rootMargin: "-28% 0px -58% 0px",
        threshold: [0.08, 0.25, 0.5]
      }
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  const revealSelectors = [
    ".section-heading",
    ".about-copy",
    ".highlight-card",
    ".timeline-item",
    ".project-card",
    ".research-card",
    ".skill-group",
    ".certificate-card",
    ".education-card",
    ".journey-item",
    ".activity-card",
    ".contact-layout > *",
    ".footer-main > *"
  ];

  const revealItems = Array.from(
    document.querySelectorAll(revealSelectors.join(","))
  );

  revealItems.forEach((item, index) => {
    item.classList.add("reveal-item");
    item.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  });

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -9% 0px",
        threshold: 0.12
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const robotVideo = document.querySelector(
    'video[poster="assets/projects/robot-poster.png"]'
  );

  if (robotVideo instanceof HTMLVideoElement) {
    robotVideo.muted = true;
    robotVideo.loop = true;
    robotVideo.playsInline = true;
    robotVideo.play().catch(() => {
      // The poster remains visible if a browser blocks autoplay.
    });
  }
})();
