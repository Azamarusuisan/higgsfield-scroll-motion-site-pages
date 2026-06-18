const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const canvas = document.querySelector("#motion-canvas");
const context = canvas.getContext("2d", { alpha: true });
const particles = [];
let width = 0;
let height = 0;
let frame = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function seedParticles() {
  particles.length = 0;
  const count = Math.min(120, Math.floor((width * height) / 12000));
  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.5 + Math.random() * 2.2,
      speed: 0.2 + Math.random() * 0.7,
      tone: index % 4
    });
  }
}

function drawBackground() {
  context.clearRect(0, 0, width, height);
  const scrollRatio = Math.min(1, window.scrollY / Math.max(1, document.body.scrollHeight - height));

  context.save();
  context.globalCompositeOperation = "lighter";
  particles.forEach((particle, index) => {
    const tones = ["244,198,106", "97,214,189", "255,93,143", "141,183,255"];
    const drift = reduceMotion ? 0 : Math.sin(frame * 0.01 + index) * 20;
    particle.y -= reduceMotion ? 0 : particle.speed;
    particle.x += reduceMotion ? 0 : Math.cos(frame * 0.006 + index) * 0.16;
    if (particle.y < -18) {
      particle.y = height + 18;
      particle.x = Math.random() * width;
    }
    context.beginPath();
    context.fillStyle = `rgba(${tones[particle.tone]}, ${0.1 + scrollRatio * 0.16})`;
    context.arc(particle.x + drift, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();

  context.save();
  context.globalCompositeOperation = "screen";
  context.translate(width * 0.5, height * 0.5);
  context.rotate(scrollRatio * 0.5);
  context.strokeStyle = `rgba(244, 198, 106, ${0.08 + scrollRatio * 0.08})`;
  context.lineWidth = 1;
  for (let ring = 0; ring < 8; ring += 1) {
    context.beginPath();
    context.ellipse(0, 0, 180 + ring * 68, 42 + ring * 20, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  if (!reduceMotion) {
    frame += 1;
    requestAnimationFrame(drawBackground);
  }
}

function updateScrollState() {
  root.style.setProperty("--scroll", String(Math.round(window.scrollY)));
  updateScrubVideos();
}

function setupReveal() {
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    reveals.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
  );

  reveals.forEach((node) => observer.observe(node));
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const animate = (node) => {
    const target = Number(node.dataset.count || 0);
    if (reduceMotion) {
      node.textContent = target;
      return;
    }
    const start = performance.now();
    const duration = 850;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((node) => observer.observe(node));
}

function setupScrubVideos() {
  document.querySelectorAll(".scrub-video").forEach((video) => {
    video.pause();
    video.muted = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => {
      video.currentTime = 0.01;
      updateScrubVideos();
    });
  });
}

function updateScrubVideos() {
  document.querySelectorAll(".scroll-scene").forEach((scene) => {
    const video = scene.querySelector(".scrub-video");
    const progressBar = scene.querySelector(".scrub-ui");
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const rect = scene.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
    const targetTime = Math.min(video.duration - 0.08, Math.max(0.01, progress * video.duration));

    if (Math.abs(video.currentTime - targetTime) > 0.08) {
      video.currentTime = targetTime;
    }

    if (progressBar) {
      progressBar.style.setProperty("--scene-progress", progress.toFixed(3));
    }
  });
}

window.addEventListener("resize", () => {
  resizeCanvas();
  seedParticles();
  if (reduceMotion) drawBackground();
});
window.addEventListener("scroll", updateScrollState, { passive: true });

resizeCanvas();
seedParticles();
drawBackground();
updateScrollState();
setupReveal();
setupCounters();
setupScrubVideos();
