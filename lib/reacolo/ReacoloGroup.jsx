import React, { PureComponent } from 'react';

class ReacoloGroup extends PureComponent {
  selectFilter() {
    const props = this.props;
    const context = props.context;
    const children = React.Children.toArray(props.children);
    // Look for the first filters that pass.
    const selectedFilter = children
      .find((child) => {
        const childProps = Object.assign({}, child.props);
        // Remove the children from the considered properties (it is ignored, but still).
        delete childProps.children;
        return child.type.wouldRender(context, childProps);
      });
    // If no filter passed, look for a default filter.
    return selectedFilter || children.find(child => child.props.default);
  }
  render() {
    const selectedFilter = this.selectFilter();
    // Force the rendering of the selected filter and returns it.
    if (selectedFilter) {
      return React.cloneElement(selectedFilter, { override: true });
    }
    return null;
  }
}

export default ReacoloGroup;
