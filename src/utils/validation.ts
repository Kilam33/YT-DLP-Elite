import { z } from 'zod';

// Comprehensive list of supported platforms based on yt-dlp
const SUPPORTED_PLATFORMS = [
  // Major video platforms
  'youtube.com', 'youtu.be', 'm.youtube.com', 'youtube-nocookie.com',
  'vimeo.com', 'player.vimeo.com',
  'dailymotion.com', 'dai.ly',
  'twitch.tv', 'm.twitch.tv',
  'facebook.com', 'fb.watch', 'm.facebook.com',
  'instagram.com', 'm.instagram.com',
  'twitter.com', 'x.com', 't.co', 'mobile.twitter.com',
  'tiktok.com', 'vm.tiktok.com', 'm.tiktok.com',
  'reddit.com', 'old.reddit.com', 'new.reddit.com', 'redd.it',
  
  // Streaming services & TV
  'bbc.co.uk', 'bbc.com',
  'itv.com', 'itvhub.itv.com',
  'channel4.com', 'all4.com',
  'arte.tv', 'arte.fr', 'arte.de',
  'france.tv', 'francetv.fr',
  'ardmediathek.de', 'ard.de',
  'zdf.de', 'zdfmediathek.de',
  'svtplay.se', 'svt.se',
  'nrk.no', 'tv.nrk.no',
  'cbs.com', 'cbsnews.com',
  'nbc.com', 'nbcnews.com',
  'fox.com', 'foxnews.com',
  'espn.com', 'espn.go.com',
  'cnn.com', 'edition.cnn.com',
  
  // Audio/Music platforms
  'soundcloud.com', 'm.soundcloud.com',
  'bandcamp.com',
  'mixcloud.com',
  'spotify.com', 'open.spotify.com',
  'podcasts.apple.com',
  
  // Educational/Tech
  'khanacademy.org',
  'ted.com',
  'ocw.mit.edu',
  'udemy.com',
  'linkedin.com',
  'coursera.org',
  
  // International platforms
  'bilibili.com', 'b23.tv', 'm.bilibili.com',
  'nicovideo.jp', 'nico.ms',
  'vk.com', 'vk.ru',
  'youku.com',
  'weibo.com', 'weibo.cn',
  'ok.ru', 'odnoklassniki.ru',
  
  // Alternative platforms
  'rumble.com',
  'bitchute.com',
  'odysee.com', 'lbry.tv',
  'minds.com',
  'gab.com',
  'brighteon.com',
  
  // File sharing/Cloud
  'drive.google.com', 'docs.google.com',
  'dropbox.com',
  'archive.org',
  
  // Sports
  'mlb.com', 'mlb.tv',
  'nba.com',
  'nfl.com',
  
  // Other popular
  '9gag.com',
  'flickr.com',
  'pinterest.com',
  'tumblr.com',
  'imgur.com',
  'streamable.com',
  'giphy.com',
  
  // News outlets
  'washingtonpost.com',
  'nytimes.com',
  'theguardian.com',
  'reuters.com',
  'bbc.com',
  'bloomberg.com',
  
  // Gaming
  'gamespot.com',
  'ign.com',
  'steam.com', 'store.steampowered.com',
] as const;

// Enhanced URL validation with better platform detection
const validateSupportedPlatform = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Remove www. prefix for comparison
    const cleanHostname = hostname.replace(/^www\./, '');
    
    return SUPPORTED_PLATFORMS.some(platform => {
      // Exact match
      if (cleanHostname === platform || hostname === platform) return true;
      
      // Subdomain match (e.g., m.youtube.com matches youtube.com)
      if (cleanHostname.endsWith('.' + platform) || hostname.endsWith('.' + platform)) return true;
      
      return false;
    });
  } catch {
    return false;
  }
};

// URL validation schema with improved platform detection
export const urlSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .url('Invalid URL format')
    .refine(validateSupportedPlatform, {
      message: 'Unsupported platform. Please use a supported video platform.'
    })
    .refine((url) => {
      // Additional checks for common invalid patterns
      const blockedPatterns = [
        /localhost/i,
        /127\.0\.0\.1/,
        /192\.168\./,
        /10\./,
        /172\.(1[6-9]|2\d|3[01])\./,
        /file:\/\//i,
        /ftp:\/\//i,
      ];
      return !blockedPatterns.some(pattern => pattern.test(url));
    }, 'Invalid or restricted URL pattern'),
});

// Enhanced download options schema with more realistic options
export const downloadOptionsSchema = z.object({
  quality: z.string().min(1, 'Quality selection is required'),
  outputPath: z.string()
    .optional()
    .refine((path) => {
      if (!path) return true;
      // Basic path validation - avoid dangerous paths
      const dangerousPaths = ['/', '/bin', '/usr', '/etc', '/var', '/sys', '/proc'];
      return !dangerousPaths.some(dangerous => path.startsWith(dangerous));
    }, 'Invalid or dangerous output path'),
  format: z.string().optional(),
  subtitles: z.boolean().optional(),
  audioOnly: z.boolean().optional(),
  extractAudio: z.boolean().optional(),
  keepVideo: z.boolean().optional(),
  embedSubs: z.boolean().optional(),
  writeInfoJson: z.boolean().optional(),
  writeThumbnail: z.boolean().optional(),
});

// Enhanced metadata validation schema
export const metadataSchema = z.object({
  id: z.string().min(1, 'Video ID is required'),
  title: z.string().min(1, 'Title is required'),
  duration: z.number().min(0, 'Duration must be positive').nullable(),
  uploader: z.string().min(1, 'Uploader is required').nullable(),
  upload_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  view_count: z.number().min(0).optional().nullable(),
  like_count: z.number().min(0).optional().nullable(),
  webpage_url: z.string().url().optional(),
  extractor: z.string().min(1, 'Extractor is required'),
  extractor_key: z.string().min(1, 'Extractor key is required'),
  formats: z.array(z.object({
    format_id: z.string(),
    ext: z.string(),
    height: z.number().optional().nullable(),
    width: z.number().optional().nullable(),
    filesize: z.number().optional().nullable(),
    filesize_approx: z.number().optional().nullable(),
    vcodec: z.string().optional().nullable(),
    acodec: z.string().optional().nullable(),
    fps: z.number().optional().nullable(),
    vbr: z.number().optional().nullable(),
    abr: z.number().optional().nullable(),
    quality: z.number().optional().nullable(),
    url: z.string().url().optional(),
  })).optional(),
  requested_subtitles: z.record(z.string(), z.object({
    ext: z.string(),
    url: z.string().url().optional(),
  })).optional().nullable(),
  automatic_captions: z.record(z.string(), z.array(z.object({
    ext: z.string(),
    url: z.string().url().optional(),
  }))).optional().nullable(),
});

// Enhanced playlist validation schema
export const playlistSchema = z.object({
  _type: z.literal('playlist'),
  id: z.string().min(1, 'Playlist ID is required'),
  title: z.string().min(1, 'Playlist title is required'),
  description: z.string().optional().nullable(),
  uploader: z.string().optional().nullable(),
  webpage_url: z.string().url().optional(),
  entries: z.array(z.object({
    id: z.string().min(1, 'Entry ID is required'),
    title: z.string().min(1, 'Entry title is required'),
    duration: z.number().min(0, 'Duration must be positive').nullable(),
    uploader: z.string().min(1, 'Uploader is required').nullable(),
    thumbnail: z.string().url().optional().nullable(),
    url: z.string().url('Invalid entry URL'),
    webpage_url: z.string().url().optional(),
    description: z.string().optional().nullable(),
  })).min(1, 'Playlist must have at least one entry'),
});

// Enhanced download state validation schema
export const downloadSchema = z.object({
  id: z.string().min(1, 'Download ID is required'),
  url: z.string().url('Invalid download URL'),
  status: z.enum([
    'pending', 
    'initializing', 
    'extracting', 
    'connecting', 
    'downloading', 
    'processing', 
    'postprocessing',
    'completed', 
    'error', 
    'paused',
    'cancelled'
  ]),
  progress: z.number().min(0).max(100).default(0),
  speed: z.number().min(0).nullable().default(null),
  eta: z.number().min(0).nullable().default(null),
  filename: z.string().min(1, 'Filename is required'),
  filesize: z.number().min(0).nullable().default(null),
  downloaded: z.number().min(0).default(0),
  quality: z.string().min(1, 'Quality is required'),
  format: z.string().optional(),
  outputPath: z.string().min(1, 'Output path is required'),
  addedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  metadata: metadataSchema.optional().nullable(),
  error: z.string().nullable().default(null),
  errorDetails: z.string().optional().nullable(),
  retryCount: z.number().min(0).default(0),
  maxRetries: z.number().min(0).default(3),
  options: downloadOptionsSchema.optional(),
});

// Enhanced validation functions with backward compatibility
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  try {
    urlSchema.parse({ url });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

// Enhanced version with detailed error information
export const validateUrlDetailed = (url: string): { isValid: boolean; error?: string; details?: string[] } => {
  try {
    urlSchema.parse({ url });
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        error: error.issues[0].message,
        details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

export const validateDownloadOptions = (options: any): { isValid: boolean; error?: string } => {
  try {
    downloadOptionsSchema.parse(options);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

export const validateMetadata = (metadata: any): { isValid: boolean; error?: string } => {
  try {
    metadataSchema.parse(metadata);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

export const validatePlaylist = (playlist: any): { isValid: boolean; error?: string } => {
  try {
    playlistSchema.parse(playlist);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

export const validateDownload = (download: any): { isValid: boolean; error?: string } => {
  try {
    downloadSchema.parse(download);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

// Enhanced sanitization functions
export const sanitizeUrl = (url: string): string => {
  return url.trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ''); // Remove all whitespace but keep case
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Remove invalid characters including control chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255); // Limit length
};

export const sanitizeOutputPath = (path: string): string => {
  return path.trim()
    .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remove invalid characters
    .replace(/\\/g, '/') // Normalize path separators
    .replace(/\/+/g, '/') // Remove duplicate slashes
    .replace(/\/$/, ''); // Remove trailing slash
};

// Enhanced data integrity checks
export const validateDownloadIntegrity = (download: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required fields
  if (!download.id) errors.push('Download ID is missing');
  if (!download.url) errors.push('Download URL is missing');
  if (!download.filename) errors.push('Filename is missing');
  if (!download.status) errors.push('Status is missing');
  
  // Check data types
  if (download.progress !== undefined && typeof download.progress !== 'number') {
    errors.push('Progress must be a number');
  }
  if (download.speed !== undefined && download.speed !== null && typeof download.speed !== 'number') {
    errors.push('Speed must be a number or null');
  }
  if (download.filesize !== undefined && download.filesize !== null && typeof download.filesize !== 'number') {
    errors.push('Filesize must be a number or null');
  }
  
  // Check value ranges
  if (typeof download.progress === 'number') {
    if (download.progress < 0 || download.progress > 100) {
      errors.push('Progress must be between 0 and 100');
    }
  }
  if (typeof download.speed === 'number' && download.speed < 0) {
    errors.push('Speed cannot be negative');
  }
  if (typeof download.filesize === 'number' && download.filesize < 0) {
    errors.push('Filesize cannot be negative');
  }
  
  // Check status validity
  const validStatuses = [
    'pending', 'initializing', 'extracting', 'connecting', 
    'downloading', 'processing', 'postprocessing', 'completed', 
    'error', 'paused', 'cancelled'
  ];
  if (!validStatuses.includes(download.status)) {
    errors.push('Invalid download status');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateMetadataIntegrity = (metadata: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields (compatible with existing metadata structure)
  if (!metadata.title) errors.push('Metadata title is missing');
  
  // Data type checks
  if (metadata.duration !== undefined && metadata.duration !== null) {
    if (typeof metadata.duration !== 'number' || metadata.duration < 0) {
      errors.push('Invalid duration');
    }
  }
  
  // Format validation - be more lenient
  if (metadata.formats && Array.isArray(metadata.formats)) {
    // Don't require formats to be non-empty, just that it's an array
  } else if (metadata.formats !== undefined) {
    errors.push('Formats must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Type guards
export const isVideoMetadata = (metadata: any): metadata is z.infer<typeof metadataSchema> => {
  try {
    metadataSchema.parse(metadata);
    return true;
  } catch {
    return false;
  }
};

export const isPlaylistMetadata = (metadata: any): metadata is z.infer<typeof playlistSchema> => {
  try {
    playlistSchema.parse(metadata);
    return true;
  } catch {
    return false;
  }
};

export const isDownload = (download: any): download is z.infer<typeof downloadSchema> => {
  try {
    downloadSchema.parse(download);
    return true;
  } catch {
    return false;
  }
};

// Utility functions for platform detection
export const getPlatformFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    
    // Map common platforms
    const platformMap: Record<string, string> = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'vimeo.com': 'Vimeo',
      'dailymotion.com': 'Dailymotion',
      'twitch.tv': 'Twitch',
      'facebook.com': 'Facebook',
      'instagram.com': 'Instagram',
      'twitter.com': 'Twitter',
      'x.com': 'Twitter/X',
      'tiktok.com': 'TikTok',
      'reddit.com': 'Reddit',
      'soundcloud.com': 'SoundCloud',
      'bilibili.com': 'Bilibili',
    };
    
    return platformMap[hostname] || hostname;
  } catch {
    return null;
  }
};

export const isSupportedPlatform = (url: string): boolean => {
  return validateSupportedPlatform(url);
};

// Export supported platforms for reference
export { SUPPORTED_PLATFORMS };

// Export inferred types for TypeScript usage
export type UrlSchema = z.infer<typeof urlSchema>;
export type DownloadOptionsSchema = z.infer<typeof downloadOptionsSchema>;
export type MetadataSchema = z.infer<typeof metadataSchema>;
export type PlaylistSchema = z.infer<typeof playlistSchema>;
export type DownloadSchema = z.infer<typeof downloadSchema>; 