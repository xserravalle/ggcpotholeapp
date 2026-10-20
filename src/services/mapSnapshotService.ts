import { SeverityLevel } from '../types/pothole';

function project(lat: number, lng: number, zoom: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const scale = 256 * Math.pow(2, zoom);
  const x = scale * (lng / 360 + 0.5);
  const y = scale * (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI));
  return { x, y };
}

function loadImage(url: string, timeoutMs: number = 3500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export interface MapSnapshotOptions {
  width?: number;
  height?: number;
  zoom?: number;
  severity?: SeverityLevel | string;
  roadName?: string;
  landmark?: string;
}

/**
 * Generates an actual PNG image snapshot of the map centralized around the
 * detected GPS shock location using HTML5 canvas and OpenStreetMap tiles.
 * Returns a base64 PNG data URL suitable for embedding in PDF, HTML, or report previews.
 */
export async function generateMapSnapshot(
  lat: number,
  lng: number,
  options: MapSnapshotOptions = {}
): Promise<string> {
  const width = options.width || 600;
  const height = options.height || 320;
  const zoom = options.zoom || 16;
  const severity = options.severity || 'moderate';

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // Dark baseline background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  const centerPixel = project(lat, lng, zoom);
  const centerTileX = Math.floor(centerPixel.x / 256);
  const centerTileY = Math.floor(centerPixel.y / 256);
  const offsetX = centerPixel.x % 256;
  const offsetY = centerPixel.y % 256;

  const centerX = width / 2;
  const centerY = height / 2;

  // Load a 3x3 grid of tiles centered around coordinates
  const tilePromises: Promise<{ img: HTMLImageElement | null; x: number; y: number }>[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;
      const url = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
      const destX = centerX - offsetX + dx * 256;
      const destY = centerY - offsetY + dy * 256;

      tilePromises.push(
        loadImage(url).then(img => ({ img, x: destX, y: destY }))
      );
    }
  }

  const loadedTiles = await Promise.all(tilePromises);
  let renderedTilesCount = 0;

  for (const { img, x, y } of loadedTiles) {
    if (img) {
      try {
        ctx.drawImage(img, x, y, 256, 256);
        renderedTilesCount++;
      } catch (e) {
        console.warn('Could not draw tile onto canvas:', e);
      }
    }
  }

  // If tiles failed to render (e.g. device is offline), render stylized fallback radar grid
  if (renderedTilesCount === 0) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }
  }

  // Determine severity pin color
  const pinColor = 
    severity === 'critical' ? '#f43f5e' : 
    severity === 'severe' ? '#ef4444' : 
    severity === 'moderate' ? '#f59e0b' : '#10b981';

  // Draw Pulsing Pin at the exact center (centerX, centerY)
  // Outer shock wave ring
  ctx.fillStyle = `${pinColor}33`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 34, 0, Math.PI * 2);
  ctx.fill();

  // Secondary shock wave ring
  ctx.fillStyle = `${pinColor}66`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
  ctx.fill();

  // Pin core
  ctx.fillStyle = pinColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // White center pip
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Top Overlay Badge: System Brand & GPS Center
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.beginPath();
  drawRoundedRect(ctx, 12, 12, width - 24, 30, 8);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Green active pulse beacon
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(26, 27, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('GGC SansPotholes', 38, 30);

  ctx.font = '10px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`GPS Center: ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 160, 30);

  // Bottom Label: Road Corridor & Incident Snapshot Tag
  const roadLabel = options.roadName || options.landmark || 'Gwinnett Roadway Corridor';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  drawRoundedRect(ctx, 12, height - 32, width - 24, 22, 6);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`📍 ${roadLabel}`, 20, height - 17);

  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('CENTRALIZED LOCATION SNAPSHOT', width - 200, height - 17);

  return canvas.toDataURL('image/png');
}
