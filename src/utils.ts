export const getMediaSource = (url: string) => {
  if (!url) return '';
  
  // If it's a relative path starting with /uploads, and we are in the AI Studio preview environment,
  // we proxy it to the production domain where the files actually live.
  if (url.startsWith('/uploads/')) {
    const isPreview = window.location.hostname.includes('ais-dev') || 
                      window.location.hostname.includes('ais-pre') ||
                      window.location.hostname.includes('localhost') ||
                      window.location.hostname.includes('127.0.0.1');
                      
    if (isPreview) {
      if (!url.startsWith('/uploads')) return url;
      
      // We only need to encode special characters that break URLs (like #)
      // Browsers handle most characters in src attributes automatically.
      // We encode '#' specifically because it's interpreted as a fragment.
      return url.replace(/#/g, '%23');
    }
  }
  
  return url;
};
