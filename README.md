# OpenToolbox

Free AI and utility tools that run entirely in your browser. No signup, no upload.

**Live:** https://opentoolbox.vercel.app

- **AI (on-device):** background remover (BiRefNet), upscaler (Swin2SR), depth map (Depth Anything V2), alt text (Florence-2), speech-to-text + subtitles (Whisper), text-to-speech (Kokoro), private chat / summarize / grammar / translate / rewrite (Qwen2.5 via WebLLM), OCR (Tesseract.js)
- **Image:** compress, convert, resize, EXIF/GPS remover, favicon generator, palette extractor, QR codes
- **PDF:** merge, split, PDF → image, image → PDF
- **Developer:** JSON, regex, JWT, passwords, hashes/UUID, Base64, URL, timestamps, case, color, diff, Markdown

## Stack
Vite multi-page app, vanilla JS. Models run in Web Workers via Transformers.js (WebGPU with WASM fallback) and WebLLM (WebGPU). Model weights download from Hugging Face on first use and are cached by the browser.

## Develop
```bash
npm install --ignore-scripts   # skips onnxruntime-node's native download (not needed in the browser)
npm run dev
npm run build
```

## Add a tool
1. Add an entry to `src/lib/registry.js` (homepage, search, related tools and licenses page all read from it).
2. Create `tools/<slug>.html`:
   ```html
   <!doctype html><html lang="en"><head><!--@toolhead:<slug>--></head><body>
   <!--@toolstart:<slug>-->
     …your UI (use <!--@drop:id|Title|Subtitle-->, <!--@progress-->, <!--@batch--> helpers)…
   <!--@toolend:<slug>-->
   </body></html>
   ```
3. Create `src/tools/<slug>.js`. For a Transformers.js model use `createModel()` from `src/lib/ai.js`.

## License
MIT for the code. Each model keeps its own license: see `/licenses` on the site.
