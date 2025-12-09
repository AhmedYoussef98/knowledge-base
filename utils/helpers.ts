export const isImage = (url: string): boolean => {
  return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url) || url.includes('imgg.io') || url.includes('picsum.photos');
};

export const isVideo = (url: string): boolean => {
  return (
    url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('drive.google.com/file/d/') ||
    /\.(mp4|mov|wmv|flv|avi|mkv|webm)$/i.test(url)
  );
};

export const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return '';

  // Convert Google Drive file links
  if (url.includes('drive.google.com/file/d/')) {
    const fileIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (fileIdMatch && fileIdMatch[1]) {
      // Use preview for better compatibility in iframes
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
  }

  // Convert YouTube links to embed format
  if (url.includes('youtube.com/watch')) {
    return url.replace('watch?v=', 'embed/');
  }
  if (url.includes('youtu.be/')) {
    return url.replace('youtu.be/', 'youtube.com/embed/');
  }

  return url;
};

export const getCategoryColor = (category: string, index: number): string => {
  // Cycle through Daleel brand colors with glow effects
  const daleelColors = [
    'bg-daleel-cyan text-daleel-deep-space glow-cyan',
    'bg-daleel-neon text-daleel-deep-space glow-neon',
    'bg-daleel-green text-daleel-deep-space',
    'bg-daleel-tech-slate text-daleel-pure-light border border-daleel-cyan',
    'bg-daleel-gradient text-daleel-deep-space',
  ];

  return daleelColors[index % daleelColors.length];
};