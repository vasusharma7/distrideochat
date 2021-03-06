import React, { Component } from 'react';
import Compose from '../Compose';
import Toolbar from '../Toolbar';
import ToolbarButton from '../ToolbarButton';
import Message from '../Message';
import moment from 'moment';
import socketIOClient from 'socket.io-client';
import { connect } from 'react-redux';
import './MessageList.css';

const socket = socketIOClient(`${global.config.backendURL}/`);

class MessageList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      MY_USER_ID: this.props.username,
      messages: this.props.msgs,
      change: false,
      lastMsgId: 0
    };
  }

  componentDidMount() {
    this.setState({
      messages: this.props.msgs
    });
    socket.on('newMessage', (data) => {
      console.log('New Message Arrived', data, this.state.MY_USER_ID);

      if (
        this.props.roomName !== 'dashboard' &&
        this.props.roomName == data['room'] &&
        this.state.messages !== undefined &&
        this.state.MY_USER_ID !== data['sender']
      )
        this.fetchMessages(true, data);
    });
  }

  componentDidUpdate(prevProps) {
    window.scrollTo(0, document.querySelector('#message-list').scrollHeight);
    if (prevProps.roomName !== this.props.roomName) {
      this.setState({
        messages: this.props.msgs
      });
      this.init();
    }
  }

  formatMsgs(tempMsg, update = false) {
    let formattedMsgs = this.state.messages;
    if (update) formattedMsgs = [];
    tempMsg.forEach((val, index) => {
      let formattedMsg = {};
      formattedMsg.id = val.id;
      formattedMsg.sender = val.sender;
      formattedMsg.msg = val.msg;
      formattedMsg.timestamp = new Date().getTime();
      formattedMsgs.push(formattedMsg);
    });
    return formattedMsgs;
  }

  init = () => {
    // axios
    //   .get('http://localhost:5000/api/user/getUserName', {
    //     headers: {
    //       'milaap-auth-token': localStorage.getItem('milaap-auth-token')
    //     }
    //   })
    //   .then((resp) => {
    //     this.setState({
    //       MY_USER_ID: resp.data.username
    //     });
    //   })
    //   .catch((err) => {
    //     console.log(err, 'Error in Verifying JWT');
    //   });
  };

  getReqData = () => {
    // console.clear()
    let messages = this.state.messages;
    return {
      roomName: this.props.roomName,
      lastMsgId:
        messages && messages.length > 0 ? messages[messages.length - 1].id + 1 : -1
    };
  };

  fetchMessages = (change = false, data) => {
    let messages = this.state.messages;
    delete data['room'];
    if (
      messages !== undefined &&
      messages !== null &&
      data !== undefined &&
      data !== null
    ) {
      console.log('Inside');
      var msg = messages;
      msg.push(data);
      this.setState({
        messages: msg
      });
    }
    console.log('Inside fetch Message', this.state.messages, data);
    return;
  };

  renderMessages = () => {
    // console.clear()
    let messages = this.state.messages;
    if (!messages) {
      console.log('no messages');
      return;
    }
    console.log(messages);
    console.log(messages.length);
    let i = 0;
    const messageCount = messages.length;
    const tempMessages = [];
    while (i < messageCount) {
      const previous = messages[i - 1];
      const current = messages[i];
      const next = messages[i + 1];
      const isMine = current.sender === this.state.MY_USER_ID;
      const currentMoment = moment(current.timestamp);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;

      if (previous) {
        const previousMoment = moment(previous.timestamp);
        const previousDuration = moment.duration(currentMoment.diff(previousMoment));
        prevBySameAuthor = previous.author === current.author;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
        }
      }

      if (next) {
        const nextMoment = moment(next.timestamp);
        const nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.author === current.author;

        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }
      if (messageCount == 1) endsSequence = false;
      tempMessages.push(
        <Message
          key={i}
          isMine={isMine}
          startsSequence={startsSequence}
          endsSequence={endsSequence}
          showTimestamp={showTimestamp}
          data={current}
        />
      );

      // Proceed to the next message.
      i += 1;

      // console.log(current);
    }
    console.log(tempMessages);
    return tempMessages;
  };

  updateMsg = (msgObject) => {
    let newMsgs = [msgObject];
    let newFormattedMsg = this.formatMsgs(newMsgs, true);
    newMsgs = this.state.messages.concat(newFormattedMsg);
    this.setState({
      messages: newMsgs
    });
  };

  render() {
    return (
      <div className="message-list bg-dark">
        <Toolbar
          title={this.props.roomName}
          /*
      rightItems={[
        <ToolbarButton key="info" icon="ion-ios-information-circle-outline" />,
        <ToolbarButton key="video" icon="ion-ios-videocam" />,
        <ToolbarButton key="phone" icon="ion-ios-call" />
      ]}
             */
        />

        <div className="message-list-container bg-dark" id="message-list">
          {this.renderMessages()}
        </div>

        <Compose
          rightItems={[
            <ToolbarButton key="photo" icon="ion-ios-camera" />,
            <ToolbarButton key="image" icon="ion-ios-image" />,
            <ToolbarButton key="audio" icon="ion-ios-mic" />,
            <ToolbarButton key="money" icon="ion-ios-card" />,
            <ToolbarButton key="games" icon="ion-logo-game-controller-b" />,
            <ToolbarButton key="emoji" icon="ion-ios-happy" />
          ]}
          roomName={this.props.roomName}
          callback={this.updateMsg}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  console.log(state);
  return {
    username: state.loginReducer.username
  };
};

export default connect(mapStateToProps)(MessageList);
