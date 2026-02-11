import { useState, useEffect } from 'react'
import './App.css'

// Helper functions for color space conversions
const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
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

const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
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

function App() {
  const [exposure, setExposure] = useState(0)
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(1)
  const [value, setValue] = useState(1)
  const [vibrancy, setVibrancy] = useState(1)
  const [crossProcess, setCrossProcess] = useState(0)
  const [lutBase64, setLutBase64] = useState('')

  // Generate 16x16x16 3D LUT cube based on all parameters
  const generateLUT = (exp: number, bright: number, cont: number, h: number, sat: number, val: number, vib: number, cross: number): string => {
    const cubeSize = 16
    const canvas = document.createElement('canvas')
    // Layout: 16 slices horizontally, each slice is 16x16
    canvas.width = cubeSize * cubeSize // 256 pixels wide
    canvas.height = cubeSize // 16 pixels tall
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    const imageData = ctx.createImageData(canvas.width, canvas.height)
    const data = imageData.data
    
    // Generate 3D LUT cube laid out as horizontal slices
    for (let b = 0; b < cubeSize; b++) { // Blue channel (slices)
      for (let g = 0; g < cubeSize; g++) { // Green channel (rows within slice)
        for (let r = 0; r < cubeSize; r++) { // Red channel (columns within slice)
          // Calculate pixel position in the image
          const x = b * cubeSize + r
          const y = g
          const index = (y * canvas.width + x) * 4
          
          // Normalize to 0-1 range
          let red = r / (cubeSize - 1)
          let green = g / (cubeSize - 1)
          let blue = b / (cubeSize - 1)
          
          // Apply exposure (power curve)
          const exposureFactor = Math.pow(2, exp)
          red *= exposureFactor
          green *= exposureFactor
          blue *= exposureFactor
          
          // Apply brightness (multiplicative)
          red *= bright
          green *= bright
          blue *= bright
          
          // Apply contrast (around midpoint)
          red = (red - 0.5) * cont + 0.5
          green = (green - 0.5) * cont + 0.5
          blue = (blue - 0.5) * cont + 0.5
          
          // Clamp before HSV operations
          red = Math.max(0, Math.min(1, red))
          green = Math.max(0, Math.min(1, green))
          blue = Math.max(0, Math.min(1, blue))
          
          // Convert to HSV for hue/saturation/value adjustments
          let [hsvH, hsvS, hsvV] = rgbToHsv(red, green, blue)
          
          // Apply hue shift (h is in degrees -180 to 180)
          hsvH = (hsvH + h / 360) % 1
          if (hsvH < 0) hsvH += 1
          
          // Apply saturation
          hsvS = hsvS * sat
          
          // Apply vibrancy (boost saturation of less saturated colors)
          if (vib !== 0) {
            const vibrancyBoost = (1 - hsvS) * vib
            hsvS = hsvS + vibrancyBoost
          }
          
          // Apply value
          hsvV = hsvV * val
          
          // Clamp HSV values
          hsvS = Math.max(0, Math.min(1, hsvS))
          hsvV = Math.max(0, Math.min(1, hsvV))
          
          // Convert back to RGB
          const rgbResult = hsvToRgb(hsvH, hsvS, hsvV)
          red = rgbResult[0]
          green = rgbResult[1]
          blue = rgbResult[2]
          
          // Apply cross process effect (shift colors in a film-like way)
          if (cross !== 0) {
            const luminance = 0.299 * red + 0.587 * green + 0.114 * blue
            // Add cyan/green to shadows, yellow/red to highlights
            red += cross * (luminance - 0.5) * 0.3
            green += cross * (0.3 - luminance * 0.2)
            blue += cross * (0.5 - luminance) * 0.3
          }
          
          // Final clamp
          red = Math.max(0, Math.min(1, red))
          green = Math.max(0, Math.min(1, green))
          blue = Math.max(0, Math.min(1, blue))
          
          // Set pixel data
          data[index] = red * 255
          data[index + 1] = green * 255
          data[index + 2] = blue * 255
          data[index + 3] = 255 // Alpha
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/png')
  }

  // Update LUT when sliders change
  useEffect(() => {
    const base64 = generateLUT(exposure, brightness, contrast, hue, saturation, value, vibrancy, crossProcess)
    setLutBase64(base64)
  }, [exposure, brightness, contrast, hue, saturation, value, vibrancy, crossProcess])

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>LUT Editor</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Preview</h2>
        {lutBase64 && (
          <img 
            src={lutBase64} 
            alt="LUT Preview" 
            style={{ 
              width: '768px', 
              height: '48px', 
              imageRendering: 'pixelated',
              border: '1px solid #ccc'
            }} 
          />
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Controls</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Exposure: {exposure.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="-2" 
            max="2" 
            step="0.1" 
            value={exposure}
            onChange={(e) => setExposure(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Brightness: {brightness.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0.25" 
            max="1.75" 
            step="0.01" 
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Contrast: {contrast.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="-2" 
            max="4" 
            step="0.1" 
            value={contrast}
            onChange={(e) => setContrast(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Hue: {hue.toFixed(0)}
          </label>
          <input 
            type="range" 
            min="-180" 
            max="180" 
            step="1" 
            value={hue}
            onChange={(e) => setHue(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Saturation: {saturation.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1" 
            value={saturation}
            onChange={(e) => setSaturation(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Value: {value.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1" 
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Vibrancy: {vibrancy.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0" 
            max="2" 
            step="0.1" 
            value={vibrancy}
            onChange={(e) => setVibrancy(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Cross Process: {crossProcess.toFixed(2)}
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={crossProcess}
            onChange={(e) => setCrossProcess(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
