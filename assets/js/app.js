const $ = (id) => document.getElementById(id);
const state = { files: [], selectedId: null, ffmpeg: null, loading: false, outputUrl: null, outputName: null };
const MAX_FILES = 10;
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
const FFmpegModuleURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return 'Unknown size';
  const units = ['B','KB','MB','GB']; let n = bytes, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
};
const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '').slice(0, 100) || 'video';
const selectedFile = () => state.files.find((item) => item.id === state.selectedId) || null;
const setStatus = (message) => { $('statusText').textContent = message; };
const setProgress = (value) => { $('progressBar').style.width = `${Math.max(0, Math.min(100, value))}%`; document.querySelector('.progress').setAttribute('aria-valuenow', String(value)); };

function renderFiles() {
  const root = $('fileList'); root.replaceChildren();
  if (!state.files.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.textContent = 'No files added yet.'; root.append(empty); return; }
  state.files.forEach((item, index) => {
    const row = document.createElement('div'); row.className = `file-item ${item.id === state.selectedId ? 'selected' : ''}`;
    const icon = document.createElement('div'); icon.className = 'file-icon'; icon.innerHTML = '<i class="fa-solid fa-file-video"></i>';
    const info = document.createElement('div'); info.className = 'file-info';
    const name = document.createElement('div'); name.className = 'file-name'; name.textContent = item.file.name; name.title = item.file.name;
    const size = document.createElement('div'); size.className = 'file-size'; size.textContent = formatBytes(item.file.size);
    info.append(name, size);
    const actions = document.createElement('div'); actions.className = 'file-actions d-flex align-items-center gap-1';
    const up = document.createElement('button'); up.type = 'button'; up.title = 'Move up'; up.setAttribute('aria-label', 'Move up'); up.innerHTML = '<i class="fa-solid fa-chevron-up"></i>'; up.disabled = index === 0; up.addEventListener('click', (event) => { event.stopPropagation(); [state.files[index - 1], state.files[index]] = [state.files[index], state.files[index - 1]]; renderFiles(); });
    const down = document.createElement('button'); down.type = 'button'; down.title = 'Move down'; down.setAttribute('aria-label', 'Move down'); down.innerHTML = '<i class="fa-solid fa-chevron-down"></i>'; down.disabled = index === state.files.length - 1; down.addEventListener('click', (event) => { event.stopPropagation(); [state.files[index + 1], state.files[index]] = [state.files[index], state.files[index + 1]]; renderFiles(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.title = 'Remove file'; remove.setAttribute('aria-label', 'Remove file'); remove.innerHTML = '<i class="fa-solid fa-xmark"></i>'; remove.addEventListener('click', (event) => { event.stopPropagation(); state.files = state.files.filter((f) => f.id !== item.id); if (state.selectedId === item.id) state.selectedId = state.files[0]?.id || null; renderFiles(); });
    actions.append(up, down, remove); row.append(icon, info, actions);
    row.addEventListener('click', () => { state.selectedId = item.id; renderFiles(); });
    row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', `Select ${item.file.name}`);
    root.append(row);
  });
}
function addFiles(fileList) {
  const incoming = Array.from(fileList || []);
  for (const file of incoming) {
    if (state.files.length >= MAX_FILES) { setStatus(`A maximum of ${MAX_FILES} files can be added.`); break; }
    if (!file.type.startsWith('video/') && !/\.(mkv|avi|mov|m4v|3gp)$/i.test(file.name)) { setStatus(`Skipped unsupported file: ${file.name}`); continue; }
    if (file.size > MAX_FILE_SIZE) { setStatus(`${file.name} is larger than the 500 MB per-file limit.`); continue; }
    if (state.files.some((item) => item.file.name === file.name && item.file.size === file.size)) continue;
    const item = { id: crypto.randomUUID(), file };
    state.files.push(item); if (!state.selectedId) state.selectedId = item.id;
  }
  renderFiles(); $('fileInput').value = '';
  if (state.files.length) setStatus(`${state.files.length} file(s) ready. Select a tool to continue.`);
}
function clearOutput() {
  if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
  state.outputUrl = null; state.outputName = null;
  $('resultArea').hidden = true; $('resultEmpty').hidden = false; $('resultVideo').pause(); $('resultVideo').removeAttribute('src'); $('resultAudio').removeAttribute('src'); $('outputMeta').textContent = '';
}
function showOutput(blob, filename, isAudio = false) {
  clearOutput(); state.outputUrl = URL.createObjectURL(blob); state.outputName = filename;
  $('resultEmpty').hidden = true; $('resultArea').hidden = false;
  $('resultVideo').hidden = isAudio; $('resultAudio').hidden = !isAudio;
  const player = isAudio ? $('resultAudio') : $('resultVideo'); player.src = state.outputUrl; player.load();
  $('downloadLink').href = state.outputUrl; $('downloadLink').download = filename;
  $('outputMeta').textContent = `${filename} · ${formatBytes(blob.size)}`;
}
async function loadEngine() {
  if (state.ffmpeg) return state.ffmpeg;
  $('engineStatus').textContent = 'Loading…'; setStatus('Downloading the video processing engine. This may take a moment on first use.');
  const { FFmpeg } = await import(FFmpegModuleURL);
  const ffmpeg = new FFmpeg();
  ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)));
  ffmpeg.on('log', ({ message }) => { if (/error/i.test(message)) setStatus(message.slice(0, 180)); });
  const toBlobURL = async (url, type) => { const response = await fetch(url); if (!response.ok) throw new Error('Could not download the processing engine. Check your connection and try again.'); return URL.createObjectURL(new Blob([await response.arrayBuffer()], { type })); };
  const coreURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript');
  const wasmURL = await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm');
  await ffmpeg.load({ coreURL, wasmURL });
  state.ffmpeg = ffmpeg; $('engineStatus').textContent = 'Ready'; return ffmpeg;
}
async function writeInput(ffmpeg, file, index = 0) {
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const name = `input_${index}.${ext}`; await ffmpeg.writeFile(name, new Uint8Array(await file.arrayBuffer())); return name;
}
async function readOutput(ffmpeg, name, mime) {
  const data = await ffmpeg.readFile(name); const blob = new Blob([data], { type: mime }); await ffmpeg.deleteFile(name).catch(() => {}); return blob;
}
function validateSelection() {
  const item = selectedFile(); if (!item) throw new Error('Add and select a video first.'); return item.file;
}
async function runAction(action) {
  if (state.loading) return;
  state.loading = true; document.querySelectorAll('.run-tool').forEach((button) => button.disabled = true);
  setProgress(0); clearOutput();
  try {
    const ffmpeg = await loadEngine();
    let output = 'videokit_output.mp4', mime = 'video/mp4', isAudio = false;
    if (action === 'merge') {
      if (state.files.length < 2) throw new Error('Add at least two videos to merge.');
      const names = [];
      for (let i = 0; i < state.files.length; i++) names.push(await writeInput(ffmpeg, state.files[i].file, i));
      const manifest = names.map((name) => `file '${name}'`).join('\n');
      await ffmpeg.writeFile('concat_list.txt', new TextEncoder().encode(manifest));
      output = 'merged_video.mp4';
      await ffmpeg.exec(['-y','-f','concat','-safe','0','-i','concat_list.txt','-c','copy','-movflags','+faststart',output]);
    } else {
      const file = validateSelection(); const input = await writeInput(ffmpeg, file);
      if (action === 'trim') {
        const start = Number($('trimStart').value), end = Number($('trimEnd').value);
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) throw new Error('Enter a valid end time greater than the start time.');
        output = `${safeName(file.name.replace(/\.[^.]+$/, ''))}_trimmed.mp4`;
        await ffmpeg.exec(['-y','-ss', String(start), '-i', input, '-t', String(end - start), '-c:v','libx264','-preset','ultrafast','-crf','23','-c:a','aac','-movflags','+faststart',output]);
      } else if (action === 'convert') {
        const format = $('convertFormat').value;
        output = `${safeName(file.name.replace(/\.[^.]+$/, ''))}.${format}`; mime = format === 'webm' ? 'video/webm' : 'video/mp4';
        const codecArgs = format === 'webm' ? ['-c:v','libvpx-vp9','-crf','32','-b:v','0','-c:a','libopus'] : ['-c:v','libx264','-preset','ultrafast','-crf','23','-c:a','aac','-movflags','+faststart'];
        await ffmpeg.exec(['-y','-i',input,...codecArgs,output]);
      } else if (action === 'resize') {
        const [w,h] = $('resizePreset').value.split(':');
        output = `${safeName(file.name.replace(/\.[^.]+$/, ''))}_${h}p.mp4`;
        await ffmpeg.exec(['-y','-i',input,'-vf',`scale=w='min(iw,${w})':h='min(ih,${h})':force_original_aspect_ratio=decrease:force_divisible_by=2`,'-c:v','libx264','-preset','ultrafast','-crf','23','-c:a','aac','-movflags','+faststart',output]);
      } else if (action === 'extract') {
        output = `${safeName(file.name.replace(/\.[^.]+$/, ''))}.mp3`; mime = 'audio/mpeg'; isAudio = true;
        await ffmpeg.exec(['-y','-i',input,'-vn','-codec:a','libmp3lame','-q:a','2',output]);
      } else if (action === 'mute') {
        output = `${safeName(file.name.replace(/\.[^.]+$/, ''))}_muted.mp4`;
        await ffmpeg.exec(['-y','-i',input,'-an','-c:v','libx264','-preset','ultrafast','-crf','23','-movflags','+faststart',output]);
      }
    }
    const blob = await readOutput(ffmpeg, output, mime);
    if (!blob.size) throw new Error('The processor returned an empty file. Try a different source or format.');
    showOutput(blob, output, isAudio); setProgress(100); setStatus('Processing complete. Your result is ready to preview and download.');
  } catch (error) {
    console.error(error); setStatus(error?.message || 'Processing failed. Try another file or format.'); $('engineStatus').textContent = state.ffmpeg ? 'Ready' : 'Not loaded';
  } finally {
    state.loading = false; document.querySelectorAll('.run-tool').forEach((button) => button.disabled = false);
  }
}

document.querySelectorAll('.tool-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tool-tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.tool-pane').forEach((pane) => pane.classList.toggle('active', pane.dataset.pane === tab.dataset.tool));
}));
document.querySelectorAll('.run-tool').forEach((button) => button.addEventListener('click', () => runAction(button.dataset.action)));
$('fileInput').addEventListener('change', (event) => addFiles(event.target.files));
$('clearFiles').addEventListener('click', () => { state.files = []; state.selectedId = null; renderFiles(); setStatus('Media list cleared.'); });
$('discardResult').addEventListener('click', clearOutput);
const dropzone = $('dropzone');
['dragenter','dragover'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave','drop'].forEach((name) => dropzone.addEventListener(name, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));
window.addEventListener('beforeunload', () => { if (state.outputUrl) URL.revokeObjectURL(state.outputUrl); });
