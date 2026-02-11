import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

interface Point {
  x: number
  y: number
}

interface ColorCurveProps {
  color: string
  label: string
  points: Point[]
  onChange: (points: Point[]) => void
}

export default function ColorCurve({ color, label, points, onChange }: ColorCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

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
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 10)
    camera.position.z = 1
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer

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
    const curvePoints = points.map(p => new THREE.Vector3(p.x, p.y, 0))
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
        new THREE.Vector3(1, y, -0.1)
      ])
      scene.add(new THREE.Line(gridGeometry, gridMaterial))
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = i * 0.25
      const gridGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, -0.1),
        new THREE.Vector3(x, 1, -0.1)
      ])
      scene.add(new THREE.Line(gridGeometry, gridMaterial))
    }

    // Add border
    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0)
    ])
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4b5563 })
    scene.add(new THREE.Line(borderGeometry, borderMaterial))

    // Add control points
    points.forEach((point, index) => {
      const geometry = new THREE.CircleGeometry(0.02, 16)
      const material = new THREE.MeshBasicMaterial({ 
        color: draggedIndex === index ? 0xffffff : color 
      })
      const circle = new THREE.Mesh(geometry, material)
      circle.position.set(point.x, point.y, 0.1)
      scene.add(circle)
    })

    renderer.render(scene, camera)
  }, [points, color, draggedIndex])

  // Handle mouse interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / rect.width
    const y = 1 - (e.clientY - rect.top) / rect.height // Flip Y

    // Find closest point
    let closestIndex = 0
    let closestDist = Infinity
    points.forEach((point, index) => {
      const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
      if (dist < closestDist) {
        closestDist = dist
        closestIndex = index
      }
    })

    if (closestDist < 0.05) {
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
  }

  return (
    <div ref={containerRef}>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium">{label}</label>
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
