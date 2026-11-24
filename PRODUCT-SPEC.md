# VideoKit — Product specification

## Goal
A browser-first video utility suite. Video data is processed locally with FFmpeg WebAssembly; the application has no upload endpoint or user account.

## MVP tools
- Trim a selected clip by start/end time (re-encoded for accurate cuts).
- Merge two or more clips in the visible list order (concat demuxer; source streams must be compatible).
- Convert a selected clip to MP4/H.264 or WebM/VP9.
- Resize a selected clip to a maximum 1080p, 720p, 480p or 360p while preserving aspect ratio.
- Extract MP3 audio or remove audio from a video.
- Preview and download the result.

## Privacy and data handling
- Source files are read into browser memory and FFmpeg's in-memory virtual filesystem.
- No VideoKit application server receives source media.
- FFmpeg and its core are downloaded from public CDNs on first processing use.
- The generated object URL is revoked when a result is removed or the page is closed.
- The browser may retain temporary memory until processing ends or the tab closes.

## Constraints and known limitations
- Browser memory, device performance, available codecs and browser support limit file size and format compatibility. The UI caps each input at 500 MB and the list at 10 files, but this is not a guarantee that a device can process the maximum.
- The FFmpeg WebAssembly engine is large and initial loading can take time.
- Merge uses stream copy and may fail when clips have incompatible stream parameters. Normalize clips to matching codec, dimensions and frame rate before joining.
- MP4 and WebM encoding depend on codecs included in the selected FFmpeg core build.
- Processing may be slower than native desktop software, especially on phones.
- No server-side processing, cloud storage, accounts, AI editing, subtitle editor, timeline, effects, watermarking, or batch export in this MVP.
- External CDN dependencies require an internet connection for initial load.

## Browser support
Use a recent desktop version of Chrome, Edge or Firefox for best results. Mobile support depends on available memory and browser capabilities.

## Security
No user-supplied filename is used as a path; generated virtual filesystem names are controlled by the application. Inputs are constrained to a fixed set of FFmpeg argument templates. Never add shell-string execution or interpolate untrusted text into filter expressions.
