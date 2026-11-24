# VideoKit

A browser-first video utility suite. Trim, merge, convert, resize and extract audio from video files without uploading source media to an application server.

## Features

- Trim a clip using start and end times.
- Merge multiple clips in the order shown in the media list.
- Convert video to MP4 (H.264) or WebM (VP9).
- Resize video to 1080p, 720p, 480p or 360p while preserving aspect ratio.
- Extract MP3 audio or remove the audio track.
- Preview and download the processed result.
- Add files by browsing or drag-and-drop; reorder and remove files.

## Run locally

Serve this directory over HTTP or HTTPS (for example, with the VS Code Live Server extension or `python -m http.server`) and open it in a recent browser. The FFmpeg WebAssembly engine is loaded from jsDelivr on the first processing action, so an internet connection is required.

Do not rely on opening `index.html` directly with a `file://` URL; browsers commonly restrict module and worker loading in that context.

## Privacy

- Source video is read and processed in browser memory.
- VideoKit does not provide an upload endpoint and does not send media to an application server.
- The FFmpeg JavaScript module and WebAssembly core are downloaded from a public CDN.
- The small worker entry point is served from the same GitHub Pages origin to avoid browsers blocking a cross-origin Worker; it imports the pinned FFmpeg worker module from jsDelivr.
- Generated results are held in a temporary browser object URL until removed or the page is closed.

## Limits

- Maximum 10 files in the list and 500 MB per file. Actual practical limits depend on available device memory and browser performance.
- Merge uses stream copy; clips with incompatible codecs, dimensions, frame rates or stream layouts may fail.
- Codec availability depends on the FFmpeg core build.
- Large files and high-resolution video can take considerable time and memory, especially on mobile devices.
- No cloud storage, accounts, timeline editor, subtitles, effects, watermarking or server-side processing in this MVP.

See [PRODUCT-SPEC.md](PRODUCT-SPEC.md) and [tests/TEST-PLAN.md](tests/TEST-PLAN.md) for scope and manual validation steps.
