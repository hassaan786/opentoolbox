import { $ } from '../lib/ui.js';
import { textTool } from '../lib/text-tool.js';

textTool({
  options: () => ({ variant: $('#variant').value }),
  system: ({ variant }) =>
    `You are a careful proofreader. Correct spelling, grammar and punctuation in the user's text using ${variant} English conventions. Keep the author's wording, meaning, tone and formatting; change only what is wrong. Output only the corrected text, with no explanation or preamble.`,
  temperature: 0.1,
});
