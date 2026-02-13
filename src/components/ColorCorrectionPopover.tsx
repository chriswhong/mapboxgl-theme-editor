import * as Popover from '@radix-ui/react-popover'
import { Cross2Icon, ArrowRightIcon, Pencil1Icon } from '@radix-ui/react-icons'
import ParameterSlider from './ParameterSlider'
import IconButton from './IconButton'
import EyeDropperIcon from './EyeDropperIcon'
import type { ColorCorrection } from '../utils/lutUtils'
import { rgbToHsv, hsvToRgb } from '../utils/colorUtils'

interface ColorCorrectionPopoverProps {
  correction: ColorCorrection
  onChange: (updates: Partial<ColorCorrection>) => void
  onPickColor: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export default function ColorCorrectionPopover({ 
  correction,
  onChange,
  onPickColor,
  open,
  onOpenChange,
  children
}: ColorCorrectionPopoverProps) {
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return { r: 0.5, g: 0.5, b: 0.5 }
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    }
  }

  const updateAdjustments = (adjustmentUpdates: Partial<ColorCorrection['adjustments']>) => {
    onChange({ adjustments: { ...correction.adjustments, ...adjustmentUpdates } })
  }

  const calculateOutputColor = () => {
    const { r, g, b } = correction.targetColor
    const { hueShift, saturationShift, valueShift, brightnessShift } = correction.adjustments

    // Convert to HSV
    let [h, s, v] = rgbToHsv(r, g, b)

    // Apply adjustments
    h = (h + hueShift / 360) % 1
    if (h < 0) h += 1
    s = Math.max(0, Math.min(1, s + saturationShift))
    v = Math.max(0, Math.min(1, v + valueShift))

    // Convert back to RGB
    let [outR, outG, outB] = hsvToRgb(h, s, v)

    // Apply brightness
    const brightnessMult = 1 + brightnessShift
    outR = Math.max(0, Math.min(1, outR * brightnessMult))
    outG = Math.max(0, Math.min(1, outG * brightnessMult))
    outB = Math.max(0, Math.min(1, outB * brightnessMult))

    return { r: outR, g: outG, b: outB }
  }

  const outputColor = calculateOutputColor()

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        {children}
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content
          className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-4 w-80 max-h-[600px] overflow-y-auto z-50"
          sideOffset={5}
          side="right"
          align="start"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="space-y-3 text-white">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Edit Color Correction</h3>
              <Popover.Close asChild>
                <IconButton>
                  <Cross2Icon className="w-4 h-4" />
                </IconButton>
              </Popover.Close>
            </div>

            {/* Color Preview */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-700 rounded">
              <div className="flex flex-col items-center gap-1">
                <div
                  onClick={onPickColor}
                  className="w-16 h-16 rounded border-2 border-gray-500 cursor-pointer relative group"
                  style={{ backgroundColor: rgbToHex(correction.targetColor.r, correction.targetColor.g, correction.targetColor.b) }}
                  title="Click to pick color from map"
                >
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                    <Pencil1Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-xs text-gray-400">Input Color</span>
              </div>
              <ArrowRightIcon className="w-6 h-6 text-gray-400" />
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-16 h-16 rounded border-2 border-gray-500"
                  style={{ backgroundColor: rgbToHex(outputColor.r, outputColor.g, outputColor.b) }}
                />
                <span className="text-xs text-gray-400">Output Color</span>
              </div>
            </div>

            

            {/* Tolerance */}
            <ParameterSlider
              label="Tolerance"
              value={correction.tolerance}
              onChange={(v) => onChange({ tolerance: v })}
              onReset={() => onChange({ tolerance: 0.3 })}
              min={0.05}
              max={1}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
            />

            {/* Adjustments */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-gray-100">Adjustments</h4>
              
              <ParameterSlider
                label="Hue Shift"
                value={correction.adjustments.hueShift}
                onChange={(v) => updateAdjustments({ hueShift: v })}
                onReset={() => updateAdjustments({ hueShift: 0 })}
                min={-180}
                max={180}
                step={1}
                format={(v) => `${v.toFixed(0)}°`}
              />
              
              <ParameterSlider
                label="Saturation"
                value={correction.adjustments.saturationShift}
                onChange={(v) => updateAdjustments({ saturationShift: v })}
                onReset={() => updateAdjustments({ saturationShift: 0 })}
                min={-1}
                max={1}
                step={0.05}
                format={(v) => v >= 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`}
              />
              
              <ParameterSlider
                label="Value"
                value={correction.adjustments.valueShift}
                onChange={(v) => updateAdjustments({ valueShift: v })}
                onReset={() => updateAdjustments({ valueShift: 0 })}
                min={-1}
                max={1}
                step={0.05}
                format={(v) => v >= 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`}
              />
              
              <ParameterSlider
                label="Brightness"
                value={correction.adjustments.brightnessShift}
                onChange={(v) => updateAdjustments({ brightnessShift: v })}
                onReset={() => updateAdjustments({ brightnessShift: 0 })}
                min={-1}
                max={1}
                step={0.05}
                format={(v) => v >= 0 ? `+${(v * 100).toFixed(0)}%` : `${(v * 100).toFixed(0)}%`}
              />
            </div>
          </div>
          <Popover.Arrow className="fill-gray-700" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
