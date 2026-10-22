import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl px-5 pt-40 pb-24 text-center">
        <p className="font-logo text-8xl italic">404</p>
        <h1 className="mt-4 text-2xl">This page does not exist</h1>
        <Link to="/" className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm text-paper">
          Back to home
        </Link>
    </section>
  );
}
