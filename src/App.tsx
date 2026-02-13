import { useState, useMemo } from 'react'
import { CopyIcon } from '@radix-ui/react-icons'
import ColorCurve from './ColorCurve'
import ColorWheel from './components/ColorWheel'
import ParameterSlider from './components/ParameterSlider'
import ColorCorrectionPanel from './components/ColorCorrectionPanel'
import Map from './components/Map'
import type { Point } from './utils/colorUtils'
import { generateLUT, type ColorCorrection } from './utils/lutUtils'
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

  // Color corrections (targeted color adjustments)
  const [colorCorrections, setColorCorrections] = useState<ColorCorrection[]>([])
  const [pickingColorForId, setPickingColorForId] = useState<string | null>(null)

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
      gainStrength,
      colorCorrections
    })
  }, [exposure, brightness, contrast, hue, saturation, value, vibrancy, crossProcess, redCurve, greenCurve, blueCurve, lift, liftStrength, gamma, gammaStrength, gain, gainStrength, colorCorrections])

  const copyLUTToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lutBase64)
      console.log('LUT copied to clipboard')
    } catch (err) {
      console.error('Failed to copy LUT:', err)
    }
  }
  const handlePickColor = (correctionId: string) => {
    setPickingColorForId(correctionId)
  }

  const handleColorPicked = (color: { r: number; g: number; b: number }) => {
    if (pickingColorForId) {
      setColorCorrections(corrections =>
        corrections.map(c =>
          c.id === pickingColorForId
            ? { ...c, targetColor: color }
            : c
        )
      )
      setPickingColorForId(null)
    }
  }



  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      {/* Left Sidebar with Controls and Preview */}
      <div className="w-80 bg-gray-800 flex flex-col">
        {/* Fixed Header with Title and Preview */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold mb-4">
            <a
              href="https://docs.mapbox.com/map-styles/standard/guides/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              Mapbox Standard Style
            </a>
            {' '}Theme Editor
          </h1>
          <p className="text-xs text-gray-400 mb-6">
            The Mapbox Standard Style accepts a base64-encoded 3D LUT (Look-Up Table) to apply complex color transformations. This editor allows you to create and customize your own LUT by adjusting various parameters like exposure, contrast, hue, saturation, and more. You can also define custom color curves and targeted color corrections for precise control over the final look of your map.

            Once you're satisfied with your adjustments, simply copy the generated LUT as a base64 string and use it in your Mapbox style to transform the colors of your map layers.
          </p>
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
              onReset={() => setExposure(0)}
              min={-2}
              max={2}
              step={0.1}
            />

            <ParameterSlider
              label="Brightness"
              value={brightness}
              onChange={setBrightness}
              onReset={() => setBrightness(1)}
              min={0.25}
              max={1.75}
              step={0.01}
            />

            <ParameterSlider
              label="Contrast"
              value={contrast}
              onChange={setContrast}
              onReset={() => setContrast(1)}
              min={-2}
              max={4}
              step={0.1}
            />

            <ParameterSlider
              label="Hue"
              value={hue}
              onChange={setHue}
              onReset={() => setHue(0)}
              min={-180}
              max={180}
              step={1}
              format={(v) => `${v.toFixed(0)}°`}
            />

            <ParameterSlider
              label="Saturation"
              value={saturation}
              onChange={setSaturation}
              onReset={() => setSaturation(1)}
              min={0}
              max={2}
              step={0.1}
            />

            <ParameterSlider
              label="Value"
              value={value}
              onChange={setValue}
              onReset={() => setValue(1)}
              min={0}
              max={2}
              step={0.1}
            />

            <ParameterSlider
              label="Vibrancy"
              value={vibrancy}
              onChange={setVibrancy}
              onReset={() => setVibrancy(0)}
              min={0}
              max={2}
              step={0.1}
            />

            <ParameterSlider
              label="Cross Process"
              value={crossProcess}
              onChange={setCrossProcess}
              onReset={() => setCrossProcess(0)}
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
                onReset={() => setRedCurve([
                  { x: 0, y: 0 },
                  { x: 0.25, y: 0.25 },
                  { x: 0.5, y: 0.5 },
                  { x: 0.75, y: 0.75 },
                  { x: 1, y: 1 }
                ])}
              />
              <ColorCurve
                color="#22c55e"
                label="Green"
                points={greenCurve}
                onChange={setGreenCurve}
                onReset={() => setGreenCurve([
                  { x: 0, y: 0 },
                  { x: 0.25, y: 0.25 },
                  { x: 0.5, y: 0.5 },
                  { x: 0.75, y: 0.75 },
                  { x: 1, y: 1 }
                ])}
              />
              <ColorCurve
                color="#3b82f6"
                label="Blue"
                points={blueCurve}
                onChange={setBlueCurve}
                onReset={() => setBlueCurve([
                  { x: 0, y: 0 },
                  { x: 0.25, y: 0.25 },
                  { x: 0.5, y: 0.5 },
                  { x: 0.75, y: 0.75 },
                  { x: 1, y: 1 }
                ])}
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
                  onReset={() => setLift({ x: 0, y: 0 })}
                />
                <ColorWheel
                  label="Gamma"
                  offset={gamma}
                  onChange={setGamma}
                  onReset={() => setGamma({ x: 0, y: 0 })}
                />
              </div>
              <div className="flex gap-3">
                <ColorWheel
                  label="Gain"
                  offset={gain}
                  onChange={setGain}
                  onReset={() => setGain({ x: 0, y: 0 })}
                />
              </div>
            </div>

            {/* Color Corrections */}
            <div className="mt-6">
              <ColorCorrectionPanel
                corrections={colorCorrections}
                onChange={setColorCorrections}
                onPickColor={handlePickColor}
              />
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
      <div className="flex-1 bg-gray-900 relative">
        <Map
          lutBase64={lutBase64}
          isPickingColor={pickingColorForId !== null}
          onColorPicked={handleColorPicked}
        />
      </div>
    </div>
  )
}

export default App
