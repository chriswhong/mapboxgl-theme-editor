import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import ResetButton from './components/ResetButton'
import type { Point } from './utils/colorUtils'

interface ColorCurveProps {
  color: string
  label: string
  points: Point[]
  onChange: (points: Point[]) => void
  onReset?: () => void
}

export default function ColorCurve({ color, label, points, onChange, onReset }: ColorCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [draggedMidpointIndex, setDraggedMidpointIndex] = useState<number | null>(null)
  const [aspectRatio, setAspectRatio] = useState(1)

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = 120

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1f2937) // gray-800
    sceneRef.current = scene

    // Camera (orthographic for 2D)
    const aspectRatio = width / height
    const camera = new THREE.OrthographicCamera(0, aspectRatio, 1, 0, 0.1, 10)
    camera.position.z = 1
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer

    // Calculate aspect ratio for proper circle rendering
    setAspectRatio(width / height)

    return () => {
      renderer.dispose()
    }
  }, [])

  // Render curve and points
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

    const scene = sceneRef.current
    const camera = cameraRef.current
    const renderer = rendererRef.current

    // Clear previous objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0])
    }

    // Create curve from points using CatmullRomCurve3
    const curvePoints = points.map(p => new THREE.Vector3(p.x * aspectRatio, p.y, 0))
    const curve = new THREE.CatmullRomCurve3(curvePoints)
    curve.curveType = 'catmullrom'
    curve.tension = 0.5

    // Create line geometry from curve
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(
      curve.getPoints(100)
    )
    const curveMaterial = new THREE.LineBasicMaterial({ color })
    const curveLine = new THREE.Line(curveGeometry, curveMaterial)
    scene.add(curveLine)

    // Add grid lines
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x374151, transparent: true, opacity: 0.3 })
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = i * 0.25
      const gridGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, y, -0.1),
        new THREE.Vector3(aspectRatio, y, -0.1)
      ])
      scene.add(new THREE.Line(gridGeometry, gridMaterial))
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = i * 0.25 * aspectRatio
      const gridGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -0.1),
        new THREE.Vector3(x, 1, -0.1)
      ])
      scene.add(new THREE.Line(gridGeometry, gridMaterial))
    }

    // Add border
    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(aspectRatio, 0, 0),
      new THREE.Vector3(aspectRatio, 1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0)
    ])
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4b5563 })
    scene.add(new THREE.Line(borderGeometry, borderMaterial))

    // Add midpoint circles (small circles between control points)
    for (let i = 0; i < points.length - 1; i++) {
      // Get midpoint along the curve
      const curvePoint = curve.getPointAt((i + 0.5) / (points.length - 1))
      
      // Draw small circle (white stroke, transparent fill)
      const midGeometry = new THREE.CircleGeometry(0.024, 16)
      const midMaterial = new THREE.MeshBasicMaterial({ 
        color: draggedMidpointIndex === i ? 0xffffff : 0x1f2937,
        transparent: true,
        opacity: draggedMidpointIndex === i ? 1 : 0.5
      })
      const midCircle = new THREE.Mesh(midGeometry, midMaterial)
      midCircle.position.set(curvePoint.x, curvePoint.y, 0.09)
      scene.add(midCircle)
      
      // Add white stroke for midpoint
      const midStrokeGeometry = new THREE.RingGeometry(0.024, 0.030, 16)
      const midStrokeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const midStroke = new THREE.Mesh(midStrokeGeometry, midStrokeMaterial)
      midStroke.position.set(curvePoint.x, curvePoint.y, 0.09)
      scene.add(midStroke)
    }

    // Add control points (larger circles with white stroke)
    points.forEach((point, index) => {
      // Main circle
      const geometry = new THREE.CircleGeometry(0.04, 32)
      const material = new THREE.MeshBasicMaterial({ 
        color: draggedIndex === index ? 0xffffff : color 
      })
      const circle = new THREE.Mesh(geometry, material)
      circle.position.set(point.x * aspectRatio, point.y, 0.1)
      scene.add(circle)
      
      // White stroke
      const strokeGeometry = new THREE.RingGeometry(0.04, 0.05, 32)
      const strokeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const stroke = new THREE.Mesh(strokeGeometry, strokeMaterial)
      stroke.position.set(point.x * aspectRatio, point.y, 0.1)
      scene.add(stroke)
    })

    renderer.render(scene, camera)
  }, [points, color, draggedIndex, draggedMidpointIndex, aspectRatio])

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height // Flip Y

    // Check for midpoint clicks first
    const curvePoints = points.map(p => new THREE.Vector3(p.x * aspectRatio, p.y, 0))
    const curve = new THREE.CatmullRomCurve3(curvePoints)
    curve.curveType = 'catmullrom'
    curve.tension = 0.5

    for (let i = 0; i < points.length - 1; i++) {
      const curvePoint = curve.getPointAt((i + 0.5) / (points.length - 1))
      const dist = Math.sqrt(((curvePoint.x / aspectRatio) - x) ** 2 + (curvePoint.y - y) ** 2)
      if (dist < 0.06) {
        setDraggedMidpointIndex(i)
        // Insert new point at the midpoint
        const newPoints = [...points]
        newPoints.splice(i + 1, 0, { x: curvePoint.x / aspectRatio, y: curvePoint.y })
        onChange(newPoints)
        setDraggedIndex(i + 1)
        return
      }
    }

    // Find closest control point
    let closestIndex = 0
    let closestDist = Infinity
    points.forEach((point, index) => {
      const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
      if (dist < closestDist) {
        closestDist = dist
        closestIndex = index
      }
    })

    if (closestDist < 0.10) {
      setDraggedIndex(closestIndex)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedIndex === null) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))

    // Constrain X to be between adjacent points
    const minX = draggedIndex > 0 ? points[draggedIndex - 1].x + 0.001 : 0
    const maxX = draggedIndex < points.length - 1 ? points[draggedIndex + 1].x - 0.001 : 1
    const constrainedX = Math.max(minX, Math.min(maxX, x))

    const newPoints = [...points]
    newPoints[draggedIndex] = { x: constrainedX, y }
    onChange(newPoints)
  }

  const handleMouseUp = () => {
    setDraggedIndex(null)
    setDraggedMidpointIndex(null)
  }

  return (
    <div ref={containerRef}>
      <div className="flex justify-between mb-1">
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium">{label}</label>
          {onReset && <ResetButton onReset={onReset} />}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="border border-gray-700 rounded cursor-pointer w-full"
        style={{ display: 'block', height: '120px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  )
}
