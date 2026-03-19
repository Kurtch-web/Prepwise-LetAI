/**
 * Format date as relative time (e.g., "2h", "5m", "30s")
 * For dates older than 24 hours, shows the month name and relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (0-30 seconds)
  if (diffSecs < 30) {
    return 'now';
  }

  // Seconds (30-59)
  if (diffSecs < 60) {
    return `${diffSecs}s`;
  }

  // Minutes (1-59)
  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  // Hours (1-23)
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  // Days (1-6)
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  // Weeks (7-30)
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffDays < 30) {
    return `${diffWeeks}w`;
  }

  // Months (30-365)
  const diffMonths = Math.floor(diffDays / 30);
  if (diffDays < 365) {
    const monthName = date.toLocaleString('default', { month: 'short' });
    const dayNum = date.getDate();
    return `${monthName} ${dayNum}`;
  }

  // Years (365+)
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y`;
}

/**
 * Format date with full details for hover tooltip
 */
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time for comments and other short displays
 */
export function formatTimeShort(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'just now';
  }

  if (diffMins < 60) {
    return `${diffMins}${diffMins === 1 ? 'min' : 'min'} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}${diffHours === 1 ? 'hr' : 'hr'} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays}${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  const monthName = date.toLocaleString('default', { month: 'short' });
  const dayNum = date.getDate();
  return `${monthName} ${dayNum}`;
}

/**
 * Format elapsed time from a start date in a readable format
 * e.g., "Running for 2h 45m" or "Running for 5m 30s"
 */
export function formatElapsedTime(startDate: string | Date): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const totalSecs = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSecs / (24 * 3600));
  const hours = Math.floor((totalSecs % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  // For less than a minute, show seconds
  if (totalSecs < 60) {
    return `Running for ${seconds}s`;
  }

  // For less than an hour, show minutes and seconds
  if (totalSecs < 3600) {
    return `Running for ${minutes}m ${seconds}s`;
  }

  // For less than a day, show hours and minutes
  if (totalSecs < 86400) {
    return `Running for ${hours}h ${minutes}m`;
  }

  // For a day or more, show days and hours
  return `Running for ${days}d ${hours}h`;
}
