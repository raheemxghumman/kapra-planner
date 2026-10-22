import { useState } from 'react';
import { Button } from './Button';
import { TextAreaField } from './Fields';
import { Modal } from './Modal';

/**
 * "Are you sure?" dialog. With `askReason`, the person must explain (e.g. declining a booking),
 * and the reason is passed to onConfirm.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  askReason,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  askReason?: { label: string; required?: boolean };
  loading?: boolean;
}) {
  const [reason, setReason] = useState('');
  const missing = Boolean(askReason?.required && reason.trim().length < 3);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            loading={loading}
            disabled={missing}
            onClick={() => onConfirm(reason.trim() || undefined)}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {askReason ? (
        <TextAreaField
          label={askReason.label}
          value={reason}
          maxLength={300}
          onChange={(event) => setReason(event.target.value)}
          placeholder="A short explanation"
        />
      ) : (
        <p className="text-sm text-muted">This cannot be undone.</p>
      )}
    </Modal>
  );
}
