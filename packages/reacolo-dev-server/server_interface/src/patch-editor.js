import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';

export default ({ parent, onPatch }) => {
  const patchEditor = new JSONEditor(parent, {
    mode: 'code'
  });
  patchEditor.set([]);

  document.getElementById('send-patch-button').addEventListener('click', () => {
    const patch = patchEditor.get();
    onPatch(patch);
    patchEditor.set([]);
  });
};
