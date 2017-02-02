import React from 'react';
import except from 'except';
import Context from './Context';
import wouldPass from './filtering/would-pass';

const OMITTED_CONTEXT_PROPS_FROM_TARGETS = ['default', 'children'];
const getTargetsFromProps = props => except(props, OMITTED_CONTEXT_PROPS_FROM_TARGETS);

const lookupFilters = (children, context) => {
  // Look for the first filters that passes.
  const passingChild = children
    .find(child => wouldPass(context, getTargetsFromProps(child.props)));
  // If no filter passed, look for a default filter.
  const selectedChild = passingChild || children.find(child => child.props.default);

  // If nothing have been selected, return.
  if (!selectedChild) return undefined;

  const selectionsChildren = selectedChild.props.children;

  // Else, look at the first children to check if there is nested filters.
  const selectionsChildrenArray = React.Children.toArray(selectionsChildren);

  if (selectionsChildrenArray[0]) {
    if (selectionsChildrenArray[0].type === Context) {
      // And if it is the case, recursively call selectFilter on these children.
      return lookupFilters(selectionsChildrenArray, context);
    }
    return React.Children.only(selectionsChildren);
  }
  return undefined;
};

const Filter = ({ children, context }) => lookupFilters(React.Children.toArray(children), context)
  || null;

export default Filter;
