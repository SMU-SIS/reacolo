import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';
import deepEqual from 'deep-equal';

export default ({ dataSetter, dataGetter, targetNode, onError, readOnly }) => {
  let editor;
  let lastDataUpdateTime;
  let ignoreUpdates = false;

  // Create the handler called when new data arrive.
  const newDataHandler = (newData = {}) => {
    if (ignoreUpdates) return;
    let editorData;
    try {
      editorData = editor.get();
    } catch (e) {
      editorData = undefined;
    }
    if (!editorData || !deepEqual(editorData, newData)) {
      editor.set(newData);
    }
  };

  // Create the handler called when the editor is edited.
  const onChange = () => {
    let newData;
    try {
      newData = editor.get();
    } catch (e) {
      return;
    }
    const data = dataGetter();
    if (!deepEqual(data == null ? {} : data, newData)) {
      const thisDataUpdateTime = Date.now();
      lastDataUpdateTime = thisDataUpdateTime;
      ignoreUpdates = true;
      dataSetter(newData)
        .catch((err) => {
          ignoreUpdates = false;
          onError(err);
          return newDataHandler(dataGetter());
        })
        .then(() => {
          if (lastDataUpdateTime === thisDataUpdateTime) {
            ignoreUpdates = false;
          }
        });
    }
  };

  // Create the editor.
  editor = new JSONEditor(targetNode, {
    mode: 'code',
    onChange,
    onEditable: readOnly ? () => false : undefined
  });

  // Return the new data handler.
  return newDataHandler;
};
