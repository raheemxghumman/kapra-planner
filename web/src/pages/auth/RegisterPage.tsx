import { Link, useNavigate } from 'react-router';
import { RolePicker } from '../../components/auth/RolePicker';
import { Button } from '../../components/ui/Button';
import { FormError } from '../../components/ui/FormError';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../hooks/useAuth';
import { useForm, type FormErrors } from '../../hooks/useForm';
import { AuthLayout } from '../../layouts/AuthLayout';
import type { RegisterInput } from '../../types/auth';
import { DASHBOARD_PATH } from '../../utils/roles';
import { isEmail, isPakistaniMobile, passwordProblem } from '../../utils/validators';

type RegisterValues = {
  role: RegisterInput['role'];
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
};

const validate = (values: RegisterValues): FormErrors<RegisterValues> => {
  const errors: FormErrors<RegisterValues> = {};
  if (values.name.trim().length < 2) errors.name = 'Enter your name';
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address';
  const password = passwordProblem(values.password);
  if (password) errors.password = password;
  const needsPhone = values.role !== 'customer';
  if (needsPhone && !values.phone.trim()) {
    errors.phone = 'Brands and tailors need a mobile number';
  } else if (values.phone.trim() && !isPakistaniMobile(values.phone)) {
    errors.phone = 'Use a mobile number like 03001234567';
  }
  return errors;
};

const NAME_LABEL: Record<RegisterValues['role'], string> = {
  customer: 'Full name',
  brand: 'Brand name',
  tailor: 'Shop name',
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterValues>({
    initialValues: { role: 'customer', name: '', email: '', password: '', phone: '', city: '' },
    validate,
    onSubmit: async ({ phone, city, ...values }) => {
      const user = await register({
        ...values,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
      });
      navigate(DASHBOARD_PATH[user.role], { replace: true });
    },
  });

  const isBusiness = form.values.role !== 'customer';

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Customers can start right away. Brands and tailors are verified before going live."
    >
      <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
        <RolePicker value={form.values.role} onChange={(role) => form.setValue('role', role)} />
        <TextField label={NAME_LABEL[form.values.role]} autoComplete="name" {...form.field('name')} />
        <TextField label="Email" type="email" autoComplete="email" {...form.field('email')} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters with a letter and a number"
          {...form.field('password')}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label={isBusiness ? 'Mobile number' : 'Mobile (optional)'}
            type="tel"
            autoComplete="tel"
            placeholder="03001234567"
            {...form.field('phone')}
          />
          <TextField label="City (optional)" autoComplete="address-level2" {...form.field('city')} />
        </div>
        <FormError message={form.submitError} />
        <Button type="submit" loading={form.submitting} className="w-full">
          Create account
        </Button>
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
