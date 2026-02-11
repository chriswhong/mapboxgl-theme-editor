export interface Point {
  x: number
  y: number
}

// Convert RGB (0-1) to HSV
export const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  
  let h = 0
  const s = max === 0 ? 0 : delta / max
  const v = max
  
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6
    } else {
      h = ((r - g) / delta + 4) / 6
    }
  }
  
  return [h, s, v]
}

// Convert HSV to RGB (0-1)
export const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  
  switch (i % 6) {
    case 0: return [v, t, p]
    case 1: return [q, v, p]
    case 2: return [p, v, t]
    case 3: return [p, q, v]
    case 4: return [t, p, v]
    case 5: return [v, p, q]
    default: return [v, p, q]
  }
}

// Interpolate curve value for a given input (0-1)
export const interpolateCurve = (input: number, curve: Point[]): number => {
  // Clamp input to 0-1
  input = Math.max(0, Math.min(1, input))
  
  // Find the two points that bracket this input value
  for (let i = 0; i < curve.length - 1; i++) {
    if (input >= curve[i].x && input <= curve[i + 1].x) {
      // Linear interpolation between these two points
      const t = (input - curve[i].x) / (curve[i + 1].x - curve[i].x)
      return curve[i].y + t * (curve[i + 1].y - curve[i].y)
    }
  }
  
  // If we're beyond the last point, return the last y value
  return curve[curve.length - 1].y
}
