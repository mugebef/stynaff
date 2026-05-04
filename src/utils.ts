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
      // For testing in AI Studio, we should use the local server to verify uploads work.
      // If you want to force production files, uncomment the line below.
      // return `https://styni.com${url}`;
      return url;
    }
  }
  
  return url;
};
