import { useState, useMemo } from 'react'
import { CopyIcon } from '@radix-ui/react-icons'
import ColorCurve from './ColorCurve'
import ColorWheel from './components/ColorWheel'
import ParameterSlider from './components/ParameterSlider'
import Map from './components/Map'
import type { Point } from './utils/colorUtils'
import { generateLUT } from './utils/lutUtils'
import './App.css'

function App() {
  const [exposure, setExposure] = useState(0)
  const [brightness, setBrightness] = useState(1)
  const [contrast, setContrast] = useState(1)
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(1)
  const [value, setValue] = useState(1)
  const [vibrancy, setVibrancy] = useState(0)
  const [crossProcess, setCrossProcess] = useState(0)
  
  // Color wheel offsets for Lift, Gamma, Gain
  const [lift, setLift] = useState({ x: 0, y: 0 })
  const [liftStrength] = useState(1)
  const [gamma, setGamma] = useState({ x: 0, y: 0 })
  const [gammaStrength] = useState(1)
  const [gain, setGain] = useState({ x: 0, y: 0 })
  const [gainStrength] = useState(1)
  
  // Initialize curve points (5 points evenly spaced)
  const [redCurve, setRedCurve] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
    { x: 1, y: 1 }
  ])
  const [greenCurve, setGreenCurve] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
    { x: 1, y: 1 }
  ])
  const [blueCurve, setBlueCurve] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
    { x: 1, y: 1 }
  ])

  // Generate LUT when sliders or curves change
  const lutBase64 = useMemo(() => {
    return generateLUT({
      exposure,
      brightness,
      contrast,
      hue,
      saturation,
      value,
      vibrancy,
      crossProcess,
      redCurve,
      greenCurve,
      blueCurve,
      lift,
      liftStrength,
      gamma,
      gammaStrength,
      gain,
      gainStrength
    })
  }, [exposure, brightness, contrast, hue, saturation, value, vibrancy, crossProcess, redCurve, greenCurve, blueCurve, lift, liftStrength, gamma, gammaStrength, gain, gainStrength])

const copyLUTToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lutBase64)
      console.log('LUT copied to clipboard')
    } catch (err) {
      console.error('Failed to copy LUT:', err)
    }
  }

  
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {/* Left Sidebar with Controls and Preview */}
      <div className="w-80 bg-gray-800 flex flex-col">
        {/* Fixed Header with Title and Preview */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold mb-4">Mapbox Standard Style Theme Editor</h1>
          
          {/* LUT Preview */}
          {lutBase64 && (
            <div>
              <img 
                src={lutBase64} 
                alt="LUT Preview" 
                className="w-full border border-gray-700 rounded"
                style={{ imageRendering: 'pixelated' }}
              />
              <button
                onClick={copyLUTToClipboard}
                className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                <CopyIcon className="w-3 h-3" />
                Copy LUT as Base64
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <ParameterSlider
              label="Exposure"
              value={exposure}
              onChange={setExposure}
              min={-2}
              max={2}
              step={0.1}
            />
            
            <ParameterSlider
              label="Brightness"
              value={brightness}
              onChange={setBrightness}
              min={0.25}
              max={1.75}
              step={0.01}
            />
            
            <ParameterSlider
              label="Contrast"
              value={contrast}
              onChange={setContrast}
              min={-2}
              max={4}
              step={0.1}
            />
            
            <ParameterSlider
              label="Hue"
              value={hue}
              onChange={setHue}
              min={-180}
              max={180}
              step={1}
              format={(v) => `${v.toFixed(0)}°`}
            />
            
            <ParameterSlider
              label="Saturation"
              value={saturation}
              onChange={setSaturation}
              min={0}
              max={2}
              step={0.1}
            />
            
            <ParameterSlider
              label="Value"
              value={value}
              onChange={setValue}
              min={0}
              max={2}
              step={0.1}
            />
            
            <ParameterSlider
              label="Vibrancy"
              value={vibrancy}
              onChange={setVibrancy}
              min={0}
              max={2}
              step={0.1}
            />
            
            <ParameterSlider
              label="Cross Process"
              value={crossProcess}
              onChange={setCrossProcess}
              min={0}
              max={1}
              step={0.1}
            />

          {/* Color Curves */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold">Color Curves</h3>
            <ColorCurve 
              color="#ef4444" 
              label="Red" 
              points={redCurve} 
              onChange={setRedCurve} 
            />
            <ColorCurve 
              color="#22c55e" 
              label="Green" 
              points={greenCurve} 
              onChange={setGreenCurve} 
            />
            <ColorCurve 
              color="#3b82f6" 
              label="Blue" 
              points={blueCurve} 
              onChange={setBlueCurve} 
            />
          </div>

          {/* Color Wheels */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold">Color Wheels</h3>
            <div className="flex gap-3">
              <ColorWheel 
                label="Lift" 
                offset={lift} 
                onChange={setLift} 
              />
              <ColorWheel 
                label="Gamma" 
                offset={gamma} 
                onChange={setGamma} 
              />
            </div>
            <div className="flex gap-3">
              <ColorWheel 
                label="Gain" 
                offset={gain} 
                onChange={setGain} 
              />
            </div>
          </div>

          {/* Attribution */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              Controls inspired by{' '}
              <a 
                href="https://o-l-l-i.github.io/lut-maker/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                https://o-l-l-i.github.io/lut-maker/
              </a>
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Right Side - Map */}
      <div className="flex-1 bg-gray-900">
        <Map lutBase64={lutBase64} />
      </div>
    </div>
  )
}

export default App
