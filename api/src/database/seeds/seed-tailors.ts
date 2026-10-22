import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { slugify } from '../../modules/brands/brands.service.js';
import { Review } from '../../modules/tailors/entities/review.entity.js';
import { TailorProfile } from '../../modules/tailors/entities/tailor-profile.entity.js';
import { TailorService } from '../../modules/tailors/entities/tailor-service.entity.js';
import { TailorRankingService } from '../../modules/tailors/ranking/tailor-ranking.service.js';
import { ServiceType, TailorSpeciality } from '../../modules/tailors/tailors.enums.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';

/**
 * Demo data for the tailor map: 18 fictional shops in Islamabad, Rawalpindi, Lahore and
 * Karachi, each with services and a review history (English, Roman Urdu and Urdu), so ranking
 * and sentiment have something to work on. Also sets up the demo tailor account's shop.
 * Safe to run again: existing shops are skipped. Usage: npm run seed:tailors -w api
 */

interface SeedTailor {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  specialities: TailorSpeciality[];
  /** Average stars this shop's reviews are drawn around. */
  quality: number;
  reviews: number;
  homeVisits: boolean;
}

const SERVICES: Record<
  TailorSpeciality,
  { name: string; type: ServiceType; price: [number, number]; days: number; description: string }[]
> = {
  [TailorSpeciality.WomenEastern]: [
    {
      name: 'Shalwar kameez stitching',
      type: ServiceType.Stitching,
      price: [2200, 3800],
      days: 7,
      description: 'Three-piece suit with lining, piping and your choice of neckline.',
    },
    {
      name: 'Kurta with trousers',
      type: ServiceType.Stitching,
      price: [1800, 3000],
      days: 6,
      description: 'Straight or A-line kurta with cigarette or straight trousers.',
    },
  ],
  [TailorSpeciality.MenEastern]: [
    {
      name: 'Gents shalwar kameez',
      type: ServiceType.Stitching,
      price: [2000, 3500],
      days: 7,
      description: 'Classic or slim cut, collar or ban, with side pockets.',
    },
    {
      name: 'Waistcoat',
      type: ServiceType.Stitching,
      price: [3500, 6500],
      days: 10,
      description: 'Fully lined waistcoat to match your kurta.',
    },
  ],
  [TailorSpeciality.Bridal]: [
    {
      name: 'Bridal lehenga stitching',
      type: ServiceType.Bridal,
      price: [25000, 60000],
      days: 21,
      description: 'Can-can, lining and fittings included; two trial sessions.',
    },
    {
      name: 'Dupatta embroidery',
      type: ServiceType.Embroidery,
      price: [8000, 20000],
      days: 14,
      description: 'Hand-finished gota, kora and dabka work on borders.',
    },
  ],
  [TailorSpeciality.Western]: [
    {
      name: 'Shirt stitching',
      type: ServiceType.Stitching,
      price: [1500, 2600],
      days: 5,
      description: 'Formal or casual shirt from your fabric.',
    },
    {
      name: 'Trouser stitching',
      type: ServiceType.Stitching,
      price: [1200, 2200],
      days: 5,
      description: 'Pleated or flat-front trousers.',
    },
  ],
  [TailorSpeciality.Kids]: [
    {
      name: 'Kids kurta pajama',
      type: ServiceType.Stitching,
      price: [1200, 1900],
      days: 5,
      description: 'For ages 2 to 12, with room to grow.',
    },
  ],
  [TailorSpeciality.Alterations]: [
    {
      name: 'Fitting alteration',
      type: ServiceType.Alteration,
      price: [300, 900],
      days: 2,
      description: 'Take in or let out at the sides, shoulders or sleeves.',
    },
    {
      name: 'Hemming',
      type: ServiceType.Alteration,
      price: [200, 500],
      days: 1,
      description: 'Shorten trousers, kurtas or dresses.',
    },
  ],
};

/** Review texts by star rating, written the way Pakistani customers review. */
const COMMENTS: Record<number, string[]> = {
  5: [
    'Excellent stitching, the fitting was perfect and delivered before Eid. Highly recommended!',
    'Bohat acha kaam, fitting bilkul perfect thi. Zaroor dobara aaungi.',
    'Best tailor in the area. Neat finishing and very polite.',
    'بہت اچھی سلائی، وقت پر ڈیلیوری۔ شکریہ!',
    'Loved the neckline they suggested, it looks like a designer suit.',
    'Measurements liye ghar aa kar, kaam bhi zabardast. 10/10',
  ],
  4: [
    'Good stitching and fair price. One day late but the quality made up for it.',
    'Acha kaam hai, bas thori si sleeves lambi thi jo foran theek kar di.',
    'Very good finishing, will come again.',
    'کام اچھا تھا، قیمت بھی مناسب۔',
    'Nice work on the lining and piping. Recommended.',
  ],
  3: [
    'Average. Stitching was fine but they took two extra days.',
    'Theek tha, kuch khaas nahi. Fitting thori loose thi.',
    'Okay for simple suits, I would not give them anything fancy.',
    'ٹھیک ٹھاک کام، دیر سے ملا۔',
  ],
  2: [
    'Fitting was off and I had to go back twice for alterations.',
    'Bohat late diya aur stitching bhi saaf nahi thi.',
    'Not happy, the neckline was not what I asked for.',
  ],
  1: [
    'Very bad experience. Ruined my fabric and refused to fix it.',
    'Bilkul bakwas kaam, paise zaya ho gaye.',
    'کپڑا خراب کر دیا، بہت برا تجربہ۔',
  ],
};

const REVIEWER_NAMES = [
  'Ayesha Khan',
  'Hamza Ali',
  'Fatima Noor',
  'Bilal Ahmed',
  'Sana Tariq',
  'Usman Raza',
  'Hira Malik',
  'Zainab Shah',
  'Omer Farooq',
  'Maryam Iqbal',
];

/** Small deterministic random generator so every run creates the same data. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A star rating around `quality`: mostly within one star of it. */
function starsAround(quality: number, rand: () => number): number {
  const noise = (rand() + rand() + rand()) / 3 - 0.5; // roughly bell-shaped, -0.5..0.5
  return Math.min(5, Math.max(1, Math.round(quality + noise * 3.4)));
}

async function seedTailors(): Promise<void> {
  const tailors: SeedTailor[] = JSON.parse(
    readFileSync(new URL('../../../src/database/seeds/tailors.json', import.meta.url), 'utf8'),
  );
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const profiles = dataSource.getRepository(TailorProfile);
    const services = dataSource.getRepository(TailorService);
    const reviews = dataSource.getRepository(Review);
    const unusableHash = await bcrypt.hash(randomBytes(24).toString('hex'), 4);

    // Reviewer accounts (cannot log in: random password).
    const reviewers: User[] = [];
    for (const [i, name] of REVIEWER_NAMES.entries()) {
      const email = `reviewer${i + 1}@kapra.test`;
      reviewers.push(
        (await users.findOneBy({ email })) ??
          (await users.save(
            users.create({
              name,
              email,
              passwordHash: unusableHash,
              role: UserRole.Customer,
              status: UserStatus.Active,
            }),
          )),
      );
    }

    // The demo tailor account gets a shop of its own (it already has a password).
    const demo = await users.findOneBy({ email: 'tailor@kapra.test' });
    if (demo) {
      await users.update(demo.id, { status: UserStatus.Active });
      tailors.unshift({
        name: 'Kapra Demo Tailors',
        address: 'Main Markaz, F-8',
        city: 'Islamabad',
        lat: 33.7105,
        lng: 73.0389,
        specialities: [
          TailorSpeciality.WomenEastern,
          TailorSpeciality.MenEastern,
          TailorSpeciality.Alterations,
        ],
        quality: 4.5,
        reviews: 8,
        homeVisits: true,
      });
    }

    let created = 0;
    for (const [index, seed] of tailors.entries()) {
      const rand = random(index + 1);
      const slug = slugify(seed.name);
      if (await profiles.existsBy({ slug })) continue;

      const email = `tailor-${slug}@kapra.test`;
      const owner =
        seed.name === 'Kapra Demo Tailors' && demo
          ? demo
          : ((await users.findOneBy({ email })) ??
            (await users.save(
              users.create({
                name: seed.name,
                email,
                passwordHash: unusableHash,
                phone: `0300${String(1_000_000 + index * 7919).slice(-7)}`,
                role: UserRole.Tailor,
                status: UserStatus.Active,
              }),
            )));

      const offered = seed.specialities.flatMap((speciality) => SERVICES[speciality]);
      const priced = offered.map((service) => ({
        ...service,
        price:
          Math.round((service.price[0] + rand() * (service.price[1] - service.price[0])) / 50) * 50,
      }));
      const cancelled = Math.round(seed.reviews * (5 - seed.quality) * 0.06 + rand() * 2);

      const profile = await profiles.save(
        profiles.create({
          userId: owner.id,
          businessName: seed.name,
          slug,
          bio: `${seed.name} has been stitching in ${seed.city} for over ${5 + Math.floor(rand() * 20)} years. Bring your fabric or order through Kapra and we take it from measurements to final fitting.`,
          phone: owner.phone ?? '03001234567',
          address: seed.address,
          city: seed.city,
          lat: seed.lat,
          lng: seed.lng,
          specialities: seed.specialities,
          turnaroundDays: Math.min(...priced.map((service) => service.days)) + 2,
          homeVisits: seed.homeVisits,
          priceFrom: Math.min(...priced.map((service) => service.price)),
          completedOrders: Math.round(seed.reviews * 1.6),
          cancelledOrders: cancelled,
        }),
      );
      await services.save(
        priced.map((service) =>
          services.create({
            tailorId: profile.id,
            name: service.name,
            type: service.type,
            description: service.description,
            price: service.price,
            durationDays: service.days,
          }),
        ),
      );

      const reviewRows = Array.from({ length: seed.reviews }, (_, n) => {
        const rating = starsAround(seed.quality, rand);
        const pool = COMMENTS[rating];
        const daysAgo = Math.floor(rand() * 240);
        return reviews.create({
          tailorId: profile.id,
          customerId: reviewers[(index + n) % reviewers.length].id,
          rating,
          comment: rand() < 0.85 ? pool[Math.floor(rand() * pool.length)] : null,
          createdAt: new Date(Date.now() - daysAgo * 86_400_000),
        });
      });
      await reviews.save(reviewRows);
      created++;
    }

    await new TailorRankingService(dataSource).recomputeAll();
    console.log(
      `Created ${created} tailor shops (run "npm run job:reviews" to score review sentiment).`,
    );
  } finally {
    await dataSource.destroy();
  }
}

await seedTailors();
