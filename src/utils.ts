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
      // Encode path parts but not the separators to handle special characters like #
      const parts = url.split('/');
      const encodedUrl = parts.map(part => encodeURIComponent(part)).join('/');
      // Re-fix it because the first '/' became and encoded nothing if it was at start, 
      // but actually parts[0] is "" if url starts with "/".
      // Let's do it simpler.
      return url.split('/').map(p => encodeURIComponent(p)).join('/').replace(/%2F/g, '/');
    }
  }
  
  return url;
};
