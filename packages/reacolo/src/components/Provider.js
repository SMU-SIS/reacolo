import { Component } from 'react';
import propTypes from 'prop-types';
import { modelPropType } from '../utils/prop-types';

export default class Provider extends Component {
  constructor(props) {
    super(props);
    this.model = props.model;
  }
  getChildContext() {
    return { model: this.model };
  }
  componentWillReceiveProps(props) {
    if (props.model !== this.model) {
      throw new Error('<Provider> does not support changing the model.');
    }
  }
  render() {
    return this.props.children;
  }
}

Provider.childContextTypes = {
  // eslint-disable-next-line react/no-typos
  model: modelPropType.isRequired,
};

Provider.propTypes = {
  // eslint-disable-next-line react/no-typos
  model: modelPropType.isRequired,
  children: propTypes.element.isRequired,
};
