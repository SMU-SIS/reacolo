import React from 'react';
import wouldPass from './filtering/would-pass.js';

// Try to find a context that passes amongst the providen children.
const lookupContexts = (children, context) => {
  // Look for the first contexts that passes.
  const passingChild = children
    .find(child => child.type.getTargets && wouldPass(context, child.type.getTargets(child)));
  // If no context passed, look for a default context.
  const selectedChild = passingChild ||
    children.find(child => child.type.isDefault && child.type.isDefault(child));

  // If nothing have been selected, return.
  if (!selectedChild) return undefined;

  const selectionsChildren = selectedChild.props.children;

  // Else, look at the first children to check if there is nested contexts.
  const selectionsChildrenArray = React.Children.toArray(selectionsChildren);

  if (selectionsChildrenArray[0]) {
    if (selectionsChildrenArray[0].type.isContext) {
      // And if it is the case, recursively call lookupContexts on these children.
      return lookupContexts(selectionsChildrenArray, context);
    }
    return React.Children.only(selectionsChildren);
  }
  return undefined;
};

const ContextSwitch = ({ children, context }) => lookupContexts(
  React.Children.toArray(children),
  context
) || null;

export default ContextSwitch;
