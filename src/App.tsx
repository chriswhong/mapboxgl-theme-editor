import { useState, useEffect } from 'react'
import * as Slider from '@radix-ui/react-slider'
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
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {/* Left Sidebar with Controls and Preview */}
      <div className="w-80 bg-gray-800 flex flex-col">
        {/* Fixed Header with Title and Preview */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold mb-4">LUT Editor</h1>
          
          {/* LUT Preview */}
          {lutBase64 && (
            <img 
              src={lutBase64} 
              alt="LUT Preview" 
              className="w-full border border-gray-700 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
          )}
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
          {/* Exposure */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Exposure</label>
              <span className="text-xs text-gray-400">{exposure.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[exposure]}
              onValueChange={(value) => setExposure(value[0])}
              min={-2}
              max={2}
              step={0.1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Brightness</label>
              <span className="text-xs text-gray-400">{brightness.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[brightness]}
              onValueChange={(value) => setBrightness(value[0])}
              min={0.25}
              max={1.75}
              step={0.01}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Contrast</label>
              <span className="text-xs text-gray-400">{contrast.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[contrast]}
              onValueChange={(value) => setContrast(value[0])}
              min={-2}
              max={4}
              step={0.1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Hue */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Hue</label>
              <span className="text-xs text-gray-400">{hue.toFixed(0)}°</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[hue]}
              onValueChange={(value) => setHue(value[0])}
              min={-180}
              max={180}
              step={1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Saturation</label>
              <span className="text-xs text-gray-400">{saturation.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[saturation]}
              onValueChange={(value) => setSaturation(value[0])}
              min={0}
              max={2}
              step={0.1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Value */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Value</label>
              <span className="text-xs text-gray-400">{value.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[value]}
              onValueChange={(value) => setValue(value[0])}
              min={0}
              max={2}
              step={0.1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Vibrancy */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Vibrancy</label>
              <span className="text-xs text-gray-400">{vibrancy.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[vibrancy]}
              onValueChange={(value) => setVibrancy(value[0])}
              min={0}
              max={2}
              step={0.1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>

          {/* Cross Process */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium">Cross Process</label>
              <span className="text-xs text-gray-400">{crossProcess.toFixed(2)}</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-4"
              value={[crossProcess]}
              onValueChange={(value) => setCrossProcess(value[0])}
              min={0}
              max={1}
              step={0.1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Slider.Root>
          </div>
        </div>
        </div>
      </div>

      {/* Right Side - Empty */}
      <div className="flex-1 bg-gray-900">
      </div>
    </div>
  )
}

export default App
