import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { TextAreaField } from '../../../components/ui/Fields';
import { TextField } from '../../../components/ui/TextField';
import { MEASUREMENT_FIELDS, type Measurement, type MeasurementInput, type MeasurementKey } from '../../../types/profile';

type Draft = { label: string; notes: string } & Record<MeasurementKey, string>;

const toDraft = (measurement?: Measurement): Draft => ({
  label: measurement?.label ?? '',
  notes: measurement?.notes ?? '',
  ...(Object.fromEntries(MEASUREMENT_FIELDS.map(([key]) => [key, measurement?.[key]?.toString() ?? ''])) as Record<MeasurementKey, string>),
});

/** Inches, one decimal. Empty boxes stay empty (the tailor will measure those). */
export function MeasurementForm({
  initial,
  onSubmit,
  saving,
}: {
  initial?: Measurement;
  onSubmit: (input: MeasurementInput) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const invalid = MEASUREMENT_FIELDS.find(([key]) => {
    const value = draft[key];
    return value !== '' && (Number.isNaN(Number(value)) || Number(value) <= 0 || Number(value) > 99);
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.label.trim() || invalid) return;
        onSubmit({
          label: draft.label.trim(),
          notes: draft.notes.trim() || undefined,
          ...Object.fromEntries(MEASUREMENT_FIELDS.map(([key]) => [key, draft[key] === '' ? null : Number(draft[key])])),
        });
      }}
      className="space-y-4"
    >
      <TextField label="Name for these measurements" placeholder="e.g. Me, Mother, Ali" value={draft.label} maxLength={60} required onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MEASUREMENT_FIELDS.map(([key, label]) => (
          <TextField
            key={key}
            label={label}
            inputMode="decimal"
            placeholder="in"
            value={draft[key]}
            error={invalid?.[0] === key ? '1-99 inches' : undefined}
            onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
          />
        ))}
      </div>
      <TextAreaField label="Notes for the tailor" value={draft.notes} maxLength={300} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="e.g. prefer loose fit at the waist" />
      <div className="flex justify-end">
        <Button type="submit" loading={saving} disabled={!draft.label.trim() || Boolean(invalid)}>
          Save measurements
        </Button>
      </div>
    </form>
  );
}
