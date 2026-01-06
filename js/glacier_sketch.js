const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

let seed = 239;
let canvasContainer;

const COLORS = {
  skyTop: "#7fa3d6",
  skyBottom: "#dfeaf4",
  haze: "rgba(255,255,255,0.25)",

  stoneFar: "#b6b1b6",
  stoneMid: "#aa959a",
  stoneNear: "#8f7f84",

  hillDark: "#3e4d31",
  hillLight: "#5d5d38",

  grass: "#3d431d",
  tree: "#2f3b1f",
  trunk: "#3b2f26",

  sun: "#fdfcf7",
  sunGlow: "rgba(255,255,255,0.22)",

  snow: "rgba(255,255,255,0.85)"
};

const flowerColors = ["#b9429b", "#7f1962", "#e159c2", "#ff69b4", "#ffd1ea"];

function setup() {
  canvasContainer = document.getElementById("canvas-container");

  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent("canvas-container");

  const btn = createButton("reimagine");
  btn.mousePressed(() => seed++);
  btn.parent("ui");

  window.addEventListener("resize", resizeToContainer);
  resizeToContainer();
}

function resizeToContainer() {
  if (!canvasContainer) return;
  const rect = canvasContainer.getBoundingClientRect();
  resizeCanvas(Math.max(300, rect.width), Math.max(300, rect.height));
}

function draw() {
  randomSeed(seed);
  noiseSeed(seed);

  drawSky();
  drawSun();

  drawClouds();

  drawMountainLayer(height * 0.62, COLORS.stoneFar, 0.72, 18, 0.22, 1.32);
  drawMountainLayer(height * 0.76, COLORS.stoneMid, 0.58, 14, 0.16, 1.02);
  drawMountainLayer(height * 0.84, COLORS.stoneNear, 0.78, 16, 0.18, 1.0);

  drawFogBand(height * 0.70);

  drawHillLeft();
  drawHillRight();

  drawGround();

  drawFarTreeLine(58);
  addFlowersClustered(420);
  drawTreeLine(82);

  drawVignette();
}

function drawSky() {
  const top = color(COLORS.skyTop);
  const bottom = color(COLORS.skyBottom);

  for (let y = 0; y < height; y++) {
    const t = y / height;
    const eased = pow(t, 0.9);
    const c = lerpColor(top, bottom, eased);
    stroke(c);
    line(0, y, width, y);
  }

  noStroke();
  fill(20, 35, 55, 18);
  rect(0, 0, width, height);
}

function drawSun() {
  const sunX = width * 0.5;
  const sunY = height - ((frameCount * 0.6) % (height + 160));

  noStroke();

  fill(255, 255, 255, 14);
  ellipse(sunX, sunY, 260, 220);

  fill(255, 255, 255, 20);
  ellipse(sunX, sunY, 200, 170);

  fill(255, 255, 255, 28);
  ellipse(sunX, sunY, 140, 120);

  fill(COLORS.sun);
  ellipse(sunX, sunY, 62, 62);
}

function drawClouds() {
  const t = frameCount * 0.004;

  randomSeed(seed + 999);

  const cloudCount = 10;
  for (let i = 0; i < cloudCount; i++) {
    const baseX = random(width * 0.05, width * 0.95);
    const baseY = random(height * 0.10, height * 0.40);
    const r = random(90, 170);

    const drift = (t * (28 + i * 0.6) + i * 180) % (width + 520) - 260;
    const x = (baseX + drift) % (width + 320) - 160;

    drawCloudRibbon(x, baseY, r, t + i * 11.3);
  }
}

function drawCloudRibbon(cx, cy, size, t) {
  push();
  noStroke();

  for (let layer = 0; layer < 3; layer++) {
    const alpha = 20 - layer * 5;
    fill(255, 255, 255, alpha);

    beginShape();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const x = cx + (u - 0.5) * size * 2.2;

      const flow = noise(
        x * 0.006 + t * 0.9 + layer * 9.1,
        cy * 0.006 + t * 0.65 + layer * 3.7
      );

      const thickness = map(
        noise(u * 2.0 + t * 0.6 + layer * 1.3, cy * 0.01),
        0,
        1,
        size * 0.18,
        size * 0.46
      );

      const y =
        cy +
        (flow - 0.5) * size * 0.55 +
        sin(u * TWO_PI * 1.2 + t * 0.9) * size * 0.06;

      curveVertex(x, y - thickness * 0.55 * (1 - layer * 0.12));
    }

    for (let i = steps; i >= 0; i--) {
      const u = i / steps;
      const x = cx + (u - 0.5) * size * 2.2;

      const flow = noise(
        x * 0.006 + t * 0.9 + layer * 9.1,
        cy * 0.006 + t * 0.65 + layer * 3.7
      );

      const thickness = map(
        noise(u * 2.0 + t * 0.6 + layer * 1.3, cy * 0.01),
        0,
        1,
        size * 0.18,
        size * 0.46
      );

      const y =
        cy +
        (flow - 0.5) * size * 0.55 +
        sin(u * TWO_PI * 1.2 + t * 0.9) * size * 0.06;

      curveVertex(x, y + thickness * 0.55 * (1 - layer * 0.12));
    }
    endShape(CLOSE);
  }

  pop();
}

function drawMountainLayer(baseY, fillCol, roughness, steps, peakChance, heightMult) {
  noStroke();
  fill(fillCol);

  beginShape();
  vertex(0, height);

  for (let i = 0; i <= steps; i++) {
    const x = (width * i) / steps;

    const n = noise(seed * 0.02 + i * 0.25, baseY * 0.001);
    const r = random();
    const peak = r < peakChance ? 1.0 : 0.4;

    const y =
      baseY
      - pow(n, 3.1) * height * (0.22 + roughness * 0.22) * peak * heightMult
      - random() * height * 0.02;

    vertex(x, y);
  }

  vertex(width, height);
  endShape(CLOSE);
}

function drawFogBand(yCenter) {
  noStroke();
  for (let i = 0; i < 6; i++) {
    const a = 18 - i * 2;
    fill(255, 255, 255, a);
    const h = 48 + i * 10;
    ellipse(width * 0.5, yCenter + i * 6, width * 1.2, h);
  }
}

function drawHillHighlight(crest, strength = 18) {
  noFill();
  stroke(255, 255, 255, strength);
  strokeWeight(2);
  beginShape();
  for (const v of crest) vertex(v.x, v.y);
  endShape();
}

function fillHillGradient(topCol, bottomCol, topY, bottomY) {
  const ctx = drawingContext;
  const grad = ctx.createLinearGradient(0, topY, 0, bottomY);
  grad.addColorStop(0, topCol);
  grad.addColorStop(1, bottomCol);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawHillLeft() {
  const steps = 18;
  const startY = random(height * 0.40, height * 0.74);

  const crest = [];
  const ctx = drawingContext;

  ctx.save();

  beginShape();
  for (let i = 0; i <= steps; i++) {
    const x = map(i, 0, steps, 0, width * 0.85);
    const baseY = map(x, 0, width * 0.85, startY, height);
    const y = baseY + noise(seed + i * 0.5) * 20;
    vertex(x, y);
    crest.push({ x, y });
  }
  vertex(width * 0.85, height);
  vertex(0, height);
  endShape(CLOSE);

  ctx.clip();

  fillHillGradient("rgba(150,175,135,0.85)", "rgba(22,28,16,0.95)", startY - 60, height);

  noStroke();
  fill(0, 0, 0, 16);
  rect(0, 0, width, height);

  ctx.restore();

  noStroke();
  fill(0, 0, 0, 16);
  beginShape();
  for (let i = 0; i <= steps; i++) vertex(crest[i].x, crest[i].y);
  vertex(width * 0.85, height);
  vertex(0, height);
  endShape(CLOSE);

  drawHillHighlight(crest, 14);
}

function drawHillRight() {
  const steps = 18;
  const startY = random(height * 0.36, height * 0.70);

  const crest = [];
  const ctx = drawingContext;

  ctx.save();

  beginShape();
  for (let i = 0; i <= steps; i++) {
    const x = map(i, 0, steps, width, width * 0.15);
    const baseY = map(x, width, width * 0.15, startY, height);
    const y = baseY + noise(seed + 100 + i * 0.5) * 20;
    vertex(x, y);
    crest.push({ x, y });
  }
  vertex(width * 0.15, height);
  vertex(width, height);
  endShape(CLOSE);

  ctx.clip();

  fillHillGradient("rgba(185,200,150,0.80)", "rgba(40,45,25,0.94)", startY - 60, height);

  noStroke();
  fill(0, 0, 0, 12);
  rect(0, 0, width, height);

  ctx.restore();

  noStroke();
  fill(0, 0, 0, 12);
  beginShape();
  for (let i = 0; i <= steps; i++) vertex(crest[i].x, crest[i].y);
  vertex(width * 0.15, height);
  vertex(width, height);
  endShape(CLOSE);

  drawHillHighlight(crest, 10);
}

function drawGround() {
  const y0 = height - 60;

  noStroke();
  fill(COLORS.grass);
  rect(0, y0, width, 80);

  const ctx = drawingContext;
  ctx.save();

  ctx.beginPath();
  ctx.rect(0, y0, width, 80);
  ctx.clip();

  const grad = ctx.createLinearGradient(0, y0, 0, height + 40);
  grad.addColorStop(0, "rgba(95,120,70,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, y0, width, 80);

  randomSeed(seed + 2027);
  for (let i = 0; i < 650; i++) {
    const x = random(width);
    const y = random(y0, height + 10);
    const a = random(10, 26);
    const s = random(0.6, 1.8);
    fill(0, 0, 0, a);
    ellipse(x, y, s, s);
  }

  ctx.restore();
}

function drawFarTreeLine(count) {
  randomSeed(seed + 333);

  for (let i = 0; i < count; i++) {
    const x = random(10, width - 10);
    const y = height - 68 + random(-2, 4);

    const t = abs(x / width - 0.5);
    const scale = lerp(0.88, 0.58, t);

    const base = lerpColor(color("#2a351a"), color("#1a2611"), random(0.0, 0.65));
    const fogged = lerpColor(base, color(230, 238, 246), 0.20 + random() * 0.10);

    push();
    const sway =
      (noise(seed * 0.01 + x * 0.01, frameCount * 0.01) - 0.5) * 0.16;
    translate(x, y);
    rotate(sway);

    noStroke();
    fill(fogged);

    triangle(-12 * scale, 8 * scale, 12 * scale, 8 * scale, 0, -26 * scale);
    triangle(-10 * scale, 2 * scale, 10 * scale, 2 * scale, 0, -22 * scale);
    triangle(-8 * scale, -4 * scale, 8 * scale, -4 * scale, 0, -18 * scale);

    pop();
  }
}

function drawTreeLine(count) {
  randomSeed(seed + 77);

  for (let i = 0; i < count; i++) {
    const x = random(20, width - 20);
    const y = height - 60 + random(-3, 6);

    const t = abs(x / width - 0.5);
    const scale = lerp(1.06, 0.80, t);

    drawTree(x, y, scale);
  }
}

function drawTree(x, y, s) {
  push();

  const sway =
    (noise(seed * 0.01 + x * 0.01, frameCount * 0.01) - 0.5) * 0.25;

  translate(x, y);
  rotate(sway);

  const baseTree = lerpColor(color(COLORS.tree), color("#1f2b16"), random(0.0, 0.35));
  const trunkCol = lerpColor(color(COLORS.trunk), color(0), random(0.0, 0.25));

  noStroke();
  fill(trunkCol);
  const trunkH = (18 + random(7)) * s;
  rect(-2.2 * s, 0, 4.4 * s, trunkH, 2);

  fill(baseTree);

  const h1 = (28 + random(12)) * s;
  const h2 = (24 + random(12)) * s;
  const h3 = (20 + random(10)) * s;

  triangle(-15 * s, 9 * s, 15 * s, 9 * s, 0, -h1);
  triangle(-13 * s, 1 * s, 13 * s, 1 * s, 0, -h2);
  triangle(-11 * s, -6 * s, 11 * s, -6 * s, 0, -h3);

  pop();
}

function addFlowersClustered(n) {
  noStroke();
  for (let i = 0; i < n; i++) {
    const cx = i % 6 === 0 ? random(width) : undefined;
    const cy = i % 6 === 0 ? random(height - 58, height - 10) : undefined;

    const x =
      cx !== undefined
        ? cx
        : constrain(randomGaussian(width * 0.5, width * 0.30), 0, width);
    const y = cy !== undefined ? cy : random(height - 58, height - 10);

    const size = random(2.8, 6.4);
    fill(random(flowerColors));
    ellipse(x + random(-10, 10), y + random(-6, 6), size, size);

    fill(255, 255, 255, 70);
    ellipse(
      x + random(-10, 10) + 1,
      y + random(-6, 6) - 1,
      size * 0.26,
      size * 0.26
    );
  }
}

function drawVignette() {
  noFill();
  for (let i = 0; i < 10; i++) {
    stroke(0, 0, 0, 8);
    rect(i, i, width - i * 2, height - i * 2, 16);
  }
}