export const getMediaSource = (url: string) => {
  if (!url) return '';
  
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
