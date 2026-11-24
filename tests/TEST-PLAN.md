# VideoKit manual test plan

## Setup
- Open the site over HTTPS in current Chrome, Edge and Firefox.
- Confirm the page loads without application-server media requests.
- Confirm first processing run downloads the FFmpeg module and core from the configured CDN.

## File handling
- [ ] Add one MP4, WebM and MOV file where available.
- [ ] Drag and drop multiple files.
- [ ] Select a file and verify selected state.
- [ ] Reorder files; remove one; clear all.
- [ ] Reject non-video files and files larger than 500 MB.
- [ ] Confirm the 10-file limit.

## Processing
- [ ] Trim a clip with valid start/end values; verify duration and playback.
- [ ] Reject end time less than or equal to start time.
- [ ] Merge two compatible clips and verify their order.
- [ ] Confirm incompatible source streams show a useful error.
- [ ] Convert to MP4 and WebM where supported by the FFmpeg core.
- [ ] Resize to each preset and verify aspect ratio and maximum dimensions.
- [ ] Extract MP3 and play it in the audio player.
- [ ] Mute a video and confirm it has no audio track.

## Result lifecycle
- [ ] Verify output filename, size, preview and download.
- [ ] Remove a result and verify the preview clears.
- [ ] Generate a second result and verify the previous object URL is released.
- [ ] Close the page and verify no media upload was made.

## Responsive and accessibility
- [ ] Check 360px mobile width and tablet/desktop layouts.
- [ ] Operate tool tabs and media list with keyboard.
- [ ] Confirm status updates are announced and controls have labels.
- [ ] Test a long filename and a large source file on a lower-memory device.
