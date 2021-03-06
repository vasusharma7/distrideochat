import React, { Component } from 'react';
import './Room.css';
import { connect } from 'react-redux';
import { Container, Row } from 'reactstrap';
import * as action from '../../redux/roomRedux/roomAction';
import DefaultAside from '../../containers/DefaultLayout/DefaultAside';
import { Peer, switchContext, createVideoElement } from '../Connection/Connect';
import {
  getMyMediaStream,
  startCall,
  endCall,
  addScreenShareStream
} from '../Connection/Connect';

class Room extends Component {
  constructor(props) {
    super(props);

    const roomName = props.match.params.roomname;
    console.log(Peer);
    console.log(roomName);
    this.state = {
      roomName: roomName,
      peer: null
    };
    this.props.enterRoom(roomName);
    //this.startCall = this.startCall.bind(this);
    this.startCall1 = this.startCall1.bind(this);
    //this.endCall = this.endCall.bind(this);
    this.submitVideoHandler = this.submitVideoHandler.bind(this);
    this.submitScreenHandler = this.submitScreenHandler.bind(this);
    this.endCallHandler = this.endCallHandler.bind(this);
    this.inCallShareHandler = this.inCallShareHandler.bind(this);
    //this.getMyMediaStream = this.getMyMediaStream.bind(this);
    //this.createVideoElement = this.createVideoElement.bind(this);
  }

  /*
  startCall() {
    getMyMediaStream(this, 'video').then((media) => {
      console.log('here');
      var peer = new Peer(true, this.state.myMediaStreamObj, this.state.roomName);
      this.setState({ peer: peer });
      return;
    });
  }
  */
  submitVideoHandler() {
    startCall(this, this.state.roomName, 'video');
  }
  submitScreenHandler() {
    startCall(this, this.state.roomName, 'screen');
  }
  inCallShareHandler() {
    addScreenShareStream(this);
  }

  endCallHandler() {
    endCall(this);
  }

  startCall1() {
    getMyMediaStream(this, 'screen').then((media) => {
      console.log('here');
      var peer = new Peer(true, this.state.myMediaStreamObj, this.state.roomName);
      this.setState({ peer: peer });
      return;
    });
  }
  /*
  endCall() {
    console.log(this.state);
    this.state.myMediaStreamObj.getTracks().forEach((track) => track.stop());
    this.state.peer.peer.destroy();
  }
  */

  componentDidUpdate(prevProps) {
    if (this.props.match.params.roomname !== prevProps.match.params.roomname) {
      this.setState(
        {
          roomName: this.props.match.params.roomname
        }

        /*
        () => {
          store.addNotification({
            title: 'Room changed',
            message: `Entered ${this.state.roomName} `,
            type: 'success',
            // insert: "top",
            container: 'top-right',
            animationIn: ['animated', 'fadeIn'],
            animationOut: ['animated', 'fadeOut'],
            dismiss: {
              duration: 3000,
              pauseOnHover: true
            }
          });
        }
        */
      );
      this.props.enterRoom(this.props.match.params.roomname);
    }
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>;

  render() {
    console.log(this.props);
    return (
      <div class="app-body" id="inner-aside-container">
        <main class="main">
          <Container className="room">
            <video id="context" controls autoPlay></video>
            <Row className="m-0 p-0" id="videos"></Row>
            {/*
            <button onClick={this.submitVideoHandler}>Start Call </button>
            <button onClick={this.submitScreenHandler}>Screen Call </button>
            <button onClick={this.endCallHandler}>End Call </button>
            <button onClick={this.inCallShareHandler}>CallScreenShare </button>
            */}
          </Container>
        </main>
        <aside className="aside-menu bg-dark" display="md">
          <DefaultAside
            roomName={this.props.roomName}
            msgs={this.props.msgs}
            users={this.props.users}
            guests={this.props.guests}
            loading={this.props.loading}
          />
        </aside>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  console.log(state);
  return {
    roomName: state.roomReducer.currentRoom,
    guests: state.roomReducer.guests,
    users: state.roomReducer.users,
    msgs: state.roomReducer.msgs,
    loading: state.roomReducer.loading
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    enterRoom: (room) => dispatch(action.enterRoom(room))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Room);
