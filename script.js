(function() {
  const year = document.getElementById('year');
  const pageloc = document.getElementById('pageloc');
  const lastmod = document.getElementById('lastmod');
  const toggle = document.getElementById('theme-toggle');

  year.textContent = new Date().getFullYear();
  pageloc.textContent = window.location.href;
  lastmod.textContent = document.lastModified || 'Unknown';

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    toggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const dynamicLine = document.getElementById("dynamic-line");

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

  
  let index = 0;
  let charIndex = 0;
  let typing = true;

  function typeDynamic() {
    const current = phrases[index];

    if (typing) {
      dynamicLine.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        typing = false;
        setTimeout(typeDynamic, 1500); // pause when full text shows
        return;
      }
    } else {
      dynamicLine.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        typing = true;
        index = (index + 1) % phrases.length;
      }
    }
    setTimeout(typeDynamic, typing ? 60 : 40); // speed
  }

  typeDynamic();
});

// ===== Back to Top Button =====
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTop.classList.add("show");
  } else {
    backToTop.classList.remove("show");
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});


