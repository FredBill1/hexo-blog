/* https://codepen.io/juliangarnier/pen/gmOwJX */
var canvasEl = document.querySelector(".cursor-effect-canvas");
var ctx = canvasEl.getContext("2d");
var pointerX = 0;
var pointerY = 0;
var tap =
  "ontouchstart" in window || navigator.msMaxTouchPoints
    ? "touchstart"
    : "mousedown";
var colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"];

const numberOfParticules = 20;
const particuleRadiusMin = 10;
const particuleRadiusMax = 20;
const particuleDistanceMin = 40;
const particuleDistanceMax = 80;
const circleRadiusMin = 30;
const circleRadiusMax = 35;

function setCanvasSize() {
  canvasEl.width = window.innerWidth * 2;
  canvasEl.height = window.innerHeight * 2;
  canvasEl.style.width = window.innerWidth + "px";
  canvasEl.style.height = window.innerHeight + "px";
  canvasEl.getContext("2d").scale(2, 2);
}

function updateCoords(e) {
  pointerX = e.clientX || e.touches[0].clientX;
  pointerY = e.clientY || e.touches[0].clientY;
}

function setParticuleDirection(p) {
  var angle = Math.random() * Math.PI * 2;
  var distance = anime.random(particuleDistanceMin, particuleDistanceMax);
  return {
    x: p.x + distance * Math.cos(angle),
    y: p.y + distance * Math.sin(angle),
  };
}

function createParticule(x, y) {
  var p = {};
  p.x = x;
  p.y = y;
  p.color = colors[anime.random(0, colors.length - 1)];
  p.radius = anime.random(particuleRadiusMin, particuleRadiusMax);
  p.endPos = setParticuleDirection(p);
  p.lineWidth = 1;
  p.draw = function () {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.bezierCurveTo(p.x + p.radius, p.y - p.radius, p.x + p.radius * 2, p.y + p.radius, p.x, p.y + p.radius * 2);
    ctx.bezierCurveTo(p.x - p.radius * 2, p.y + p.radius, p.x - p.radius, p.y - p.radius, p.x, p.y);
    // ctx.fillStyle = p.color;
    // ctx.fill();
    ctx.lineWidth = p.lineWidth;
    ctx.strokeStyle = p.color;
    ctx.stroke();
  };
  return p;
}

function createCircle(x, y) {
  var p = {};
  p.x = x;
  p.y = y;
  p.color = "#FFF";
  p.radius = 0.1;
  p.alpha = 0.5;
  p.lineWidth = 6;
  p.draw = function () {
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
    ctx.lineWidth = p.lineWidth;
    ctx.strokeStyle = p.color;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  return p;
}

function renderParticule(anim) {
  for (var i = 0; i < anim.animatables.length; i++) {
    anim.animatables[i].target.draw();
  }
}

function animateParticules(x, y) {
  var circle = createCircle(x, y);
  var particules = [];
  for (var i = 0; i < numberOfParticules; i++) {
    particules.push(createParticule(x, y));
  }
  anime
    .timeline()
    .add({
      targets: particules,
      x: function (p) {
        return p.endPos.x;
      },
      y: function (p) {
        return p.endPos.y;
      },
      radius: 0.1,
      duration: anime.random(1200, 1800),
      easing: "easeOutExpo",
      update: renderParticule,
    })
    .add({
      targets: circle,
      radius: anime.random(circleRadiusMin, circleRadiusMax),
      lineWidth: 0,
      alpha: {
        value: 0,
        easing: "linear",
        duration: anime.random(600, 800),
      },
      duration: anime.random(1200, 1800),
      easing: "easeOutExpo",
      update: renderParticule,
      offset: 0,
    });
}

var render = anime({
  duration: Infinity,
  update: function () {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  },
});

document.addEventListener(
  tap,
  function (e) {
    render.play();
    updateCoords(e);
    animateParticules(pointerX, pointerY);
  },
  false
);

var centerX = window.innerWidth / 2;
var centerY = window.innerHeight / 2;

setCanvasSize();
window.addEventListener("resize", setCanvasSize, false);
