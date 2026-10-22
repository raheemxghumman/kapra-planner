import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormError } from '../../components/ui/FormError';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../hooks/useAuth';
import { useForm, type FormErrors } from '../../hooks/useForm';
import { AuthLayout } from '../../layouts/AuthLayout';
import { DASHBOARD_PATH } from '../../utils/roles';
import { isEmail } from '../../utils/validators';

type LoginValues = { email: string; password: string };

const validate = (values: LoginValues): FormErrors<LoginValues> => {
  const errors: FormErrors<LoginValues> = {};
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address';
  if (!values.password) errors.password = 'Enter your password';
  return errors;
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const form = useForm<LoginValues>({
    initialValues: { email: '', password: '' },
    validate,
    onSubmit: async (values) => {
      const user = await login(values);
      navigate(from ?? DASHBOARD_PATH[user.role], { replace: true });
    },
  });

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to plan, try on and track your outfits.">
      <form onSubmit={form.handleSubmit} noValidate className="space-y-5">
        <TextField label="Email" type="email" autoComplete="email" {...form.field('email')} />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          {...form.field('password')}
        />
        <FormError message={form.submitError} />
        <Button type="submit" loading={form.submitting} className="w-full">
          Log in
        </Button>
        <p className="text-center text-sm text-muted">
          New to Kapra?{' '}
          <Link to="/register" className="font-semibold text-ink underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
