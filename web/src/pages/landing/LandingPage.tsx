import { getBrands, getFacets, getFeaturedProducts } from '../../api/catalogue.api';
import { useApi } from '../../hooks/useApi';
import { FaqSection } from './FaqSection';
import { HeroSection } from './HeroSection';
import { LookbookRail } from './LookbookRail';
import { NumbersBand } from './NumbersBand';
import { PartnersSection } from './PartnersSection';
import { ShowcaseSection } from './ShowcaseSection';
import { StorySection } from './StorySection';

/**
 * The public home page. All imagery and numbers are live data from the catalogue
 * (featured products, brands, facet counts), not stock photos.
 */
export function LandingPage() {
  const featured = useApi((signal) => getFeaturedProducts(24, signal));
  const brands = useApi((signal) => getBrands(signal));
  const facets = useApi((signal) => getFacets(signal));
  const products = featured.data ?? [];

  return (
    <>
      <HeroSection products={featured.data} />
      <NumbersBand brands={brands.data ?? []} facets={facets.data} />
      {products.length > 0 && <StorySection products={products} />}
      <ShowcaseSection />
      <LookbookRail products={products.slice(9, 21)} />
      <PartnersSection products={products} />
      <FaqSection />
    </>
  );
}
