import JSONEditor from 'jsoneditor';
import queryString from 'query-string';
import ReacoloDevModelSync from 'reacolo-dev-model-sync';
import 'jsoneditor/dist/jsoneditor.min.css';
import './app.css';

const TOAST_DURATION = 2200;
const has = Object.prototype.hasOwnProperty;

// Dirty deepEqual.
const deepEqual = (obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2);

// Shallow clone an object apart from the specified properties.
const cloneExcept = (obj, exceptions) =>
  Object.keys(obj).reduce((res, key) => {
    if (exceptions.indexOf(key) < 0) {
      res[key] = obj[key];
    }
    return res;
  }, {});

// Create a copy of an object containing only the specified properties.
const pick = (obj, keys) =>
  keys.reduce((res, k) => {
    if (has.call(obj, k)) {
      res[k] = obj[k];
    }
    return res;
  }, {});

// App's state values.
const STATES = {
  loading: Symbol('loading'),
  connected: Symbol('connected'),
  disconnected: Symbol('disconnected')
};


window.addEventListener('load', () => {
  // Fetch node elements.
  const contentDiv = document.getElementById('content');
  const errorDiv = document.getElementById('alert');

  let toastTimeOut;
  const toastError = (errorMsg) => {
    clearTimeout(toastTimeOut);
    errorDiv.innerHTML = errorMsg;
    errorDiv.classList.add('shown');
    toastTimeOut = setTimeout(() => {
      errorDiv.classList.remove('shown');
    }, TOAST_DURATION);
  };

  const modelSync = new ReacoloDevModelSync(
    `http://${location.host}/socket`,
    queryString.parse(location.search).role
  );

  // Update current state (changes what content is displayed).
  const setState = (newState) => {
    contentDiv.className = Object.keys(STATES).find(
      k => STATES[k] === newState
    );
  };

  const createEditor = ({ dataSetter, dataGetter, targetNode }) => {
    // Create the editor.
    const editor = new JSONEditor(targetNode, { mode: 'code' });

    // If true, any server updates will be ignored.
    let areServerUpdatesIgnored = false;
    let lastDataUpdateTime;

    // Create the handler called when new data arrive.
    const newDataHandler = (newData) => {
      if (areServerUpdatesIgnored) return;
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
    editor.options.onChange = () => {
      let newData;
      try {
        newData = editor.get();
      } catch (e) {
        return;
      }
      if (!deepEqual(dataGetter(), newData)) {
        const thisDataUpdateTime = Date.now();
        lastDataUpdateTime = thisDataUpdateTime;
        areServerUpdatesIgnored = true;
        dataSetter(newData)
          // eslint-disable-next-line no-console
          .then(() => console.log('server successfully updated'))
          .catch((err) => {
            // console.error('server update refused: ' + err.message);
            areServerUpdatesIgnored = false;
            toastError(err.message || err);
            return newDataHandler(dataGetter());
          })
          .then(() => {
            if (lastDataUpdateTime === thisDataUpdateTime) {
              areServerUpdatesIgnored = false;
            }
          });
      }
    };

    // Return the new data handler.
    return newDataHandler;
  };

  const newAppDataHandler = createEditor({
    targetNode: document.getElementById('app-data'),
    dataSetter: data => modelSync.setAppData(data),
    dataGetter: () => modelSync.data
  });

  // Context properties that should not be pushed to the server.
  const serverProps = ['roles', 'observers', 'clientRole'];

  const contextDataHandler = createEditor({
    targetNode: document.getElementById('context'),
    dataSetter(data) {
      if (
        !deepEqual(
          pick(data, serverProps),
          pick(modelSync.context, serverProps)
        )
      ) {
        return Promise.reject(
          new Error(
            'Context properties "roles", "observers" and "clientRole" cannot be modified.'
          )
        );
      }
      return modelSync.setMetaData(cloneExcept(data, serverProps));
    },
    dataGetter: () => modelSync.context
  });

  // Create the patch editor.
  const patchEditor = new JSONEditor(document.getElementById('patch-data'), {
    mode: 'code'
  });
  patchEditor.set([]);

  document.getElementById('send-patch-button').addEventListener('click', () => {
    const patch = patchEditor.get();
    patchEditor.set([]);
    modelSync.patchAppData(patch).catch((e) => {
      console.error(e);
      toastError(e.message || e);
    });
  });

  modelSync
    .start()
    .then(() => {
      newAppDataHandler(modelSync.data);
      contextDataHandler(modelSync.context);
      setState(STATES.connected);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error.message, error.stack);
      toastError(error.message);
      setState(STATES.disconnected);
    });
  modelSync.on(ReacoloDevModelSync.DATA_UPDATE, newAppDataHandler);
  modelSync.on(ReacoloDevModelSync.CONTEXT_UPDATE, contextDataHandler);
  modelSync.on(ReacoloDevModelSync.DISCONNECTED, () =>
    setState(STATES.disconnected)
  );
});
