import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

export default ({ parent, onPatch, defaultContent = {} }) => {
  const patchEditor = new JSONEditor(
    parent.getElementsByClassName('editor-content')[0],
    { mode: 'code' }
  );
  patchEditor.set(defaultContent);

  parent
    .getElementsByClassName('send-patch-button')[0]
    .addEventListener('click', () => {
      const patch = patchEditor.get();
      onPatch(patch);
      patchEditor.set(defaultContent);
    });
};
