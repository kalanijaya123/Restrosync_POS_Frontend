import { useEffect, useRef } from 'react'
import L from 'leaflet'

type Props = {
    center: { lat: number; lng: number }
    selected: { lat: number; lng: number } | null
    onSelect: (coords: { lat: number; lng: number }) => void
    height?: number
}

const LocationPickerMap = ({ center, selected, onSelect, height = 320 }: Props) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<L.Map | null>(null)
    const selectionLayerRef = useRef<L.LayerGroup | null>(null)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) {
            return
        }

        const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 13)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map)

        const selectionLayer = L.layerGroup().addTo(map)

        map.on('click', (event: L.LeafletMouseEvent) => {
            onSelect({ lat: event.latlng.lat, lng: event.latlng.lng })
        })

        mapRef.current = map
        selectionLayerRef.current = selectionLayer

        return () => {
            map.remove()
            mapRef.current = null
            selectionLayerRef.current = null
        }
    }, [center.lat, center.lng, onSelect])

    useEffect(() => {
        if (!mapRef.current) {
            return
        }
        mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom())
    }, [center.lat, center.lng])

    useEffect(() => {
        const map = mapRef.current
        const layer = selectionLayerRef.current
        if (!map || !layer) {
            return
        }

        layer.clearLayers()

        if (selected) {
            L.circleMarker([selected.lat, selected.lng], {
                radius: 8,
                color: '#0f766e',
                fillColor: '#14b8a6',
                fillOpacity: 0.9,
                weight: 2
            }).addTo(layer)
        }
    }, [selected])

    return (
        <div
            ref={mapContainerRef}
            style={{ height: `${height}px`, width: '100%', borderRadius: 16, overflow: 'hidden' }}
        />
    )
}

export default LocationPickerMap
