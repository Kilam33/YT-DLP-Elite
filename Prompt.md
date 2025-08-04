Prompt Name: YT-DLP Elite GUI – Performance Optimization Tasks

Context:
I am optimizing a professional-grade desktop app named YT-DLP Elite GUI built with React 18, Redux Toolkit, Tailwind CSS, Framer Motion, and Electron + Vite. The app interfaces with yt-dlp via IPC for high-volume video/audio downloads and playlist handling. Real-time performance, memory footprint, and robustness are critical for smooth UX during concurrent downloads, large playlist processing, and live UI updates.

Goal:
Break down and prioritize the following performance tasks into actionable subtasks or GitHub issues with technical details, implementation guidance, and suggested tools.

🔥 Phase 1 – Critical Performance
Virtual Scrolling for Large Download Lists

Replace full list rendering with react-window or react-virtualized

Estimate: DOM node reduction by 80–90%

Debounced Download Progress Updates

Use use-debounce to reduce Redux re-renders

Batch updates every 100–200ms

Optimize Redux State Mutations

Use structural sharing with immer or manual updates

Split slices if updates cause excessive re-renders

Retry Logic with Exponential Backoff

Add smart retry handler for network failures

Support delay strategy and circuit breakers

🧠 Phase 2 – Memory Management & Robustness
Download History Pagination

Load only 50–100 downloads at a time

Use cursor-based or infinite scroll

Persist Download State to Disk

Use redux-persist or periodic JSON save

Load state on startup, validate structure

Batch IPC Messages

Queue updates and flush in batches

Compress messages with pako

Error Boundaries + Graceful Degradation

Add try/catch wrappers, fallback UIs, and boundaries per tab

⚡ Phase 3 – UI & Rendering Performance
Memoize and Optimize Components

Memoize DownloadCard, QueueView, DownloadsView

Use useMemo for derived props and styles

Optimize Framer Motion Animations

Replace list-wide animations with selective motion

Prefer CSS transforms over JavaScript

Implement Loading States and Skeleton UIs

Use progressive loading feedback during IPC or large downloads

Keyboard Shortcuts

Use react-hotkeys-hook or global handlers for navigation

⚙️ Phase 4 – Electron Backend Optimization
Electron Process Pool for yt-dlp

Avoid spawning new processes per task

Implement pooled long-running workers

Process Cleanup on Exit

Ensure no zombie processes via SIGTERM/SIGINT listeners

Resource Monitoring

Use systeminformation or pidusage to log CPU, memory

Instructions for Agent:

Tick of the @PERFORMANCE_OPTIMIZATION.md  upon completion for every task E:\Projects\YT-DLP\PERFORMANCE_OPTIMIZATION.md

Add estimates, technical tags, and responsible component (e.g., IPC, UI, Redux)

Include test case outlines for each task

Attach tracking labels like Phase-1, High-Priority, Memory, or IPC

Success Criteria for All Tasks:

Maintain smooth UI at 60 FPS with 100+ downloads

No memory leaks after 24h use

State persists between restarts

User interactions are <100ms latency

Reduced memory <100MB at idle, <200MB during active downloads