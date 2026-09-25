import { $, dropzone, progress, download, copy, baseName, toast } from '../lib/ui.js';
import { createModel, decodeAudio } from '../lib/ai.js';

const dtype = {
  webgpu: { encoder_model: 'fp32', decoder_model_merged: 'q4' },
  wasm: { encoder_model: 'q8', decoder_model_merged: 'q8' },
};
const MODELS = {
  base: createModel({ task: 'automatic-speech-recognition', model: 'onnx-community/whisper-base', dtype }),
  small: createModel({ task: 'automatic-speech-recognition', model: 'onnx-community/whisper-small', dtype }),
};

const prog = progress($('#progress'));
const drop = $('#drop');
const result = $('#result');
let chunks = [];
let name = 'transcript';

const pad = (n, w = 2) => String(n).padStart(w, '0');
function stamp(sec, sep) {
  sec = Math.max(0, sec || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms, 3)}`;
}
const clean = () => chunks.filter((c) => c.text.trim());
const toSrt = () => clean().map((c, i) => `${i + 1}\n${stamp(c.timestamp[0], ',')} --> ${stamp(c.timestamp[1] ?? c.timestamp[0] + 2, ',')}\n${c.text.trim()}\n`).join('\n');
const toVtt = () => `WEBVTT\n\n${clean().map((c) => `${stamp(c.timestamp[0], '.')} --> ${stamp(c.timestamp[1] ?? c.timestamp[0] + 2, '.')}\n${c.text.trim()}\n`).join('\n')}`;
const toTxt = () => clean().map((c) => c.text.trim()).join(' ').replace(/\s+/g, ' ').trim();

function showMedia(file) {
  const box = $('#media');
  box.innerHTML = '';
  const isVideo = file.type.startsWith('video/');
  const el = document.createElement(isVideo ? 'video' : 'audio');
  el.controls = true;
  el.src = URL.createObjectURL(file);
  el.style.width = '100%';
  if (isVideo) {
    el.style.maxHeight = '60vh';
    el.style.borderRadius = '14px';
    el.style.background = '#000';
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Generated';
    track.default = true;
    track.src = URL.createObjectURL(new Blob([toVtt()], { type: 'text/vtt' }));
    el.append(track);
  }
  box.append(el);
}

async function handle([file]) {
  name = baseName(file.name);
  drop.hidden = true; result.hidden = true;
  try {
    prog.busy('Reading audio…');
    const audio = await decodeAudio(file, 16000);
    const minutes = audio.length / 16000 / 60;
    const model = MODELS[$('#size').value];
    await model.load((p, label) => prog.set(p, label));
    const device = await model.device();
    prog.busy(`Transcribing ${minutes.toFixed(1)} min of audio on your ${device === 'webgpu' ? 'GPU' : 'CPU'}. Keep this tab open…`);
    const lang = $('#lang').value;
    const out = await model.run(audio, {
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      task: $('#task').value,
      ...(lang ? { language: lang } : {}),
    }, (p, l) => prog.set(p, l));
    chunks = out.chunks?.length ? out.chunks : [{ timestamp: [0, audio.length / 16000], text: out.text }];
    $('#out').textContent = toTxt() || '(No speech detected.)';
    showMedia(file);
    prog.hide();
    result.hidden = false;
  } catch (err) {
    console.error(err);
    prog.hide(); drop.hidden = false;
    toast(err.message || 'Transcription failed.');
  }
}

dropzone(drop, { accept: 'audio/*,video/*,.m4a,.mkv,.mov', onFiles: handle });
$('#copy').addEventListener('click', () => copy(toTxt()));
$('#dl-txt').addEventListener('click', () => download(new Blob([toTxt()], { type: 'text/plain' }), `${name}.txt`));
$('#dl-srt').addEventListener('click', () => download(new Blob([toSrt()], { type: 'application/x-subrip' }), `${name}.srt`));
$('#dl-vtt').addEventListener('click', () => download(new Blob([toVtt()], { type: 'text/vtt' }), `${name}.vtt`));
$('#again').addEventListener('click', () => { result.hidden = true; drop.hidden = false; });
