const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.querySelector("#motion-canvas");
const context = canvas.getContext("2d", { alpha: true });

const chapterSets = {
  tokyo: [
    { at: 0, kicker: "TOKYO WALK / ALLEY", title: "東京を歩く。" },
    { at: 0.25, kicker: "TOKYO WALK / YOKOCHO", title: "路地の奥へ。" },
    { at: 0.5, kicker: "TOKYO WALK / CROSSING", title: "雨の交差点へ。" },
    { at: 0.75, kicker: "TOKYO WALK / STATION", title: "駅前で終わる。" }
  ],
  motion: [
    { at: 0, kicker: "ORIGINAL / HERO", title: "現行版も残す。" },
    { at: 0.34, kicker: "ORIGINAL / PROBLEM", title: "静止画で終わらせない。" },
    { at: 0.67, kicker: "ORIGINAL / AFTER", title: "1本でつなぐ。" }
  ]
};

const stages = Array.from(document.querySelectorAll(".film-stage")).map((stage) => ({
  node: stage,
  video: stage.querySelector(".film-video"),
  title: stage.querySelector(".chapter-title"),
  kicker: stage.querySelector(".chapter-kicker"),
  current: stage.querySelector(".counter-current"),
  total: stage.querySelector(".counter-total"),
  dots: Array.from(stage.querySelectorAll(".chapter-dots li")),
  chapters: chapterSets[stage.dataset.film] || chapterSets.motion
}));

let width = 0;
let height = 0;
let frame = 0;
let particles = [];
let ticking = false;

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
  particles = Array.from({ length: Math.min(72, Math.floor((width * height) / 18000)) }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 0.5 + Math.random() * 1.7,
    speed: 0.16 + Math.random() * 0.42,
    tone: index % 2
  }));
}

function drawBackground() {
  context.clearRect(0, 0, width, height);
  context.save();
  context.globalCompositeOperation = "lighter";
  particles.forEach((particle, index) => {
    particle.y -= reduceMotion ? 0 : particle.speed;
    particle.x += reduceMotion ? 0 : Math.cos(frame * 0.006 + index) * 0.12;
    if (particle.y < -12) {
      particle.y = height + 12;
      particle.x = Math.random() * width;
    }
    context.beginPath();
    context.fillStyle = particle.tone
      ? "rgba(97, 214, 189, 0.12)"
      : "rgba(244, 198, 106, 0.1)";
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();

  if (!reduceMotion) {
    frame += 1;
    requestAnimationFrame(drawBackground);
  }
}

function progressFor(stage) {
  const rect = stage.node.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  return Math.min(1, Math.max(0, -rect.top / scrollable));
}

function chapterFor(chapters, progress) {
  let chapterIndex = 0;
  chapters.forEach((chapter, index) => {
    if (progress >= chapter.at) chapterIndex = index;
  });
  return { chapter: chapters[chapterIndex], index: chapterIndex };
}

function updateStage(stage) {
  const progress = progressFor(stage);
  stage.node.style.setProperty("--film-progress", progress.toFixed(4));
  stage.node.style.setProperty("--chapter-count", String(stage.dots.length || stage.chapters.length));

  if (stage.video && Number.isFinite(stage.video.duration) && stage.video.duration > 0) {
    const targetTime = Math.min(
      stage.video.duration - 0.08,
      Math.max(0.01, progress * stage.video.duration)
    );
    if (Math.abs(stage.video.currentTime - targetTime) > 0.055) {
      stage.video.currentTime = targetTime;
    }
  }

  const { chapter, index } = chapterFor(stage.chapters, progress);
  if (stage.title && stage.title.textContent !== chapter.title) stage.title.textContent = chapter.title;
  if (stage.kicker && stage.kicker.textContent !== chapter.kicker) stage.kicker.textContent = chapter.kicker;
  if (stage.current) stage.current.textContent = String(index + 1).padStart(2, "0");
  if (stage.total) stage.total.textContent = String(stage.chapters.length).padStart(2, "0");
  stage.dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
}

function updateFilms() {
  ticking = false;
  stages.forEach(updateStage);
}

function requestFilmUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateFilms);
}

function setupFilms() {
  stages.forEach((stage) => {
    stage.node.style.setProperty("--chapter-count", String(stage.dots.length || stage.chapters.length));
    if (!stage.video) return;
    stage.video.pause();
    stage.video.muted = true;
    stage.video.playsInline = true;
    stage.video.addEventListener("loadedmetadata", () => {
      stage.video.currentTime = 0.01;
      updateStage(stage);
    });
  });
}

window.addEventListener("resize", () => {
  resizeCanvas();
  seedParticles();
  updateFilms();
  if (reduceMotion) drawBackground();
});
window.addEventListener("scroll", requestFilmUpdate, { passive: true });

resizeCanvas();
seedParticles();
drawBackground();
setupFilms();
updateFilms();
