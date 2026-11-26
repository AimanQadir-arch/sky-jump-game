import * as THREE from 'three';

export interface ProceduralTextures {
  platformTop: THREE.CanvasTexture;
  movingTop: THREE.CanvasTexture;
  disappearingTop: THREE.CanvasTexture;
  bounceTop: THREE.CanvasTexture;
  finishTop: THREE.CanvasTexture;
  narrowTop: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAniso: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAniso: number): ProceduralTextures {
  // 1. Normal platform glossy tile grid
  const [c1, ctx1] = makeCanvas(256);
  ctx1.fillStyle = '#ffffff';
  ctx1.fillRect(0, 0, 256, 256);
  ctx1.fillStyle = 'rgba(255,255,255,0.22)';
  ctx1.fillRect(8, 8, 112, 112);
  ctx1.fillRect(136, 136, 112, 112);
  ctx1.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx1.lineWidth = 6;
  ctx1.strokeRect(3, 3, 250, 250);
  ctx1.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx1.lineWidth = 4;
  ctx1.strokeRect(12, 12, 232, 232);
  const platformTop = finalizeTexture(c1, maxAniso);

  // 2. Moving platform chevron stripes
  const [c2, ctx2] = makeCanvas(256);
  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(0, 0, 256, 256);
  ctx2.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx2.fillStyle = 'rgba(0,0,0,0.14)';
  for (let y = -64; y < 320; y += 64) {
    ctx2.beginPath();
    ctx2.moveTo(0, y + 32);
    ctx2.lineTo(128, y);
    ctx2.lineTo(256, y + 32);
    ctx2.lineTo(256, y + 54);
    ctx2.lineTo(128, y + 22);
    ctx2.lineTo(0, y + 54);
    ctx2.closePath();
    ctx2.fill();
  }
  ctx2.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx2.lineWidth = 6;
  ctx2.strokeRect(3, 3, 250, 250);
  const movingTop = finalizeTexture(c2, maxAniso);

  // 3. Disappearing platform frosted crackle pattern
  const [c3, ctx3] = makeCanvas(256);
  ctx3.fillStyle = '#ffffff';
  ctx3.fillRect(0, 0, 256, 256);
  ctx3.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx3.lineWidth = 4;
  ctx3.setLineDash([16, 12]);
  ctx3.strokeRect(10, 10, 236, 236);
  ctx3.setLineDash([]);
  ctx3.beginPath();
  ctx3.moveTo(40, 40);
  ctx3.lineTo(118, 124);
  ctx3.lineTo(95, 195);
  ctx3.moveTo(118, 124);
  ctx3.lineTo(205, 80);
  ctx3.moveTo(155, 165);
  ctx3.lineTo(215, 220);
  ctx3.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx3.lineWidth = 3;
  ctx3.stroke();
  const disappearingTop = finalizeTexture(c3, maxAniso);

  // 4. Bounce pad concentric target rings
  const [c4, ctx4] = makeCanvas(256);
  ctx4.fillStyle = '#ec4899';
  ctx4.fillRect(0, 0, 256, 256);
  const rings = [
    { r: 108, col: '#fbcfe8' },
    { r: 80, col: '#f472b6' },
    { r: 52, col: '#fef08a' },
    { r: 24, col: '#ffffff' },
  ];
  for (const ring of rings) {
    ctx4.beginPath();
    ctx4.arc(128, 128, ring.r, 0, Math.PI * 2);
    ctx4.fillStyle = ring.col;
    ctx4.fill();
  }
  const bounceTop = finalizeTexture(c4, maxAniso);

  // 5. Finish platform checkered racing pattern
  const [c5, ctx5] = makeCanvas(256);
  const sq = 32;
  for (let y = 0; y < 256; y += sq) {
    for (let x = 0; x < 256; x += sq) {
      const dark = ((x + y) / sq) % 2 === 0;
      ctx5.fillStyle = dark ? '#1e293b' : '#f8fafc';
      ctx5.fillRect(x, y, sq, sq);
    }
  }
  ctx5.strokeStyle = '#facc15';
  ctx5.lineWidth = 10;
  ctx5.strokeRect(5, 5, 246, 246);
  const finishTop = finalizeTexture(c5, maxAniso);

  // 6. Narrow balance bridge center guideline
  const [c6, ctx6] = makeCanvas(256);
  ctx6.fillStyle = '#ffffff';
  ctx6.fillRect(0, 0, 256, 256);
  ctx6.fillStyle = 'rgba(255,255,255,0.45)';
  ctx6.fillRect(114, 0, 28, 256);
  ctx6.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx6.lineWidth = 6;
  ctx6.strokeRect(3, 3, 250, 250);
  const narrowTop = finalizeTexture(c6, maxAniso);

  // 7. Radial soft contact shadow under player
  const [c7, ctx7] = makeCanvas(128);
  const grad = ctx7.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.58)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.25)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx7.fillStyle = grad;
  ctx7.fillRect(0, 0, 128, 128);
  const contactShadow = finalizeTexture(c7, maxAniso);

  return {
    platformTop,
    movingTop,
    disappearingTop,
    bounceTop,
    finishTop,
    narrowTop,
    contactShadow,
    dispose: () => {
      platformTop.dispose();
      movingTop.dispose();
      disappearingTop.dispose();
      bounceTop.dispose();
      finishTop.dispose();
      narrowTop.dispose();
      contactShadow.dispose();
    },
  };
}
