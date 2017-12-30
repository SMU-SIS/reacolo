/* eslint-disable react/no-multi-comp */
import portalOrigin from './portal-origin.jsx';
import portalOut from './portal-out.jsx';

const getDisplayName = Component => Component.displayName || Component.name;

// Wrap a component and returns to new component.
// Origin is the wrapped component provided with the callbacks described by
// callbackNames.
// Out is an empty component (does not render), but when one of the callbacks
// of Origin is called, that's the corresponding callback property of Out that
// is called.
const portal = (
  WrappedComponent,
  callbackNames,
  portalId = `portal(${getDisplayName(WrappedComponent)})`,
) => {
  if (!portalId) {
    throw new Error(
      'Cannot infer an id for portal: wrapped component has no displayName and portalId is not provided',
    );
  }

  // Map each callback name with an event name.
  const callbackEvents = callbackNames.reduce(
    (result, callbackName) =>
      Object.assign(result, {
        [callbackName]: `${portalId}:${callbackName}`,
      }),
    {},
  );

  // Create the origin and the exit of the portal.
  return {
    Origin: portalOrigin(WrappedComponent, portalId, callbackEvents),
    Out: portalOut(WrappedComponent, portalId, callbackEvents),
  };
};

export default portal;
