export const getMediaSource = (url: string) => {
  if (!url) return '';
  
  // If it's a relative path starting with /uploads, and we are not on the production domain,
  // we proxy it to the production domain where the files actually live.
  if (url.startsWith('/uploads/') && !window.location.hostname.includes('styni.com')) {
    return `https://styni.com${url}`;
  }
  
  return url;
};
