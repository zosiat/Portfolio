"use strict";

/* global XXH, p5 */

//----tile constants----
const TILE_HALF_WIDTH = 32;
const TILE_HALF_HEIGHT = 16;

//----selection/click correction----
const PICK_OFFSET_X = -1;
const PICK_OFFSET_Y = -1;

//----engine hooks----
function p3_tileWidth() { return TILE_HALF_WIDTH; }
function p3_tileHeight() { return TILE_HALF_HEIGHT; }

let worldInstance;

//----CampingWorld class----
class CampingWorld {
  constructor(p) {
    this.p = p;

    this.tileTypes = new Map();
    this.tileDecor = new Map();
    this.clicks = new Map();

    this.worldSeed = 0;

    this.decorElements = null;
  }

  preload() {
    const p = this.p;
    //tile images
    this.grass = p.loadImage("assets/img/grass.png");
    this.smallDirt = p.loadImage("assets/img/smallDirt.png");
    this.mediumDirt = p.loadImage("assets/img/mediumDirt.png");
    this.largeDirt = p.loadImage("assets/img/largeDirt.png");
    this.water = p.loadImage("assets/img/water.png");

    //nature assets
    this.trees = [
      p.loadImage("assets/img/tree1.png"),
      p.loadImage("assets/img/tree2.png"),
      p.loadImage("assets/img/tree3.png"),
      p.loadImage("assets/img/tree4.png"),
      p.loadImage("assets/img/tree5.png"),
      p.loadImage("assets/img/tree6.png"),
    ];

    this.grasses = [
      p.loadImage("assets/img/grass1.png"),
      p.loadImage("assets/img/grass2.png"),
    ];

    this.flowers = [
      p.loadImage("assets/img/flower2.png"),
      p.loadImage("assets/img/flower3.png"),
    ];

    this.tent = p.loadImage("assets/img/tent.png");
  }

  setup(seed = "default") {
    //build once
    this.decorElements = [...this.trees, ...this.grasses, ...this.flowers];
    this.setSeed(seed);
  }

  setSeed(str) {
    const p = this.p;
    this.worldSeed = XXH.h32(str, 0);
    p.noiseSeed(this.worldSeed);
    p.randomSeed(this.worldSeed);

    //clear caches when seed changes
    this.tileTypes = new Map();
    this.tileDecor = new Map();
    this.clicks = new Map();
  }

  tileKey(wx, wy) {
    return `${wx},${wy}`;
  }

  pickedCoords(world_x, world_y) {
    const wx = Math.floor(world_x) + PICK_OFFSET_X;
    const wy = Math.floor(world_y) + PICK_OFFSET_Y;
    return [wx, wy, this.tileKey(wx, wy)];
  }

  //computes tile type once then cache it
  getTileType(wx, wy) {
    const key = this.tileKey(wx, wy);
    const cached = this.tileTypes.get(key);
    if (cached) return cached;

    //terrain distribution
    const NOISE_SCALE = 0.2;
    const WATER_CUTOFF = 0.38;
    const GRASS_CUTOFF = 0.48;
    const DIRT_SMALL_CUTOFF = 0.65;
    const DIRT_MEDIUM_CUTOFF = 0.88;

    const n = this.p.noise(wx * NOISE_SCALE, wy * NOISE_SCALE);

    let type = "";
    if (n < WATER_CUTOFF) type = "WATER";
    else if (n < GRASS_CUTOFF) type = "GRASS";
    else if (n < DIRT_SMALL_CUTOFF) type = "DIRT_SMALL";
    else if (n < DIRT_MEDIUM_CUTOFF) type = "DIRT_MEDIUM";
    else type = "DIRT_LARGE";

    this.tileTypes.set(key, type);
    return type;
  }


  isNearWater(wx, wy) {
    //4-neighborhood
    if (this.getTileType(wx, wy) === "WATER") return true;
    if (this.getTileType(wx + 1, wy) === "WATER") return true;
    if (this.getTileType(wx - 1, wy) === "WATER") return true;
    if (this.getTileType(wx, wy + 1) === "WATER") return true;
    if (this.getTileType(wx, wy - 1) === "WATER") return true;
    return false;
  }

  getDecor(wx, wy, type) {
    const key = this.tileKey(wx, wy);
    const cached = this.tileDecor.get(key);
    if (cached !== undefined) return cached;

    //no decor on water tiles
    if (type === "WATER") {
      const v = { has: false };
      this.tileDecor.set(key, v);
      return v;
    }

    if (this.isNearWater(wx, wy)) {
      const v = { has: false };
      this.tileDecor.set(key, v);
      return v;
    }

    const DENSITY = 20;
    const roll = XXH.h32(`decor-roll:${wx},${wy}`, this.worldSeed) % 100;

    if (roll >= DENSITY) {
      const v = { has: false };
      this.tileDecor.set(key, v);
      return v;
    }

    const idx = XXH.h32(`decor-pick:${wx},${wy}`, this.worldSeed) % this.decorElements.length;
    const v = { has: true, idx: idx };
    this.tileDecor.set(key, v);
    return v;
  }

  tileImageForType(type) {
    switch (type) {
      case "WATER": return this.water;
      case "GRASS": return this.grass;
      case "DIRT_SMALL": return this.smallDirt;
      case "DIRT_MEDIUM": return this.mediumDirt;
      case "DIRT_LARGE": return this.largeDirt;
      default: return this.grass;
    }
  }

  verticalOffsetForType(type) {
    if (type === "DIRT_SMALL") return -5;
    if (type === "DIRT_MEDIUM") return -16;
    return -32;
  }

  drawTile(world_x, world_y, screen_x, screen_y) {
    const p = this.p;
    p.imageMode(p.CENTER);

    //draw uses engine coords exactly
    const wx = Math.floor(world_x);
    const wy = Math.floor(world_y);

    const type = this.getTileType(wx, wy);
    const tileImg = this.tileImageForType(type);

    //draw tile
    p.image(tileImg, 0, 0, tileImg.width / 2, tileImg.height / 2);

    //draw decor
    const decor = this.getDecor(wx, wy, type);
    if (decor.has) {
      const el = this.decorElements[decor.idx];
      const offsetY = this.verticalOffsetForType(type);
      p.image(el, 0, offsetY, el.width / 2, el.height / 2);
    }

    const tentKey = this.tileKey(wx + PICK_OFFSET_X, wy + PICK_OFFSET_Y);
    const clicks = this.clicks.get(tentKey) || 0;

    if (type !== "WATER" && (clicks % 2) === 1) {
      const offsetY = this.verticalOffsetForType(type);
      p.image(this.tent, 0, offsetY, this.tent.width / 2, this.tent.height / 2);
    }
  }

  drawSelectedTile(world_x, world_y, screen_x, screen_y) {
    const p = this.p;

    const [wx, wy] = this.pickedCoords(world_x, world_y);
    const type = this.getTileType(wx, wy);

    p.noFill();
    //red over water, green over land
    p.stroke(type === "WATER" ? [255, 0, 0, 160] : [0, 255, 0, 160]);
    p.beginShape();
    p.vertex(-TILE_HALF_WIDTH, 0);
    p.vertex(0, TILE_HALF_HEIGHT);
    p.vertex(TILE_HALF_WIDTH, 0);
    p.vertex(0, -TILE_HALF_HEIGHT);
    p.endShape(p.CLOSE);
  }

  tileClicked(world_x, world_y) {
    const [wx, wy, key] = this.pickedCoords(world_x, world_y);

    const type = this.getTileType(wx, wy);

    //toggle tent on/off but only allow on non-water
    if (type !== "WATER") {
      const prev = this.clicks.get(key) || 0;
      this.clicks.set(key, prev + 1);
    }
  }
}

//----engine hooks----
window.p3_preload = function () {
  worldInstance = new CampingWorld(this);
  worldInstance.preload();
};

window.p3_setup = function () {
  worldInstance.setup("default");
};

window.p3_drawTile = function (world_x, world_y, screen_x, screen_y) {
  worldInstance.drawTile(world_x, world_y, screen_x, screen_y);
};

window.p3_drawSelectedTile = function (world_x, world_y, screen_x, screen_y) {
  worldInstance.drawSelectedTile(world_x, world_y, screen_x, screen_y);
};

window.p3_tileClicked = function (world_x, world_y) {
  worldInstance.tileClicked(world_x, world_y);
};

window.p3_worldKeyChanged = function (key) {
  worldInstance.setSeed(key);
};