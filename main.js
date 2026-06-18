const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const canvas = document.querySelector("#motion-canvas");
const context = canvas.getContext("2d", { alpha: true });
const filmStage = document.querySelector(".film-stage");
const film = document.querySelector("#scroll-film");
const chapterTitle = document.querySelector("#chapter-title");
const chapterKicker = document.querySelector("#chapter-kicker");
const chapterDots = Array.from(document.querySelectorAll(".chapter-dots li"));

const chapters = [
  { at: 0, kicker: "HERO", title: "海外Xのやつ、再現。" },
  { at: 0.34, kicker: "PROBLEM", title: "静止画で終わらせない。" },
  { at: 0.67, kicker: "AFTER", title: "1本でつなぐ。" }
];

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

function getProgress() {
  if (!filmStage) return 0;
  const rect = filmStage.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  return Math.min(1, Math.max(0, -rect.top / scrollable));
}

function getChapter(progress) {
  let chapterIndex = 0;
  chapters.forEach((chapter, index) => {
    if (progress >= chapter.at) chapterIndex = index;
  });
  return { chapter: chapters[chapterIndex], index: chapterIndex };
}

function updateFilm() {
  ticking = false;
  const progress = getProgress();
  root.style.setProperty("--film-progress", progress.toFixed(4));

  if (film && Number.isFinite(film.duration) && film.duration > 0) {
    const targetTime = Math.min(film.duration - 0.08, Math.max(0.01, progress * film.duration));
    if (Math.abs(film.currentTime - targetTime) > 0.055) {
      film.currentTime = targetTime;
    }
  }

  const { chapter, index } = getChapter(progress);
  if (chapterTitle && chapterTitle.textContent !== chapter.title) {
    chapterTitle.textContent = chapter.title;
  }
  if (chapterKicker && chapterKicker.textContent !== chapter.kicker) {
    chapterKicker.textContent = chapter.kicker;
  }
  chapterDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === index);
  });
}

function requestFilmUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateFilm);
}

function setupFilm() {
  if (!film) return;
  film.pause();
  film.muted = true;
  film.playsInline = true;
  film.addEventListener("loadedmetadata", () => {
    film.currentTime = 0.01;
    updateFilm();
  });
}

window.addEventListener("resize", () => {
  resizeCanvas();
  seedParticles();
  updateFilm();
  if (reduceMotion) drawBackground();
});
window.addEventListener("scroll", requestFilmUpdate, { passive: true });

resizeCanvas();
seedParticles();
drawBackground();
setupFilm();
updateFilm();
