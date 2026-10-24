import bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { BCRYPT_ROUNDS } from '../../modules/auth/auth.constants.js';
import { RefreshToken } from '../../modules/auth/entities/refresh-token.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';

/** Same rule as sign-up (RegisterDto): 8-72 characters with a letter and a number. */
function passwordProblem(password: string): string | null {
  if (password.length < 8 || password.length > 72) return 'must be 8-72 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'needs a letter and a number';
  return null;
}

/**
 * Creates the admin account, or resets its password if it already exists. Admins cannot sign
 * up through the API, so this script is the only way to get one. Usage: set ADMIN_EMAIL and
 * ADMIN_PASSWORD in api/.env, then
 *   npm run seed:admin -w api
 */
async function createAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME?.trim() || 'Kapra Admin';
  const problem = passwordProblem(password);
  if (!email || problem) {
    throw new Error(
      `Set ADMIN_EMAIL and ADMIN_PASSWORD in api/.env (password ${problem ?? 'missing'})`,
    );
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const existing = await users.findOneBy({ email });

    if (!existing) {
      await users.save(
        users.create({
          name,
          email,
          passwordHash,
          role: UserRole.Admin,
          status: UserStatus.Active,
        }),
      );
      console.log(`Admin account created for ${email}.`);
      return;
    }
    if (existing.role !== UserRole.Admin) {
      throw new Error(`${email} belongs to a ${existing.role} account; use another ADMIN_EMAIL`);
    }

    // New password, unlocked, and signed out everywhere (old sessions used the old password).
    await users.update(existing.id, {
      passwordHash,
      status: UserStatus.Active,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await dataSource
      .getRepository(RefreshToken)
      .createQueryBuilder()
      .update()
      .set({ revokedAt: () => 'now()' })
      .where('user_id = :id AND revoked_at IS NULL', { id: existing.id })
      .execute();
    console.log(`Admin password updated for ${email}.`);
  } finally {
    await dataSource.destroy();
  }
}

await createAdmin();
