// Re-encoding through a canvas keeps only pixels: EXIF, GPS, XMP and IPTC are dropped.
// createImageBitmap with imageOrientation 'from-image' bakes in EXIF rotation first, so photos stay upright.
import { canvasToBlob, baseName } from '../lib/ui.js';
import { extFor } from '../lib/batch.js';
import { imageBatchTool } from '../lib/image-batch-tool.js';

imageBatchTool(async (file) => {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const c = document.createElement('canvas');
  c.width = bmp.width; c.height = bmp.height;
  c.getContext('2d').drawImage(bmp, 0, 0);
  bmp.close();
  const type = ['image/jpeg', 'image/webp', 'image/png'].includes(file.type) ? file.type : 'image/jpeg';
  const blob = await canvasToBlob(c, type, 0.95);
  return { blob, name: `${baseName(file.name)}-clean.${extFor(type)}` };
}, 'clean-photos.zip');
