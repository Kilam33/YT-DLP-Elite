# YT-DLP Elite GUI

A professional-grade desktop application for downloading videos, audio, and playlists using yt-dlp with an intuitive graphical interface.

![YT-DLP Elite GUI](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 🚀 Features

### 📥 Download Management
- **Single Video Downloads** - Download individual videos with quality selection
- **Playlist Support** - Automatically detect and process YouTube playlists
- **Batch Processing** - Add multiple videos to queue for sequential downloading
- **Progress Tracking** - Real-time progress with file size, speed, and ETA
- **Format Selection** - Choose video quality and audio formats

### 🎛️ Download Presets
Quick action buttons for common download scenarios:
- **Standard** - Best quality video + audio
- **Video Only** - Video without audio (for editing)
- **Audio Only** - Extract audio (MP3 format)
- **Music Enhanced** - Audio with embedded thumbnails
- **With Subtitles** - Include available subtitles
- **With Metadata** - Include video info and thumbnails

### 📋 Queue System
- **Individual Control** - Pause, resume, or remove specific downloads
- **Reorder Queue** - Move downloads up or down in the queue
- **Batch Operations** - Start/pause entire queue
- **Status Tracking** - Monitor download status and progress

### ⚙️ Advanced Settings
- **Custom yt-dlp Arguments** - Add custom command-line options
- **Output Path** - Configure download directory
- **Quality Presets** - Set default video/audio quality
- **Concurrent Downloads** - Control number of simultaneous downloads
- **Retry Logic** - Automatic retry on failed downloads
- **File Naming** - Custom filename templates

### 📊 History & Logs
- **Download History** - Track completed and failed downloads
- **Search & Filter** - Find specific downloads in history
- **System Logs** - Monitor application activity and debug issues
- **Error Reporting** - Detailed error messages and troubleshooting

## 🛠️ Installation

### Prerequisites
- **yt-dlp** - [Install yt-dlp](https://github.com/yt-dlp/yt-dlp#installation)
- **FFmpeg** (Optional) - [Install FFmpeg](https://ffmpeg.org/download.html) for better format support

### Windows
1. Download the latest installer from [Releases](https://github.com/your-repo/releases)
2. Run `YT-DLP Elite Setup 1.0.0.exe`
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Portable Version
1. Download the portable version
2. Extract to any folder
3. Run `YT-DLP Elite.exe`

## 📖 Usage Guide

### Getting Started

1. **Launch the Application**
   - Start YT-DLP Elite from your desktop or start menu
   - The app will check for yt-dlp and FFmpeg availability

2. **Add a Download**
   - Paste a YouTube URL in the input field
   - Click "Preview" to see video information
   - Select quality and output folder
   - Click "Add to Queue" or "Download Now"

3. **Manage Downloads**
   - View active downloads in the Downloads tab
   - Monitor progress with real-time updates
   - Pause/resume individual downloads
   - Remove downloads from queue

### Playlist Downloads

1. **Paste Playlist URL**
   - Paste any YouTube playlist URL
   - The app automatically detects it's a playlist

2. **Preview Playlist**
   - See playlist title and video count
   - Preview first 5 videos with details
   - Select output folder for all videos

3. **Add to Queue**
   - Click "Add All to Queue"
   - Each video becomes a separate download
   - Control individual videos in the queue

### Download Presets

Use the quick action buttons in the sidebar:

- **📹 Standard** - Best quality video + audio
- **🎬 Video Only** - Video without audio (for editing)
- **🎵 Audio Only** - Extract audio as MP3
- **🎼 Music Enhanced** - Audio with embedded thumbnails
- **📝 With Subtitles** - Include available subtitles
- **ℹ️ With Metadata** - Include video info and thumbnails

### Queue Management

1. **View Queue**
   - Switch to the Queue tab
   - See all pending downloads with position numbers

2. **Reorder Downloads**
   - Use up/down arrows to move downloads
   - Reorder based on priority

3. **Control Queue**
   - Start/pause entire queue
   - Remove individual downloads
   - Clear entire queue

### Settings Configuration

1. **General Settings**
   - Set default output path
   - Configure concurrent downloads
   - Set retry attempts

2. **Download Settings**
   - Choose default quality preset
   - Set download speed limits
   - Configure custom yt-dlp arguments

3. **File Settings**
   - Custom filename templates
   - Enable/disable metadata writing
   - Configure subtitle options

## 🔧 Technical Details

### Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Electron (Node.js)
- **State Management**: Redux Toolkit
- **UI Framework**: Framer Motion for animations
- **Build Tool**: Vite + Electron Builder

### Key Components
- **Main Process** (`electron/main.js`) - Handles yt-dlp execution and file operations
- **Renderer Process** - React app for UI
- **IPC Communication** - Secure communication between processes
- **Download Engine** - yt-dlp integration with progress parsing

### File Structure
```
YT-DLP/
├── electron/           # Electron main process
│   ├── main.js        # Main process entry point
│   └── preload.js     # IPC bridge
├── src/               # React application
│   ├── components/    # React components
│   ├── store/         # Redux store and slices
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
├── dist/              # Built application
└── downloads/         # Default download directory
```

### Dependencies
- **yt-dlp** - Video downloading engine
- **FFmpeg** - Media processing (optional)
- **Electron** - Desktop application framework
- **React** - UI framework
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling framework

## 🎨 UI/UX Features

### Modern Design
- **Dark Theme** - Easy on the eyes
- **Glassmorphism Effects** - Modern visual design
- **Smooth Animations** - Framer Motion transitions
- **Responsive Layout** - Adapts to different screen sizes

### User Experience
- **Intuitive Navigation** - Clear tab-based interface
- **Real-time Updates** - Live progress and status updates
- **Keyboard Shortcuts** - Quick access to common actions
- **Toast Notifications** - User feedback for actions

### Accessibility
- **High Contrast** - Clear text and icons
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader Support** - Proper ARIA labels
- **Scalable UI** - Works on different DPI settings

## 🔍 Troubleshooting

### Common Issues

#### "yt-dlp not found"
1. Install yt-dlp: `pip install yt-dlp`
2. Ensure it's in your system PATH
3. Restart the application

#### "FFmpeg not found"
1. Install FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Add to system PATH
3. Restart the application

#### Downloads not starting
1. Check yt-dlp installation
2. Verify URL format
3. Check internet connection
4. Review error logs in Logs tab

#### Playlist not detected
1. Ensure URL is a valid YouTube playlist
2. Check yt-dlp version (update if needed)
3. Try single video first to test

### Error Messages

#### "Failed to fetch metadata"
- Check internet connection
- Verify URL is accessible
- Update yt-dlp to latest version

#### "Download failed"
- Check available disk space
- Verify output directory permissions
- Review detailed error in logs

#### "Queue processing failed"
- Check concurrent download limit
- Verify yt-dlp installation
- Review system resources

### Performance Tips

1. **Concurrent Downloads**
   - Start with 2-3 concurrent downloads
   - Increase based on your internet speed
   - Monitor system resources

2. **Output Directory**
   - Use SSD for faster write speeds
   - Ensure sufficient free space
   - Avoid network drives for large files

3. **Quality Selection**
   - Choose appropriate quality for your needs
   - Higher quality = larger files and longer download time
   - Audio-only for music saves space

## 🚀 Advanced Usage

### Custom yt-dlp Arguments

Add custom arguments in Settings:
```
--format "bestvideo[height<=1080]+bestaudio/best"
--write-sub --write-auto-sub
--embed-thumbnail
--add-metadata
```

### File Naming Templates

Configure custom filename patterns:
```
%(title)s.%(ext)s                    # Default
%(uploader)s - %(title)s.%(ext)s     # With uploader
%(upload_date)s_%(title)s.%(ext)s    # With date
```

### Batch Operations

1. **Multiple URLs**
   - Add multiple videos to queue
   - Use different quality settings
   - Monitor all downloads

2. **Playlist Processing**
   - Download entire playlists
   - Individual control over each video
   - Resume interrupted downloads

## 📝 Changelog

### Version 1.0.0
- ✨ Initial release
- 🎯 Playlist support with individual video control
- 🎛️ Download presets for common scenarios
- 📊 Real-time progress tracking
- ⚙️ Comprehensive settings system
- 🎨 Modern dark theme UI
- 📱 Responsive design
- 🔧 Advanced queue management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Setup
```bash
# Clone repository
git clone https://github.com/your-repo/yt-dlp-elite-gui.git
cd yt-dlp-elite-gui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run dist
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **yt-dlp** - The powerful video downloader that makes this possible
- **Electron** - Desktop application framework
- **React** - UI framework
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animation library

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)

---

**YT-DLP Elite GUI** - Professional video downloading made simple.

*Built with ❤️ using modern web technologies* 