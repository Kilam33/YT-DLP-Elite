export interface Preset {
  id: string;
  name: string;
  description: string;
  category: 'simple' | 'advanced';
  group: string;
  args: string;
  icon?: string;
  color?: string;
}

export const PRESETS: Preset[] = [
  // Simple Presets (for UX)
  {
    id: 'default-mp4',
    name: 'Default MP4',
    description: 'GUI quality selection',
    category: 'simple',
    group: 'Basic',
    args: '',
    color: 'bg-lime-500/20'
  },
  {
    id: 'audio-only',
    name: 'Audio Only (MP3)',
    description: 'Extract to MP3 format',
    category: 'simple',
    group: 'Basic',
    args: '-x --audio-format mp3 --audio-quality 0',
    color: 'bg-blue-500/20'
  },
  {
    id: 'audio-only-flac',
    name: 'Audio Only (FLAC)',
    description: 'Extract to lossless FLAC',
    category: 'simple',
    group: 'Basic',
    args: '-x --audio-format flac --audio-quality 0',
    color: 'bg-indigo-500/20'
  },
  {
    id: 'video-only',
    name: 'Video Only',
    description: 'Video without audio',
    category: 'simple',
    group: 'Basic',
    args: '--format "bestvideo[ext=mp4]/best[ext=mp4]/best"',
    color: 'bg-purple-500/20'
  },
  {
    id: 'low-quality',
    name: 'Low Quality (480p)',
    description: 'Fast preview quality',
    category: 'simple',
    group: 'Basic',
    args: '--format "best[height<=480][ext=mp4]/best[height<=480]"',
    color: 'bg-orange-500/20'
  },
  {
    id: 'high-quality',
    name: 'High Quality (4K)',
    description: 'Maximum quality available',
    category: 'simple',
    group: 'Basic',
    args: '--format "bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160]"',
    color: 'bg-red-500/20'
  },
  {
    id: 'with-metadata',
    name: 'With Metadata',
    description: 'Embed metadata & thumbnail',
    category: 'simple',
    group: 'Basic',
    args: '--embed-metadata --embed-thumbnail --add-metadata',
    color: 'bg-emerald-500/20'
  },
  {
    id: 'playlist-mode',
    name: 'Playlist Mode',
    description: 'Organized playlist folders',
    category: 'simple',
    group: 'Basic',
    args: '-o "~/Downloads/%(playlist_title)s/%(title)s.%(ext)s"',
    color: 'bg-cyan-500/20'
  },

  // Advanced Audio Extraction
  {
    id: 'flac-lossless',
    name: 'FLAC (Lossless)',
    description: 'Download and convert to FLAC using ffmpeg for full quality',
    category: 'advanced',
    group: 'Audio Extraction',
    args: '-x --audio-format flac --audio-quality 0',
    color: 'bg-indigo-500/20'
  },
  {
    id: 'wav-uncompressed',
    name: 'WAV (Uncompressed)',
    description: 'Download and convert to raw PCM WAV format',
    category: 'advanced',
    group: 'Audio Extraction',
    args: '-x --audio-format wav --audio-quality 0',
    color: 'bg-indigo-500/20'
  },
  {
    id: 'alac-apple',
    name: 'ALAC (Apple Lossless)',
    description: 'Ideal for iTunes and macOS audio libraries',
    category: 'advanced',
    group: 'Audio Extraction',
    args: '-x --audio-format alac --audio-quality 0',
    color: 'bg-indigo-500/20'
  },
  {
    id: 'mp3-portable',
    name: 'MP3 (Portable)',
    description: 'Most compatible compressed format',
    category: 'advanced',
    group: 'Audio Extraction',
    args: '-x --audio-format mp3 --audio-quality 0',
    color: 'bg-indigo-500/20'
  },
  {
    id: 'original-audio',
    name: 'Original Audio Stream',
    description: 'Downloads the site\'s original audio stream without conversion',
    category: 'advanced',
    group: 'Audio Extraction',
    args: '-f bestaudio',
    color: 'bg-indigo-500/20'
  },

  // Playback Cleanup & Enhancement
  {
    id: 'split-chapters',
    name: 'Split by Chapters',
    description: 'Automatically slices media based on embedded chapter data',
    category: 'advanced',
    group: 'Playback Cleanup & Enhancement',
    args: '--split-chapters',
    color: 'bg-teal-500/20'
  },
  {
    id: 'skip-sponsored',
    name: 'Skip Sponsored Segments',
    description: 'Removes intros, ads, outros using SponsorBlock API',
    category: 'advanced',
    group: 'Playback Cleanup & Enhancement',
    args: '--sponsorblock-mark all --sponsorblock-remove all',
    color: 'bg-teal-500/20'
  },
  {
    id: 'audio-normalization',
    name: 'Audio Normalization',
    description: 'Apply loudness normalization using ffmpeg during post-process',
    category: 'advanced',
    group: 'Playback Cleanup & Enhancement',
    args: '--postprocessor-args "ffmpeg:-af loudnorm"',
    color: 'bg-teal-500/20'
  },

  // Playlist & Bulk Download Control
  {
    id: 'select-playlist-items',
    name: 'Select Specific Playlist Items',
    description: 'Download by index or ranges in a playlist',
    category: 'advanced',
    group: 'Playlist & Bulk Download Control',
    args: '--playlist-items 1,3,7-10',
    color: 'bg-cyan-500/20'
  },
  {
    id: 'archive-mode',
    name: 'Archive Mode (No Repeats)',
    description: 'Keeps a log of completed downloads to prevent repeats',
    category: 'advanced',
    group: 'Playlist & Bulk Download Control',
    args: '--download-archive archive.txt',
    color: 'bg-cyan-500/20'
  },

  // Performance & Bandwidth Tuning
  {
    id: 'throttle-speed',
    name: 'Throttle Download Speed',
    description: 'Limit speed for background jobs or slow connections',
    category: 'advanced',
    group: 'Performance & Bandwidth Tuning',
    args: '--limit-rate 1M',
    color: 'bg-yellow-500/20'
  },
  {
    id: 'concurrent-fragments',
    name: 'Concurrent Fragment Downloads',
    description: 'Speeds up segmented downloads (DASH/HLS)',
    category: 'advanced',
    group: 'Performance & Bandwidth Tuning',
    args: '--concurrent-fragments 4',
    color: 'bg-yellow-500/20'
  },

  // Bypass & Spoofing
  {
    id: 'geo-bypass',
    name: 'Geo-Bypass',
    description: 'Bypass country blocks with IP hints',
    category: 'advanced',
    group: 'Bypass & Spoofing',
    args: '--geo-bypass --geo-bypass-country US',
    color: 'bg-violet-500/20'
  },
  {
    id: 'spoof-user-agent',
    name: 'Spoof User-Agent',
    description: 'Pretend to be a specific browser for compatibility',
    category: 'advanced',
    group: 'Bypass & Spoofing',
    args: '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"',
    color: 'bg-violet-500/20'
  },
  {
    id: 'browser-cookies',
    name: 'Use Browser Cookies',
    description: 'Use local browser login cookies for private videos',
    category: 'advanced',
    group: 'Bypass & Spoofing',
    args: '--cookies-from-browser chrome',
    color: 'bg-violet-500/20'
  },

  // Metadata & Post-Processing
  {
    id: 'embed-metadata',
    name: 'Embed Thumbnail and Metadata',
    description: 'Attach tags and thumbnails to audio files',
    category: 'advanced',
    group: 'Metadata & Post-Processing',
    args: '--embed-thumbnail --embed-metadata --add-metadata',
    color: 'bg-emerald-500/20'
  },
  {
    id: 'write-metadata-files',
    name: 'Write Metadata Files',
    description: 'Save .json, .description, .annotations, and thumbnail locally',
    category: 'advanced',
    group: 'Metadata & Post-Processing',
    args: '--write-info-json --write-thumbnail --write-description --write-annotations',
    color: 'bg-emerald-500/20'
  },

  // Output Templates & File Structuring
  {
    id: 'safe-filenames',
    name: 'Safe Custom Filenames',
    description: 'Use ID and uploader in filename to avoid overwrites',
    category: 'advanced',
    group: 'Output Templates & File Structuring',
    args: '-o "%(title)s - %(uploader)s [%(id)s].%(ext)s"',
    color: 'bg-rose-500/20'
  },
  {
    id: 'organized-folders',
    name: 'Organized Folder Output',
    description: 'Place files in folders by uploader, playlist, and title',
    category: 'advanced',
    group: 'Output Templates & File Structuring',
    args: '-o "~/Downloads/yt-dlp/%(uploader)s/%(playlist)s/%(title)s.%(ext)s"',
    color: 'bg-rose-500/20'
  },

  // Developer & Maintenance Tools
  {
    id: 'verbose-debug',
    name: 'Verbose Debug Logging',
    description: 'Print HTTP request and internal logs for troubleshooting',
    category: 'advanced',
    group: 'Developer & Maintenance Tools',
    args: '--print-traffic --verbose',
    color: 'bg-slate-500/20'
  },
  {
    id: 'dry-run',
    name: 'Dry Run (No Download)',
    description: 'Simulate without downloading anything, useful for scripting/testing',
    category: 'advanced',
    group: 'Developer & Maintenance Tools',
    args: '--simulate',
    color: 'bg-slate-500/20'
  },
  {
    id: 'update-ytdlp',
    name: 'Update yt-dlp',
    description: 'Update to the latest version',
    category: 'advanced',
    group: 'Developer & Maintenance Tools',
    args: '--update',
    color: 'bg-slate-500/20'
  }
];

export const getPresetsByCategory = () => {
  const simple = PRESETS.filter(p => p.category === 'simple');
  const advanced = PRESETS.filter(p => p.category === 'advanced');
  
  const advancedByGroup = advanced.reduce((acc, preset) => {
    if (!acc[preset.group]) {
      acc[preset.group] = [];
    }
    acc[preset.group].push(preset);
    return acc;
  }, {} as Record<string, Preset[]>);

  return { simple, advanced: advancedByGroup };
};

export const findPresetById = (id: string): Preset | undefined => {
  return PRESETS.find(preset => preset.id === id);
};

export const findPresetByArgs = (args: string): Preset | undefined => {
  return PRESETS.find(preset => preset.args === args);
};

export const getPresetGroups = () => {
  const groups = [...new Set(PRESETS.map(p => p.group))];
  return groups.sort();
}; 