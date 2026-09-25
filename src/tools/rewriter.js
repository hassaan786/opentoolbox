import { $ } from '../lib/ui.js';
import { textTool } from '../lib/text-tool.js';

textTool({
  options: () => ({ tone: $('#tone').value }),
  system: ({ tone }) =>
    `You are an editor. Rewrite the user's text to make it ${tone}. Keep all facts, names and numbers. Keep the same language as the original. Output only the rewritten text, with no preamble.`,
  temperature: 0.5,
});
