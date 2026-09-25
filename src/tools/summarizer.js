import { $ } from '../lib/ui.js';
import { textTool } from '../lib/text-tool.js';

const FORMAT = {
  bullets: 'as a list of bullet points starting with "- "',
  paragraph: 'as a single paragraph',
  tldr: 'as one sentence',
};
const LENGTH = { short: 'Be very brief (3 points or ~50 words at most).', medium: 'Keep it moderately short (5 points or ~100 words).', detailed: 'Cover every important point (up to 10 points or ~250 words).' };

textTool({
  options: () => ({ format: $('#format').value, length: $('#length').value }),
  system: ({ format, length }) =>
    `You summarize text accurately. Write the summary ${FORMAT[format]}. ${LENGTH[length]} Use only facts from the text. Write in the same language as the text. Output only the summary, with no introduction.`,
  temperature: 0.3,
});
