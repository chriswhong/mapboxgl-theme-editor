import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || ''

interface MapProps {
  lutBase64: string
}

export default function Map({ lutBase64 }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return
    if (map.current) return // Already initialized

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [-74.01297, 40.70644],
      zoom: 15.28,
      pitch: 60,
      hash: true,
      config: {
        basemap: {
            theme: 'custom',
            'theme-data': lutBase64
        }
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update LUT when it changes
  useEffect(() => {
    if (map.current && lutBase64) {
      map.current.setConfigProperty('basemap', 'theme-data', lutBase64)
    }
  }, [lutBase64])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}
