export const OCT_2026_START = new Date('2026-10-01T00:00:00.000Z').getTime();
export const OCT_2026_END = new Date('2026-10-31T23:59:59.999Z').getTime();

/**
 * Check if a file URL or path is from October 2026.
 * Old files before Oct 2026 are removed and excluded.
 */
export const isOct2026File = (urlOrName?: string | null): boolean => {
  if (!urlOrName || typeof urlOrName !== 'string' || urlOrName.trim() === '') return false;
  
  // Temporary blob or data URLs from current Oct 2026 session
  if (urlOrName.startsWith('blob:') || urlOrName.startsWith('data:')) {
    return true;
  }

  // Fallback assets generated in Oct 2026
  if (urlOrName.includes('fallback.mp4')) {
    return true;
  }

  // Timestamp extraction from upload filenames (e.g. 1791544237661-...)
  const match = urlOrName.match(/(\d{13})-/);
  if (match) {
    const ts = parseInt(match[1], 10);
    return ts >= OCT_2026_START && ts <= OCT_2026_END;
  }

  // Other uploaded files without an Oct 2026 timestamp are old pre-Oct 2026 files
  if (urlOrName.includes('/uploads/')) {
    return false;
  }

  // External placeholder URLs (e.g. picsum) are not Oct 2026 user files
  return false;
};

export const getMediaSource = (url: string) => {
  if (!url || typeof url !== 'string' || url.trim() === '') return '/fallback.mp4';
  
  // Normalize URL - if it's an absolute URL pointing to styni.com, make it relative
  let normalizedUrl = url;
  if (url.startsWith('https://styni.com/')) {
    normalizedUrl = url.replace('https://styni.com/', '/');
  } else if (url.startsWith('http://styni.com/')) {
    normalizedUrl = url.replace('http://styni.com/', '/');
  } else if (url.startsWith('https://www.styni.com/')) {
    normalizedUrl = url.replace('https://www.styni.com/', '/');
  } else if (url.startsWith('http://www.styni.com/')) {
    normalizedUrl = url.replace('http://www.styni.com/', '/');
  }
  
  // If it's a relative path starting with /uploads, we handle it
  if (normalizedUrl.startsWith('/uploads/')) {
    // We only need to encode special characters that break URLs (like #)
    // Browsers handle most characters in src attributes automatically.
    // We encode '#' specifically because it's interpreted as a fragment.
    return normalizedUrl.replace(/#/g, '%23');
  }
  
  return normalizedUrl;
};
