import { Outlet } from 'react-router';
import { CustomCursor } from '../components/motion/CustomCursor';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteNav } from '../components/layout/SiteNav';
import { PageTransition } from '../components/ui/PageTransition';

/** Frame for public pages: floating nav, page content, footer, custom cursor and paper grain. */
export function SiteLayout() {
  return (
    <div className="grain relative min-h-screen">
      <CustomCursor />
      <SiteNav />
      <PageTransition>
        <Outlet />
      </PageTransition>
      <SiteFooter />
    </div>
  );
}
