import React, { Component, Fragment } from 'react';
import propTypes from 'prop-types';
import { modelPropType } from './utils';
import { MODEL_CONTEXT_KEY } from './constants';

/**
 * Provides the reacolo model as a context property. To be used with <Context>,
 * <Switch> and connect.
 */
export default class Provider extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }
  getChildContext() {
    return { [MODEL_CONTEXT_KEY]: this.model };
  }
  componentWillReceiveProps(props) {
    if (props.model !== this.model) {
      throw new Error('<Provider> does not support changing the model.');
    }
  }
  render() {
    return <Fragment>{this.props.children}</Fragment>;
  }
}

Provider.childContextTypes = {
  // eslint-disable-next-line react/no-typos
  [MODEL_CONTEXT_KEY]: modelPropType.isRequired,
};

Provider.propTypes = {
  // eslint-disable-next-line react/no-typos
  model: modelPropType.isRequired,
  children: propTypes.element.isRequired,
};
