export const FILTERS: Record<string, { filter: string; label: string }> = {
  none: { filter: "none", label: "なし" },
  warm: {
    filter: "sepia(0.3) saturate(1.4) brightness(1.1)",
    label: "ウォーム",
  },
  cool: {
    filter: "saturate(0.8) hue-rotate(20deg) brightness(1.05)",
    label: "クール",
  },
  vintage: {
    filter: "sepia(0.5) contrast(0.9) brightness(1.1)",
    label: "ヴィンテージ",
  },
  bw: { filter: "grayscale(1) contrast(1.1)", label: "モノクロ" },
  bright: {
    filter: "brightness(1.2) contrast(1.05) saturate(1.1)",
    label: "ブライト",
  },
  cafe: {
    filter: "sepia(0.15) saturate(1.2) brightness(1.05) contrast(1.05)",
    label: "カフェ風",
  },
};

export type TextPosition = "top" | "center" | "bottom";

export interface TextOverlayOptions {
  text: string;
  position: TextPosition;
  fontSize: number; // 16-48
  color: string; // hex
}

/**
 * Draws the image onto the canvas with the specified CSS filter applied.
 */
export function applyFilterToCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  filterString: string
): void {
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.filter = filterString === "none" ? "none" : filterString;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";
}

/**
 * Draws a text overlay with a semi-transparent background band.
 */
export function addTextOverlay(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  options: TextOverlayOptions
): void {
  if (!options.text.trim()) return;

  const { text, position, fontSize, color } = options;
  const scaledFontSize = fontSize * (canvasWidth / 400);
  const padding = scaledFontSize * 0.8;
  const lineHeight = scaledFontSize * 1.4;

  ctx.font = `bold ${scaledFontSize}px "Noto Sans JP", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Word-wrap text
  const maxTextWidth = canvasWidth * 0.85;
  const lines = wrapText(ctx, text, maxTextWidth);

  const bandHeight = lines.length * lineHeight + padding * 2;

  let bandY: number;
  switch (position) {
    case "top":
      bandY = canvasHeight * 0.05;
      break;
    case "center":
      bandY = (canvasHeight - bandHeight) / 2;
      break;
    case "bottom":
      bandY = canvasHeight - bandHeight - canvasHeight * 0.05;
      break;
  }

  // Draw semi-transparent background band
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, bandY, canvasWidth, bandHeight);

  // Draw text lines
  ctx.fillStyle = color;
  lines.forEach((line, index) => {
    const textY = bandY + padding + lineHeight * index + lineHeight / 2;
    ctx.fillText(line, canvasWidth / 2, textY);
  });
}

/**
 * Wraps text into multiple lines based on max width.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let currentLine = "";

  for (const char of chars) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Exports the canvas content as a JPEG Blob with 0.9 quality.
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas export failed"));
        }
      },
      "image/jpeg",
      0.9
    );
  });
}

/**
 * Loads a File as an HTMLImageElement and optionally downscales
 * it so the width does not exceed maxWidth.
 */
export function resizeImage(
  file: File,
  maxWidth: number
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width <= maxWidth) {
        resolve(img);
        return;
      }

      // Downscale via an offscreen canvas
      const scale = maxWidth / img.width;
      const newWidth = maxWidth;
      const newHeight = Math.round(img.height * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = newWidth;
      offscreen.height = newHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) {
        reject(new Error("Could not get offscreen canvas context"));
        return;
      }
      offCtx.drawImage(img, 0, 0, newWidth, newHeight);

      const resizedImg = new Image();
      resizedImg.onload = () => {
        resolve(resizedImg);
      };
      resizedImg.onerror = () => reject(new Error("Failed to load resized image"));
      resizedImg.src = offscreen.toDataURL("image/jpeg", 0.95);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
