// Single source of truth: homepage grid, category tabs, ⌘K palette, related tools, licenses page.
// status: 'live' | 'soon'
export const CATEGORIES = [
  { id: 'image-ai', name: 'Image AI' },
  { id: 'video-audio-ai', name: 'Video & Audio AI' },
  { id: 'text-ai', name: 'Text AI' },
  { id: 'image', name: 'Image' },
  { id: 'pdf', name: 'PDF & Docs' },
  { id: 'developer', name: 'Developer' },
];

const t = (slug, name, cat, model, license, desc, ai = false, status = 'live') =>
  ({ slug, name, cat, model, license, desc, ai, status });

export const TOOLS = [
  // Image AI
  t('background-remover', 'Background Remover', 'image-ai', 'BiRefNet lite', 'MIT', 'Cut out people, products and pets in one click. Full resolution, no watermark.', true),
  t('image-upscaler', 'Image Upscaler', 'image-ai', 'Swin2SR', 'Apache-2.0', 'Enlarge small photos 2× or 4× with AI detail recovery.', true),
  t('depth-map', 'Depth Map', 'image-ai', 'Depth Anything V2 Small', 'Apache-2.0', '3D depth from one photo, for parallax effects and editing.', true),
  t('alt-text-generator', 'Alt Text & Image Captions', 'image-ai', 'Florence-2 base', 'MIT', 'Describe any image in one line or in detail, for SEO and accessibility.', true),
  t('object-eraser', 'Object Eraser', 'image-ai', 'LaMa', 'Apache-2.0', 'Brush over people, text or clutter and it disappears.', true, 'soon'),
  t('text-to-image', 'Text to Image', 'image-ai', 'SD-Turbo', 'Stability Community', 'Type a prompt, get an image on your GPU.', true, 'soon'),

  // Video & Audio AI
  t('speech-to-text', 'Speech to Text & Subtitles', 'video-audio-ai', 'Whisper', 'MIT', 'Transcribe audio or video. Export .txt, .srt or .vtt subtitles.', true),
  t('text-to-speech', 'Text to Speech', 'video-audio-ai', 'Kokoro-82M', 'Apache-2.0', 'Natural voices, download as WAV.', true),
  t('noise-remover', 'Noise Remover', 'video-audio-ai', 'RNNoise', 'BSD-3-Clause', 'Clean up hum, fans and street noise in voice clips.', true, 'soon'),
  t('video-background-blur', 'Video Background Blur', 'video-audio-ai', 'MediaPipe', 'Apache-2.0', 'Blur the background behind a speaker.', true, 'soon'),
  t('video-to-gif', 'Video to GIF', 'video-audio-ai', 'ffmpeg.wasm', 'LGPL-2.1', 'Turn a short clip into a looping GIF.', false, 'soon'),

  // Text AI (WebLLM)
  t('ai-chat', 'Private AI Chat', 'text-ai', 'Qwen2.5 · WebLLM', 'Apache-2.0', 'A chat assistant that runs fully on your GPU. Nothing is sent anywhere.', true),
  t('summarizer', 'Summarizer', 'text-ai', 'Qwen2.5 · WebLLM', 'Apache-2.0', 'Turn a long article into short bullet points.', true),
  t('grammar-fixer', 'Grammar Fixer', 'text-ai', 'Qwen2.5 · WebLLM', 'Apache-2.0', 'Fix spelling, grammar and punctuation in one pass.', true),
  t('translator', 'Translator', 'text-ai', 'Qwen2.5 · WebLLM', 'Apache-2.0', 'Translate text between common languages, offline.', true),
  t('rewriter', 'Tone Rewriter', 'text-ai', 'Qwen2.5 · WebLLM', 'Apache-2.0', 'Make text more formal, friendly, shorter or clearer.', true),
  t('chat-with-pdf', 'Chat with a PDF', 'text-ai', 'MiniLM + Qwen2.5', 'Apache-2.0', 'Ask questions about a document that stays local.', true, 'soon'),

  // Image utilities
  t('image-compressor', 'Image Compressor', 'image', 'Canvas API', 'Built-in', 'Shrink JPG, PNG and WebP with a live size preview.'),
  t('image-converter', 'Image Converter', 'image', 'Canvas API', 'Built-in', 'Convert between PNG, JPG, WebP and AVIF.'),
  t('image-resizer', 'Image Resizer', 'image', 'Canvas API', 'Built-in', 'Resize by pixels or percentage, keep the aspect ratio.'),
  t('exif-remover', 'EXIF & Location Remover', 'image', 'Canvas API', 'Built-in', 'Strip GPS location and camera data before you share a photo.'),
  t('favicon-generator', 'Favicon Generator', 'image', 'Canvas API', 'Built-in', 'Every icon size you need, plus the HTML snippet.'),
  t('color-palette', 'Color Palette Extractor', 'image', 'k-means', 'Built-in', 'Pull the main colors out of any image.'),
  t('qr-code', 'QR Code Generator', 'image', 'qrcode', 'MIT', 'QR codes for links, Wi-Fi and text. PNG or SVG.'),

  // PDF & docs
  t('merge-pdf', 'Merge PDF', 'pdf', 'pdf-lib', 'MIT', 'Combine PDFs and set the order.'),
  t('split-pdf', 'Split PDF', 'pdf', 'pdf-lib', 'MIT', 'Pull out page ranges into a new file.'),
  t('pdf-to-image', 'PDF to Image', 'pdf', 'PDF.js', 'Apache-2.0', 'Every page as a PNG or JPG.'),
  t('image-to-pdf', 'Image to PDF', 'pdf', 'pdf-lib', 'MIT', 'Turn photos or scans into one PDF.'),
  t('ocr', 'Scan to Text (OCR)', 'pdf', 'Tesseract.js', 'Apache-2.0', 'Pull copyable text out of photos and scans.', true),

  // Developer
  t('json-formatter', 'JSON Formatter', 'developer', 'Native', 'Built-in', 'Format, minify and validate JSON.'),
  t('regex-tester', 'Regex Tester', 'developer', 'Native', 'Built-in', 'Live matches and capture groups.'),
  t('jwt-decoder', 'JWT Decoder', 'developer', 'Native', 'Built-in', 'Header, payload and expiry at a glance.'),
  t('password-generator', 'Password Generator', 'developer', 'Web Crypto', 'Built-in', 'Strong random passwords with a strength meter.'),
  t('hash-generator', 'UUID & Hash Generator', 'developer', 'Web Crypto', 'Built-in', 'UUIDv4 plus SHA-1, SHA-256 and SHA-512 hashes.'),
  t('base64', 'Base64 Encode / Decode', 'developer', 'Native', 'Built-in', 'Text and files to and from Base64.'),
  t('url-encoder', 'URL Encode / Decode', 'developer', 'Native', 'Built-in', 'Percent-encode query strings and paths.'),
  t('timestamp-converter', 'Timestamp Converter', 'developer', 'Native', 'Built-in', 'Unix epoch to readable dates and back.'),
  t('case-converter', 'Case Converter', 'developer', 'Native', 'Built-in', 'camelCase, snake_case, kebab-case and more.'),
  t('color-converter', 'Color Converter', 'developer', 'Native', 'Built-in', 'HEX, RGB and HSL with a live swatch.'),
  t('diff-checker', 'Text Diff Checker', 'developer', 'Native', 'Built-in', 'Compare two texts line by line.'),
  t('markdown-preview', 'Markdown Previewer', 'developer', 'Native', 'Built-in', 'Live Markdown to HTML preview.'),
];

export const toolUrl = (slug) => `/tools/${slug}`;
export const getTool = (slug) => TOOLS.find((x) => x.slug === slug);
export const catName = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

// Set once you create the GitHub repo, e.g. 'hassaan/opentoolbox'.
export const REPO = 'hassaan786/opentoolbox';
