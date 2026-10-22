import { MapPinned } from 'lucide-react';
import { useState } from 'react';
import { searchPlaces } from '../../api/tailors.api';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { PinPicker } from './MapView';

/**
 * Map pin for an address. "Find on map" looks the address up on OpenStreetMap; the person then
 * drags the pin or clicks the exact spot (street-level lookups in Pakistan are often rough).
 */
export function LocationField({
  address,
  city,
  value,
  onChange,
}: {
  address: string;
  city: string;
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
}) {
  const { toast } = useToast();
  const [finding, setFinding] = useState(false);

  const find = async () => {
    setFinding(true);
    const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
    // Most specific first, then broader parts of the address.
    for (let start = 0; start < Math.min(3, Math.max(1, parts.length)); start++) {
      const [place] = await searchPlaces(`${parts.slice(start).join(', ')}, ${city}`).catch(() => []);
      if (place) {
        onChange(place);
        setFinding(false);
        return;
      }
    }
    setFinding(false);
    toast({ title: 'Address not found', description: 'Click the map to place the pin yourself.', tone: 'info' });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">Location on the map</p>
        <Button size="sm" variant="ghost" onClick={find} loading={finding} disabled={address.trim().length < 3 || city.trim().length < 2}>
          <MapPinned size={13} /> Find on map
        </Button>
      </div>
      <PinPicker value={value} onChange={onChange} />
      <p className="mt-2 text-xs text-muted">{value ? 'Drag the pin to the exact door if needed.' : 'Click the map to drop a pin.'}</p>
    </div>
  );
}
