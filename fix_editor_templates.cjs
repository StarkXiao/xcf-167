const fs = require('fs');
const path = require('path');

const editorDir = path.join(__dirname, 'src/components/editor');

const helperFunctions = {
  NodeEditor: `  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }
  function textareaValue(e: Event): string { return (e.target as HTMLTextAreaElement).value; }

`,
  DanmakuEditor: `  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }

`,
  SfxEditor: `  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }

`,
  EndingEditor: `  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function textareaValue(e: Event): string { return (e.target as HTMLTextAreaElement).value; }

`
};

const replacements = [
  [/\(e\.target as HTMLInputElement\)\.value/g, 'inputValue(e)'],
  [/Number\(\(e\.target as HTMLInputElement\)\.value\)/g, 'inputNumber(e)'],
  [/\(e\.target as HTMLInputElement\)\.checked/g, 'inputChecked(e)'],
  [/\(e\.target as HTMLSelectElement\)\.value/g, 'selectValue(e)'],
  [/\(e\.target as HTMLTextAreaElement\)\.value/g, 'textareaValue(e)'],
  [/const v = inputValue\(e\);/g, 'const v = inputValue(e);'],
  [/const val = inputValue\(e\);/g, 'const val = inputValue(e);']
];

const files = ['NodeEditor.svelte', 'DanmakuEditor.svelte', 'SfxEditor.svelte', 'EndingEditor.svelte'];

for (const file of files) {
  const filePath = path.join(editorDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  const componentName = file.replace('.svelte', '');
  if (helperFunctions[componentName] && !content.includes('function inputValue(e: Event)')) {
    const lines = content.split('\n');
    const scriptStartIdx = lines.findIndex(l => l.startsWith('<script lang="ts">'));
    let insertIdx = -1;
    for (let i = scriptStartIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() !== '' && !line.startsWith('  import ')) {
        insertIdx = i;
        break;
      }
    }
    if (insertIdx > 0) {
      lines.splice(insertIdx, 0, helperFunctions[componentName]);
    }
    content = lines.join('\n');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Processed: ${file}`);
}

console.log('All files processed!');
