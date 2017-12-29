import queryString from 'query-string';
import omit from 'lodash/omit';
import * as reacoloDevModel from '@reacolo/dev-model';
import createDataEditor from './data-editor';
import createPatchEditor from './patch-editor';
import createToast from './toast';
import './app.scss';

const TOAST_DURATION = 2200;
const READONLY_CONTEXT_PROPERTIES = [
  'observers',
  'roles',
  'clientRole',
  'modelStatus',
];

window.addEventListener('load', () => {
  // Fetch node elements.
  const contentDiv = document.getElementById('content');

  // Create the model sync.
  const reacoloModel = reacoloDevModel.create(
    `http://${window.location.host}/socket`,
    queryString.parse(window.location.search).role,
  );

  // Function to toast errors.
  const toastError = (() => {
    const toast = createToast(document.getElementById('alert'), TOAST_DURATION);
    return error => toast(error.message || error);
  })();

  // Create the data editor and get a function to handle new data.
  const newStoreHandler = createDataEditor({
    targetNode: document.getElementById('store-editor'),
    dataSetter: store => reacoloModel.setStore(store),
    dataGetter: () => reacoloModel.getStore(),
    onError: toastError,
  });

  // Create the meta-data editor and get a function to handle new meta-data.
  const contextHandler = createDataEditor({
    targetNode: document.getElementById('context-editor'),
    dataSetter: context =>
      reacoloModel.setContext(omit(context, READONLY_CONTEXT_PROPERTIES)),
    dataGetter: () => reacoloModel.getContext(),
    onError: toastError,
  });

  // Create the patch editor.
  createPatchEditor({
    parent: document.getElementById('patch-editor'),
    onPatch(patch) {
      reacoloModel.patchStore(patch).catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
        toastError(e);
      });
    },
    defaultContent: [],
  });

  // Create the merge patch editor.
  createPatchEditor({
    parent: document.getElementById('merge-patch-editor'),
    onPatch(patch) {
      reacoloModel.mergeStore(patch).catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
        toastError(e);
      });
    },
  });

  // Connect model sync events.
  reacoloModel.addListener(reacoloDevModel.MODEL_UPDATE_EVT, () => {
    newStoreHandler(reacoloModel.getStore());
    contextHandler(reacoloModel.getContext());
    contentDiv.className = reacoloModel.getContext().status;
  });

  // Start the model sync.
  reacoloModel
    .start()
    .then(() => {
      newStoreHandler(reacoloModel.getStore());
      contextHandler(reacoloModel.getContext());
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error.message, error.stack);
      toastError(error);
    });

  contentDiv.className = reacoloModel.getContext().status;
});
