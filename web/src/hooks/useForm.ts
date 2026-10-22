import { useState, type ChangeEvent, type FormEvent } from 'react';
import { getErrorMessage } from '../utils/errors';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initialValues: T;
  /** Returns a message per invalid field; empty object means the form is valid. */
  validate: (values: T) => FormErrors<T>;
  onSubmit: (values: T) => Promise<void>;
}

/**
 * Small form helper built on controlled components: every input's value lives in React state
 * and changes through onChange. Errors appear after a field is left (blur) or on submit,
 * so the user is not told off while still typing.
 */
export function useForm<T extends Record<string, string>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = validate(values);

  const setValue = (name: keyof T, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }));
    setSubmitError(null);
  };

  /** Spread onto an input: <input {...field('email')} />. */
  const field = (name: keyof T) => ({
    name: String(name),
    value: values[name],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setValue(name, event.target.value),
    onBlur: () => setTouched((previous) => ({ ...previous, [name]: true })),
    error: touched[name] ? errors[name] : undefined,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const allTouched = Object.keys(values).reduce(
      (result, key) => ({ ...result, [key]: true }),
      {} as Record<keyof T, boolean>,
    );
    setTouched(allTouched);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return { values, setValue, field, handleSubmit, submitting, submitError };
}
