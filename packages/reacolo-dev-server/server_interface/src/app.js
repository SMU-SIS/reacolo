import queryString from 'query-string';
import omit from 'lodash/omit';
import * as reacoloDevModel from 'reacolo-dev-model';
import createDataEditor from './data-editor';
import createPatchEditor from './patch-editor';
import createToast from './toast';
import './app.scss';

const TOAST_DURATION = 2200;
const READONLY_CONTEXT_PROPERTIES = ['observers', 'roles', 'clientRole'];


window.addEventListener('load', () => {
  // Fetch node elements.
  const contentDiv = document.getElementById('content');

  // Create the model sync.
  const reacoloModel = reacoloDevModel.create(
    `http://${location.host}/socket`,
    queryString.parse(location.search).role
  );

  // Function to toast errors.
  const toastError = (() => {
    const toast = createToast(document.getElementById('alert'), TOAST_DURATION);
    return error => toast(error.message || error);
  })();

  // Create the data editor and get a function to handle new data.
  const newStateHandler = createDataEditor({
    targetNode: document.getElementById('state-editor'),
    dataSetter: state => reacoloModel.setState(state),
    dataGetter: () => reacoloModel.getState(),
    onError: toastError
  });

  // Create the meta-data editor and get a function to handle new meta-data.
  const contextHandler = createDataEditor({
    targetNode: document.getElementById('context-editor'),
    dataSetter: context =>
      reacoloModel.setContext(omit(context, READONLY_CONTEXT_PROPERTIES)),
    dataGetter: () => reacoloModel.getContext(),
    onError: toastError
  });

  // Create the patch editor.
  createPatchEditor({
    parent: document.getElementById('patch-editor'),
    onPatch(patch) {
      reacoloModel
        .patchState(patch)
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          toastError(e);
        });
    }
  });

  // Connect model sync events.
  reacoloModel.addListener(reacoloDevModel.MODEL_UPDATE_EVT, () => {
    newStateHandler(reacoloModel.getState());
    contextHandler(reacoloModel.getContext());
  });
  reacoloModel.addListener(reacoloDevModel.STATUS_UPDATE_EVT, (newStatus) => {
    contentDiv.className = newStatus;
  });

  // Start the model sync.
  reacoloModel
    .start()
    .then(() => {
      newStateHandler(reacoloModel.getState());
      contextHandler(reacoloModel.getContext());
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error.message, error.stack);
      toastError(error);
    });

  contentDiv.className = reacoloModel.getStatus();
});
