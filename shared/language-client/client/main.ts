import { PythonEditorPlugin } from './languages/python/python-editor-plugin';
import { PythonPlugin } from '../server/plugins/python/python-plugin';

const pythonPlugin = new PythonPlugin();
setTimeout(async () => {
    await pythonPlugin.init();
}, 0);