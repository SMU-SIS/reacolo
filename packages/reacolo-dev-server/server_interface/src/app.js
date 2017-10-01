import queryString from 'query-string';
import ReacoloDevModel from 'reacolo-dev-model';
import createDataEditor from './data-editor';
import createPatchEditor from './patch-editor';
import createToast from './toast';
import './app.css';

const TOAST_DURATION = 2200;

window.addEventListener('load', () => {
  // Fetch node elements.
  const contentDiv = document.getElementById('content');

  // Create the model sync.
  const reacoloModel = new ReacoloDevModel(
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
    dataSetter: data => reacoloModel.setData(data),
    dataGetter: () => reacoloModel.data,
    onError: toastError
  });

  // Create the meta-data editor and get a function to handle new meta-data.
  const metaDataHandler = createDataEditor({
    targetNode: document.getElementById('meta-data'),
    dataSetter: () => Promise.reject(new Error('Meta-data cannot be updated.')),
    dataGetter: () => reacoloModel.metaData,
    readOnly: true,
    onError: toastError
  });

  // Create the patch editor.
  createPatchEditor({
    parent: document.getElementById('patch-data'),
    onPatch(patch) {
      reacoloModel
        .patchData(patch)
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          toastError(e);
        });
    }
  });

  // Connect model sync events.
  reacoloModel.on(ReacoloDevModel.DATA_UPDATE_EVT, newAppDataHandler);
  reacoloModel.on(ReacoloDevModel.META_DATA_UPDATE_EVT, metaDataHandler);
  reacoloModel.on(ReacoloDevModel.STATUS_UPDATE_EVT, (newStatus) => {
    setState(
      newStatus === ReacoloDevModel.CONNECTED_STATUS
        ? 'connected'
        : 'disconnected'
    );
  });

  // Start the model sync.
  reacoloModel
    .start()
    .then(() => {
      newAppDataHandler(reacoloModel.data);
      metaDataHandler(reacoloModel.metaData);
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
