import { PythonEditorPlugin } from './languages/python/python-editor-plugin';

const pythonPlugin = new PythonEditorPlugin();
setTimeout(async () => {
  await pythonPlugin.register();
}, 0);
