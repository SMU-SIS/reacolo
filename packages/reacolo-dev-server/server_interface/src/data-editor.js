import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import deepEqual from 'lodash/isEqual';
import filterValues from './filter-values';

export default ({ dataSetter, dataGetter, targetNode, onError, readOnly }) => {
  let editor;
  let lastDataUpdateTime;
  let ignoreUpdates = false;

  // Create the handler called when new data arrive.
  const dataHandler = (newData = {}) => {
    if (ignoreUpdates) return;
    let editorData;
    try {
      editorData = editor.get();
    } catch (e) {
      editorData = undefined;
    }
    if (
      !editorData ||
      !deepEqual(
        editorData,
        // Undefined properties are not representable as json so we need to
        // remove them or they would invalid the comparison.
        filterValues(newData, x => x !== undefined)
      )
    ) {
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
          return dataHandler(dataGetter());
        })
        .then((updatedData) => {
          if (lastDataUpdateTime === thisDataUpdateTime) {
            ignoreUpdates = false;
            dataHandler(updatedData);
          }
        });
    }
  };

  // Create the editor.
  editor = new JSONEditor(
    targetNode.getElementsByClassName('editor-content')[0],
    {
      mode: 'code',
      onChange,
      onEditable: readOnly ? () => false : undefined
    }
  );

  // Return the new data handler.
  return dataHandler;
};
