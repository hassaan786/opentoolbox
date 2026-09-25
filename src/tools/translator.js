import { $ } from '../lib/ui.js';
import { textTool } from '../lib/text-tool.js';

textTool({
  options: () => ({ target: $('#target').value }),
  system: ({ target }) =>
    `You are a professional translator. Translate the user's text into ${target}. Keep the meaning, tone and formatting (line breaks, lists). Do not add notes or explanations. Output only the translation.`,
  temperature: 0.2,
});
