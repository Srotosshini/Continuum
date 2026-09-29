let scene;
let pane;
let stats = { fps: 0 };

let params = {
  speed: 3,
  sizeMax: 80,
  rayStep: 120,
  depth: 0.1,
  spawnRate: 0.2,
  showRays: true,
  particleColor: { r: 200, g: 220, b: 255 },
  vpX: window.innerWidth / 2,
vpY: window.innerHeight / 2,
useMouse: true
};
let bgSound;
function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeWeight(1.5);
  strokeJoin(ROUND);

  // create your scene
  scene = new Scene();

  // play the background music
  bgSound.loop();
  bgSound.setVolume(0.2);

  // Tweakpane
  pane = new Tweakpane.Pane();
  pane.addInput(params, 'speed', { min: 1, max: 10 });
  pane.addInput(params, 'sizeMax', { min: 20, max: 150 });
  pane.addInput(params, 'rayStep', { min: 50, max: 200, step: 10 });
  pane.addInput(params, 'depth', { min: 0.01, max: 0.3 });
  pane.addInput(params, 'spawnRate', { min: 0.01, max: 0.2 });
  pane.addInput(params, 'showRays');
  pane.addInput(params, 'particleColor', { view: 'color' });
  pane.addInput(params, 'useMouse', { label: 'Use Mouse VP' });
  pane.addInput(params, 'vpX', { min: 0, max: windowWidth, step: 1, label: 'VP X' });
  pane.addInput(params, 'vpY', { min: 0, max: windowHeight, step: 1, label: 'VP Y' });

  pane.addMonitor(stats, 'fps', {
    label: 'FPS',
    interval: 200
  });

  pane.addButton({ title: 'Reset' }).on('click', () => {
    scene = new Scene();
  });
}function setup() {
  createCanvas(windowWidth, windowHeight);
  strokeWeight(1.5);
  strokeJoin(ROUND);

  // create your scene
  scene = new Scene();

  // play the background music
  bgSound.loop();
  bgSound.setVolume(0.2);

  // Tweakpane
  pane = new Tweakpane.Pane();
  pane.addInput(params, 'speed', { min: 1, max: 10 });
  pane.addInput(params, 'sizeMax', { min: 20, max: 150 });
  pane.addInput(params, 'rayStep', { min: 50, max: 200, step: 10 });
  pane.addInput(params, 'depth', { min: 0.01, max: 0.3 });
  pane.addInput(params, 'spawnRate', { min: 0.01, max: 0.2 });
  pane.addInput(params, 'showRays');
  pane.addInput(params, 'particleColor', { view: 'color' });
  pane.addInput(params, 'useMouse', { label: 'Use Mouse VP' });
  pane.addInput(params, 'vpX', { min: 0, max: windowWidth, step: 1, label: 'VP X' });
  pane.addInput(params, 'vpY', { min: 0, max: windowHeight, step: 1, label: 'VP Y' });

  pane.addMonitor(stats, 'fps', {
    label: 'FPS',
    interval: 200
  });

  pane.addButton({ title: 'Reset' }).on('click', () => {
    scene = new Scene();
  });
}
function preload() {
  bgSound = loadSound('bgs.mp3'); 
}

function draw() {
  drawTunnelBackground(
    scene.perspective.vp,
    scene.perspective.rays
  );

  addGrain();

  scene.update();
  scene.draw();

  stats.fps = frameRate();
  // calculate distance from VP to mouse
  let distToVP = dist(scene.perspective.vp.x, scene.perspective.vp.y, mouseX, mouseY);
  
  // map volume inversely to distance (closer = louder)
  let vol = map(distToVP, 0, width, 0.5, 0.1);
  bgSound.setVolume(vol);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  scene = new Scene();
}

class Scene {
  constructor() {
    this.perspective = new PerspectiveSystem();
    this.cubes = [];
    this.particles = [];
  }

 update() {

  let maxCubes = 120;

  if (this.cubes.length < maxCubes) {
    if (random() < params.spawnRate) {
      this.spawnCube();
    }
  }

  if (random() < 0.6) {
    this.spawnParticle();
  }


  for (let cube of this.cubes) {
    cube.update();
  }


  for (let p of this.particles) {
    p.update(this.perspective.vp);
  }

  this.cubes = this.cubes.filter(c => !c.isOffscreen());
  this.particles = this.particles.filter(p => !p.isDead());
}

draw() {
  this.perspective.draw();


  for (let p of this.particles) {
    p.draw();
  }

  for (let cube of this.cubes) {
    cube.draw(this.perspective.vp);
  }
}

  spawnCube() {
    let r = random(this.perspective.rays);
    let dir = p5.Vector.sub(r, this.perspective.vp).normalize();
    let cube = new Cube(this.perspective.vp.copy(), dir);
    this.cubes.push(cube);
  }
  spawnParticle() {
  let tries = 0;
  let maxTries = 10;

  while (tries < maxTries) {
    let x = random(width);
    let y = random(height);

    let insideCube = false;

    for (let c of this.cubes) {
      if (c.contains(x, y)) {
        insideCube = true;
        break;
      }
    }

    if (!insideCube) {
      this.particles.push(new DustParticle(this.perspective.vp, x, y));
      return;
    }

    tries++;
  }
}
}


class PerspectiveSystem {
  constructor() {
    this.vp = createVector(width / 2, height / 2);
    this.rays = [];
    this.rayStep = 120;
    this.generateRays();
  }

generateRays() {
  this.rays = [];

  let extra = width * 0.5; 


  for (let x = -extra; x <= width + extra; x += this.rayStep) {
    this.rays.push(createVector(x, 0));
  }


  for (let x = -extra; x <= width + extra; x += this.rayStep) {
    this.rays.push(createVector(x, height));
  }
}

  draw() {
    if (this.rayStep !== params.rayStep) {
      this.rayStep = params.rayStep;
      this.generateRays();
    }

    if (params.useMouse) {
  this.vp.x = lerp(this.vp.x, mouseX, 0.1);
  this.vp.y = lerp(this.vp.y, mouseY, 0.1);
} else {
  this.vp.x = lerp(this.vp.x, params.vpX, 0.1);
  this.vp.y = lerp(this.vp.y, params.vpY, 0.1);
}

    if (params.showRays) {
      stroke(220);
      for (let r of this.rays) {
        line(this.vp.x, this.vp.y, r.x, r.y);
      }
    }

    fill(0);
    noStroke();
    circle(this.vp.x, this.vp.y, 6);
  }
}



class Cube {
  constructor(position, direction) {
    this.pos = position.copy();
    this.dir = direction.copy();
    this.dir.x += random(-0.05, 0.05);
    this.dir.normalize();

    this.distance = 0;
    this.speed = params.speed;
    this.size = 2;
    this.maxDist = 900;
    this.depth = params.depth;
  }

  update() {
    this.distance += this.speed;
    this.pos.add(p5.Vector.mult(this.dir, this.speed));
    this.size = map(this.distance, 0, this.maxDist, 2, params.sizeMax);
  }

  draw(vp) {
  
let p1 = createVector(this.pos.x, this.pos.y);
    let p2 = createVector(this.pos.x + this.size, this.pos.y);
    let p3 = createVector(this.pos.x + this.size, this.pos.y + this.size);
    let p4 = createVector(this.pos.x, this.pos.y + this.size);


    let b1 = this.towardVP(p1, vp);
    let b2 = this.towardVP(p2, vp);
    let b3 = this.towardVP(p3, vp);
    let b4 = this.towardVP(p4, vp);

    let alphaGlass = 60;
    let col = color(100, 150, 255, alphaGlass);

    drawingContext.shadowBlur = this.size * 0.3;
    drawingContext.shadowColor = 'rgba(100,150,255,0.4)';
    noStroke();

    fill(col);
    quad(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y); 
    quad(p1.x, p1.y, p2.x, p2.y, b2.x, b2.y, b1.x, b1.y); 
    quad(p2.x, p2.y, p3.x, p3.y, b3.x, b3.y, b2.x, b2.y); 
    drawingContext.shadowBlur = 0;

  
stroke(255, 180); 
strokeWeight(1.5);
noFill();
strokeWeight(map(this.distance, 0, this.maxDist, 0.5, 6));
    
    
let edgeAlpha = map(this.distance, 0, this.maxDist, 200, 40);
stroke(255, edgeAlpha);

drawingContext.shadowBlur = this.size * 0.25;
drawingContext.shadowColor = 'rgba(255,255,255,0.8)';

beginShape();
vertex(p1.x, p1.y);
vertex(p2.x, p2.y);
vertex(p3.x, p3.y);
vertex(p4.x, p4.y);
endShape(CLOSE);

beginShape();
vertex(b1.x, b1.y);
vertex(b2.x, b2.y);
vertex(b3.x, b3.y);
vertex(b4.x, b4.y);
endShape(CLOSE);

line(p1.x, p1.y, b1.x, b1.y);
line(p2.x, p2.y, b2.x, b2.y);
line(p3.x, p3.y, b3.x, b3.y);
line(p4.x, p4.y, b4.x, b4.y);

drawingContext.shadowBlur = 0;
  }

  towardVP(point, vp) {
    let dir = p5.Vector.sub(vp, point);
    dir.mult(this.depth);
    return p5.Vector.add(point, dir);
  }

  isOffscreen() {
    let buffer = this.size * 2;
    return (
      this.pos.x > width + buffer ||
      this.pos.x < -buffer ||
      this.pos.y > height + buffer ||
      this.pos.y < -buffer
    );
  }
  contains(px, py) {
  return (
    px > this.pos.x &&
    px < this.pos.x + this.size &&
    py > this.pos.y &&
    py < this.pos.y + this.size
  );
}
}

function drawTunnelBackground(vp, rays) {
  background(10, 15, 30, 90);

  if (rays.length < 2) return;

  let sorted = rays.slice().sort((a, b) => {
    let a1 = atan2(a.y - vp.y, a.x - vp.x);
    let a2 = atan2(b.y - vp.y, b.x - vp.x);
    return a1 - a2;
  });

  noStroke();

  for (let i = 0; i < sorted.length - 1; i++) {
    let r1 = sorted[i];
    let r2 = sorted[i + 1];

    let midX = (r1.x + r2.x) * 0.5;
    let midY = (r1.y + r2.y) * 0.5;

    let isTop = midY < height * 0.25;
    let isBottom = midY > height * 0.75;

    if (isTop || isBottom) {
  
      let distY = abs(midY - vp.y);
      let t = constrain(distY / (height / 2), 0, 1);
      t = pow(t, 2.0);

      let alpha = map(t, 0, 1, 30, 120);
      let blue = map(t, 0, 1, 60, 140);

      fill(20, 40, blue, alpha);
    } else {

      fill(35, 75, 160, 110);
    }

    quad(
      vp.x, vp.y,
      r1.x, r1.y,
      r2.x, r2.y,
      vp.x, vp.y
    );
  }


  let rLast = sorted[sorted.length - 1];
  let rFirst = sorted[0];

  let midX = (rLast.x + rFirst.x) * 0.5;
  let midY = (rLast.y + rFirst.y) * 0.5;

  let isTop = midY < height * 0.25;
  let isBottom = midY > height * 0.75;

  if (isTop || isBottom) {
    let distY = abs(midY - vp.y);
    let t = constrain(distY / (height / 2), 0, 1);
    t = pow(t, 2.0);

    let alpha = map(t, 0, 1, 30, 120);
    let blue = map(t, 0, 1, 60, 140);

    fill(20, 40, blue, alpha);
  } else {
    fill(35, 75, 160, 110);
  }

  quad(
    vp.x, vp.y,
    rLast.x, rLast.y,
    rFirst.x, rFirst.y,
    vp.x, vp.y
  );
}

function towardVP(point, vp, depth) {
  let dir = p5.Vector.sub(vp, point);
  dir.mult(depth);
  return p5.Vector.add(point, dir);
}
function addGrain() {
  stroke(255, random(5, 20));

  for (let i = 0; i < 80; i++) {
    point(random(width), random(height));
  }
}

class DustParticle {
  constructor(vp, x, y) {
    this.pos = createVector(x, y);

    // base direction (outward from VP)
    this.dir = p5.Vector.sub(this.pos, vp).normalize();

    // small randomness
    this.dir.x += random(-0.1, 0.1);
    this.dir.y += random(-0.1, 0.1);
    this.dir.normalize();

    this.speed = random(0.5, 2);
    this.size = random(1.5, 3.5);
    this.life = 255;
    this.decay = random(0.5, 1.5); // slower fade so interaction is visible

    // oscillation properties
    this.phase = random(TWO_PI);
    this.amp = random(0.5, 2);     // how wide it swings
    this.freq = random(0.05, 0.1);

    this.vp = vp; // keep VP reference for oscillation
  }

  update() {
    // base forward movement
    let move = p5.Vector.mult(this.dir, this.speed);

    // oscillation perpendicular to movement
    let d = dist(this.pos.x, this.pos.y, this.vp.x, this.vp.y);
    let osc = sin(frameCount * this.freq + this.phase);
    let perp = createVector(-this.dir.y, this.dir.x);
    let strength = map(d, 0, width / 2, 0.2, 2);
    perp.mult(osc * this.amp * strength);

    // combine movement
    this.pos.add(move);
    this.pos.add(perp);


    if (mouseIsPressed) {
      let toMouse = createVector(mouseX - this.pos.x, mouseY - this.pos.y);
      let distance = toMouse.mag();
      toMouse.normalize();

      // pull strength proportional to distance, capped for smoothness
      let pullStrength = map(distance, 0, width, 0.5, 5);
      toMouse.mult(pullStrength);

      this.pos.add(toMouse);
    }

    // fade
    this.life -= this.decay;
  }

  draw() {
    noStroke();

    // distance-based fade 
    let d = dist(this.pos.x, this.pos.y, width / 2, height / 2);
    let alpha = map(d, 0, width / 2, 60, this.life);

    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = 'rgba(200,220,255,0.4)';

    fill(params.particleColor.r, params.particleColor.g, params.particleColor.b, alpha + 40);
    circle(this.pos.x, this.pos.y, this.size);

    drawingContext.shadowBlur = 0;
  }

  isDead() {
    return this.life <= 0;
  }
}