import bcrypt from 'bcryptjs';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { UserStatus } from '../../common/enums/user-status.enum.js';
import { BCRYPT_ROUNDS } from '../../modules/auth/auth.constants.js';
import { User } from '../../modules/users/entities/user.entity.js';
import dataSource from '../data-source.js';

/**
 * Creates the admin account. Admins cannot sign up through the API, so this script is the
 * only way to get one. Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then
 *   npm run seed:admin -w api
 */
async function createAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Kapra Admin';
  if (!email || !password || password.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in api/.env first');
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    if (await users.existsBy({ email })) {
      console.log(`An account with ${email} already exists; nothing to do.`);
      return;
    }
    await users.save(
      users.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        role: UserRole.Admin,
        status: UserStatus.Active,
      }),
    );
    console.log(`Admin account created for ${email}.`);
  } finally {
    await dataSource.destroy();
  }
}

await createAdmin();
