import queryString from 'query-string';
import ReacoloDevModelSync from 'reacolo-dev-model-sync';
import createDataEditor from './data-editor';
import createPatchEditor from './patch-editor';
import createToast from './toast';
import './app.css';

const TOAST_DURATION = 2200;

window.addEventListener('load', () => {
  // Fetch node elements.
  const contentDiv = document.getElementById('content');

  // Create the model sync.
  const modelSync = new ReacoloDevModelSync(
    `http://${location.host}/socket`,
    queryString.parse(location.search).role
  );

  // Function to toast errors.
  const toastError = (() => {
    const toast = createToast(document.getElementById('alert'), TOAST_DURATION);
    return error => toast(error.message || error);
  })();

  // Function to update the current state (changes what content is displayed).
  const setState = (newState) => {
    contentDiv.className = newState;
  };

  // Create the data editor and get a function to handle new data.
  const newAppDataHandler = createDataEditor({
    targetNode: document.getElementById('app-data'),
    dataSetter: data => modelSync.setData(data),
    dataGetter: () => modelSync.data,
    onError: toastError
  });

  // Create the meta-data editor and get a function to handle new meta-data.
  const metaDataHandler = createDataEditor({
    targetNode: document.getElementById('meta-data'),
    dataSetter: () => Promise.reject(new Error('Meta-data cannot be updated.')),
    dataGetter: () => modelSync.metaData,
    readOnly: true,
    onError: toastError
  });

  // Create the patch editor.
  createPatchEditor({
    parent: document.getElementById('patch-data'),
    onPatch(patch) {
      modelSync
        .patchAppData(patch)
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          toastError(e);
        });
    }
  });

  // Connect model sync events.
  modelSync.on(ReacoloDevModelSync.DATA_UPDATE_EVT, newAppDataHandler);
  modelSync.on(ReacoloDevModelSync.META_DATA_UPDATE_EVT, metaDataHandler);
  modelSync.on(ReacoloDevModelSync.STATUS_UPDATE_EVT, (newStatus) => {
    setState(
      newStatus === ReacoloDevModelSync.CONNECTED_STATUS
        ? 'connected'
        : 'disconnected'
    );
  });

  // Start the model sync.
  modelSync
    .start()
    .then(() => {
      newAppDataHandler(modelSync.data);
      metaDataHandler(modelSync.metaData);
      setState('connected');
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error.message, error.stack);
      toastError(error);
      setState('disconnected');
    });

  setState('connecting');
});
