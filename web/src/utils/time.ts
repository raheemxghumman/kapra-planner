const dateFormat = new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('en-PK', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit' });

/** "12 Nov 2026" */
export const formatDate = (value: string | Date) => dateFormat.format(new Date(value));
/** "12 Nov, 4:30 pm" */
export const formatDateTime = (value: string | Date) => dateTimeFormat.format(new Date(value));
/** "4:30 pm" */
export const formatTime = (value: string | Date) => timeFormat.format(new Date(value));

/** "just now", "5 min ago", "3 h ago", "2 days ago", then the date. */
export function timeAgo(value: string | Date): string {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(value);
}

/** "Good morning" / "Good afternoon" / "Good evening" for the dashboard greeting. */
export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
