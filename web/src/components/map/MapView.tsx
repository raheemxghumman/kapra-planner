import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { cn } from '../../utils/format';
import { ISLAMABAD } from '../../utils/geo';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: 'tailor' | 'store' | 'me';
  /** Shown inside tailor pins (1 = best match). */
  rank?: number;
  title?: string;
}

/**
 * Standard OpenStreetMap tiles (free with attribution, no key). A CSS filter in index.css mutes
 * them to our paper tones so the pins stand out.
 */
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Pins are plain HTML (divIcon), so they can use our fonts, colours and CSS animation. */
function pinIcon(marker: MapMarker, active: boolean): L.DivIcon {
  if (marker.kind === 'me') {
    return L.divIcon({
      className: 'kapra-pin',
      html: `<span style="position:relative;display:block;width:18px;height:18px">
        <span style="position:absolute;inset:-8px;border-radius:50%;background:rgb(79 90 58 / .22);animation:ping 1.8s cubic-bezier(0,0,.2,1) infinite"></span>
        <span style="position:absolute;inset:0;border-radius:50%;background:#4f5a3a;border:3px solid #f4f1ea;box-shadow:0 2px 6px rgb(0 0 0/.3)"></span></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }
  const isStore = marker.kind === 'store';
  const bg = active ? '#2b2926' : isStore ? '#f4f1ea' : '#8c3b2e';
  const fg = active ? '#f4f1ea' : isStore ? '#2b2926' : '#f4f1ea';
  const size = active ? 38 : 30;
  const label = isStore ? '◆' : (marker.rank ?? '•');
  return L.divIcon({
    className: 'kapra-pin',
    html: `<span style="display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:${isStore ? '10px' : '50% 50% 50% 4px'};
      transform:rotate(${isStore ? 0 : -45}deg);background:${bg};color:${fg};border:1.5px solid ${isStore ? '#2b2926' : '#f4f1ea'};
      box-shadow:0 8px 18px -6px rgb(43 41 38/.55);transition:all .25s cubic-bezier(.22,1,.36,1)">
      <span style="transform:rotate(${isStore ? 0 : 45}deg);font:600 ${active ? 13 : 11}px 'Instrument Sans',sans-serif">${label}</span></span>`,
    iconSize: [size, size],
    iconAnchor: isStore ? [size / 2, size / 2] : [size / 2, size],
  });
}

/** Moves the map smoothly when the focus point changes. */
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.1 });
  }, [map, lat, lng, zoom]);
  return null;
}

/** Fits all markers on screen once they load. */
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  const key = markers.map((marker) => marker.id).join(',');
  useEffect(() => {
    if (markers.length < 2) return;
    map.flyToBounds(L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng])), { padding: [50, 50], duration: 1, maxZoom: 14 });
    // Only refit when the set of markers changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

interface MapViewProps {
  markers: MapMarker[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  focus?: { lat: number; lng: number; zoom: number } | null;
  radiusKm?: number;
  fit?: boolean;
  className?: string;
  children?: ReactNode;
}

export function MapView({
  markers,
  activeId,
  onSelect,
  center = ISLAMABAD,
  zoom = 12,
  focus,
  radiusKm,
  fit = false,
  className,
  children,
}: MapViewProps) {
  const me = markers.find((marker) => marker.kind === 'me');
  const icons = useMemo(
    () => new Map(markers.map((marker) => [marker.id, pinIcon(marker, marker.id === activeId)])),
    [markers, activeId],
  );

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className={cn('kapra-map h-full w-full', className)} zoomControl>
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      {me && radiusKm && (
        <Circle
          center={[me.lat, me.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#4f5a3a', weight: 1, dashArray: '4 6', fillColor: '#4f5a3a', fillOpacity: 0.05 }}
        />
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={icons.get(marker.id)}
          title={marker.title}
          zIndexOffset={marker.id === activeId ? 1000 : marker.kind === 'me' ? 500 : 0}
          eventHandlers={onSelect && marker.kind !== 'me' ? { click: () => onSelect(marker.id) } : undefined}
        />
      ))}
      {focus && <FlyTo lat={focus.lat} lng={focus.lng} zoom={focus.zoom} />}
      {fit && <FitBounds markers={markers} />}
      {children}
    </MapContainer>
  );
}

/** Lets a form pick a location: click the map or drag the pin. */
export function PinPicker({
  value,
  onChange,
  className,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
  className?: string;
}) {
  const point = value ?? ISLAMABAD;
  return (
    <MapContainer center={[point.lat, point.lng]} zoom={value ? 15 : 11} scrollWheelZoom className={cn('kapra-map h-64 w-full rounded-2xl', className)}>
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      <ClickToPlace onChange={onChange} />
      {value && (
        <>
          <Marker
            position={[value.lat, value.lng]}
            draggable
            icon={pinIcon({ id: 'pin', lat: value.lat, lng: value.lng, kind: 'tailor', rank: undefined }, true)}
            eventHandlers={{
              dragend: (event) => {
                const { lat, lng } = (event.target as L.Marker).getLatLng();
                onChange({ lat, lng });
              },
            }}
          />
          <FlyTo lat={value.lat} lng={value.lng} zoom={15} />
        </>
      )}
    </MapContainer>
  );
}

function ClickToPlace({ onChange }: { onChange: (point: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (event) => onChange({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}
