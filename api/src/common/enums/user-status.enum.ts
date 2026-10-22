export enum UserStatus {
  /** Can use everything their role allows. */
  Active = 'active',
  /** Brand or tailor waiting for admin verification; can log in but not sell or take bookings. */
  Pending = 'pending',
  /** Blocked by an admin; every request is rejected. */
  Suspended = 'suspended',
}
