import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Badge,
  UncontrolledDropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Form,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Row
} from 'reactstrap';
import PropTypes from 'prop-types';
import axios from 'axios';

import { AppAsideToggler, AppNavbarBrand, AppSidebarToggler } from '@coreui/react';
import DefaultAside from './DefaultAside';
import logo from '../../assets/img/brand/logo.png';
import sygnet from '../../assets/img/brand/sygnet.svg';

const propTypes = {
  children: PropTypes.node
};

const defaultProps = {};

class DefaultHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      friendid: '',
      roomName: ''
    };
    this.toggle = this.toggle.bind(this);
    this.handleFriendChange = this.handleFriendChange.bind(this);
    this.handleRoomNameChange = this.handleRoomNameChange.bind(this);
    this.addFriend = this.addFriend.bind(this);
  }

  addFriend() {
    const reqData = {
      user: this.state.friendid,
      roomName: this.state.roomName
    };
    axios
      .post(reqData, `${global.config.backendURL}/api/user/adduser`, {
        headers: {
          'milaap-auth-token': localStorage.getItem('milaap-auth-token')
        }
      })
      .then((res) => {
        console.log(res);
        this.toggle();
        window.location.reload();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  handleFriendChange(e) {
    this.setState({
      friendid: e.target.value
    });
  }

  handleRoomNameChange(e) {
    this.setState({
      roomName: e.target.value
    });
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  render() {
    // eslint-disable-next-line
    const { children, ...attributes } = this.props;

    return (
      <React.Fragment>
        <AppAsideToggler className="d-md-down-none ml-auto" />
        {/* <AppAsideToggler className="d-lg-none" mobile /> */}
      </React.Fragment>
    );
  }
}

DefaultHeader.propTypes = propTypes;
DefaultHeader.defaultProps = defaultProps;

export default DefaultHeader;
