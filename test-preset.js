// Simple test to verify preset functionality
const { spawn } = require('child_process');

// Test different preset arguments
const testPresets = [
  {
    name: 'Video Only',
    args: '--format "b" --no-audio'
  },
  {
    name: 'Audio Only',
    args: '--extract-audio --audio-format mp3 --audio-quality 0'
  },
  {
    name: 'With Subtitles',
    args: '--write-sub --write-auto-sub --sub-lang en'
  }
];

function testPreset(preset) {
  console.log(`\nTesting preset: ${preset.name}`);
  console.log(`Arguments: ${preset.args}`);
  
  // Simulate the argument building process
  const baseArgs = [
    '--newline',
    '--progress-template', 'download:[%(progress._percent_str)s] %(progress._speed_str)s ETA %(progress._eta_str)s downloaded %(progress._downloaded_bytes_str)s of %(progress._total_bytes_str)s',
    '--output', 'test.%(ext)s',
    '--no-playlist',
    '--no-warnings',
  ];
  
  // Add custom arguments
  const customArgs = preset.args.trim().split(/\s+/).filter(arg => arg.length > 0);
  baseArgs.push(...customArgs);
  
  // Add format selection (simulating the logic)
  const hasCustomFormat = preset.args.includes('--format') || preset.args.includes('--extract-audio');
  if (!hasCustomFormat) {
    baseArgs.push('--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best');
  }
  
  baseArgs.push('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // Test URL
  
  console.log('Final command:');
  console.log('yt-dlp', baseArgs.join(' '));
  
  return baseArgs;
}

// Test all presets
testPresets.forEach(testPreset); 