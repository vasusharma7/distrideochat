import socketIOClient from "socket.io-client";
import React, { Component } from "react";
import { store } from "react-notifications-component";
import { AwesomeButtonProgress } from "react-awesome-button";
import "react-awesome-button/dist/styles.css";
import { Nav, NavItem, NavLink, Progress, TabContent, TabPane, ListGroup, ListGroupItem,
	Spinner } from "reactstrap";
import classNames from "classnames";
import { AppSwitch } from "@coreui/react";
import MessageView from "../../views/MessageList/index";
import { Jumbotron, Button, ButtonGroup, Badge, Card, CardBody, CardFooter,
	CardHeader, Col, Container, Row, Collapse, Fade, } from "reactstrap";
//import Peer from "../../dependencies/peerjs/index.d.ts";
import Peer from "peerjs";
import axios from "axios";
import $ from "jquery";
import "./Controls.css";
const socket = socketIOClient("http://localhost:5000/");

class Controls extends Component {
	getActive = () => {
		axios
			.post(
				"http://localhost:5000/api/room/getActive",
				{
					roomName: this.props.roomName,
				},
				{
					headers: {
						"milaap-auth-token": localStorage.getItem("milaap-auth-token"),
					},
				}
			)
			.then((res) => {
				if (!res.data.active.length) return;
				//this.setState({ active: res.data.active });
			})
			.catch((err) => {
				console.log(err);
			});
	};
	constructor(props) {
		super(props);
		this.state = {
			myIds: [0, 0],
			myPeers: [0, 0],
			roomName: this.props.roomName,
			//Use Sets instead of Arrays to prevent duplicates.
			remotePeers: new Set(),
			remotePeersID: new Set(),
			calls: new Array(),
			connectedPeers: new Set(),
			opinfo: "",
			friendtkn: "",
		};
		console.log(this.state.roomName);
		this.startScreenShare = this.startScreenShare.bind(this);
		this.startConnection = this.startConnection.bind(this);
		this.sendCallEndedSignal = this.sendCallEndedSignal.bind(this);

		/* TODO:  Move Call to appropriate position, and replace by generalized call.*/
		if (this.state.roomName !== "dashboard") this.getActive();

		socket.on("userJoined", (data) => {
			if (this.state.roomName !== "dashboard")
				//YET TO BE TESTED
				this.getActive();
		});
		socket.on("userOnline", (data) => {
			if (this.state.roomName !== "dashboard") this.getActive();
		});
		socket.on("userExit", (data) => {
			if (this.state.roomName !== "dashboard") this.getActive();
		});
		this.endCall = this.endCall.bind(this);
	}

	componentWillUnmount() {
		this.endCall(() => console.log("Call ended"));
	}

	componentDidUpdate(prevProps) {
    console.log(prevProps);
    console.log(this.props.roomName);
		if (this.props.roomName != prevProps.roomName) {
      this.setState({
        roomName: this.props.roomName,
      });
			axios
				.post(
					"http://localhost:5000/api/room/getActive",
					{
						roomName: this.props.roomName,
					},
					{
						headers: {
							"milaap-auth-token": localStorage.getItem("milaap-auth-token"),
						},
					}
				)
				.then((res) => {
					if (!res.data.active.length || res.data.active == this.state.active)
					this.setState({
						active: res.data.active,
					});
				  return;
				})
				.catch((err) => {
					console.log(err);
				});
		}
	}

	createNotif = (title, msg, type) => {
		store.addNotification({
			title: title,
			message: msg,
			type: type,
			container: "top-right",
			animationIn: ["animated", "fadeIn"],
			animationOut: ["animated", "fadeOut"],
			dismiss: {
				duration: 3000,
				pauseOnHover: true,
			},
		});
	};

	switchContext = (e) => {
		try {
			let context = document.getElementById("context");
			context.srcObject = e.target.srcObject;
			context.play();
		} catch (err) {
			console.log("The selected stream is old");
		}
	};

	createPeer(id) {
		var peer = new Peer(id, {
      host: 'localhost',
      port: 9000,
      path: '/peerserver',
			config: {
				iceServers: [
					{ urls: "stun:stun.l.google.com:19302" },
					{
						url: "turn:numb.viagenie.ca",
						credential: "HWeF3pu@u2RfeYD",
						username: "veddandekar6@gmail.com",
					},
				],
			} /* Sample servers, please use appropriate ones */,
		});
		return peer;
	}

  updateSelfPeerInfo(self, peer, id, type) {
    console.log(self.state);
    var id = peer.id;
    console.log(id);
    var isVideo = (type === "video") ? 1 : 0;
    if(self.state.myPeers[isVideo] != 0) {
      self.state.myPeers[isVideo].destroy();
    }
    self.deleteAllVideoElements();
    var peers = self.state.myPeers;
    var myIDs = self.state.myIds;
    peers[isVideo] = peer;
    myIDs[isVideo] = id;
    self.setState({
      myPeers: peers,
      myIds: myIDs,
      calls: new Array(),
    });
  }

	async startScreenShare(type, next) {
		const self = this;
		var tkn;
		//Get a new peerId.
		var peer = self.createPeer();

		//Upload the PeerID to the server, get an old ID, if it exists to be used
		await peer.on("open", function (id) {
			tkn = id;
			const reqData = {
				roomName: self.state.roomName,
				tkn: tkn,
				type: type,
			};
			axios
				.post("http://localhost:5000/api/room/goonline", reqData, {
					headers: {
						"milaap-auth-token": localStorage.getItem("milaap-auth-token"),
					},
				})
				.then((res) => {
					console.log(res);
					var onlineArray = res.data.online;
					if (res.data.changePeer) {
            //Kept for backward compatibility. Will not execute with latest commit.
						peer.destroy();
						peer = self.createPeer(res.data.changePeer);
						console.log(peer.disconnected);
						console.log("Using old Id");
						console.log(peer.connections);
						if (peer.disconnected) {
							peer.reconnect();
							console.log("peer was disconnected, reconnecting...");
							peer.on("open", function (id) {
								console.log("reconnected");
								console.log("My token: " + id);
								console.log("using older id: " + id);
								self.setUpConnections(self, peer, id, type, onlineArray);
							});
						} else {
							peer.reconnect();
							self.setUpConnections(self, peer, id, type, onlineArray);
						}
						next();
					} else {
						console.log("My token: " + id);
            self.updateSelfPeerInfo(self, peer, id, type);
            /*
						var peers = self.state.myPeers;
						var myIDs = self.state.myIds;
						peers.add(peer);
						myIDs.add(id);
						self.setState({
							myPeers: peers,
							myIds: myIDs,
						});
            */
						console.log(self.state);
						self.setUpConnections(self, peer, id, type, onlineArray);
						next();
					}
				})
				.catch((err) => {
					console.log(err);
					next(false, "Failed");
				});
		});
	}

	setUpConnections(self, peer, id, type, onlineArray) {
		self.getMyMediaStream(self, type).then((media) => {
			// Wait for new incoming connections.
			self.waitForConnections(self, peer);

			// Make requests to currently online users.
			axios
				.get("http://localhost:5000/api/user/getUserName", {
					headers: {
						"milaap-auth-token": localStorage.getItem("milaap-auth-token"),
					},
				})
				.then((resp) => {
					console.log(resp.data);
					onlineArray.forEach((val, index) => {
						if (val.username === resp.data.username && val.type === type) {
              return;
						}
						console.log("Connecting to " + onlineArray[index].tkn);
						self.startConnection(self, onlineArray[index].tkn, peer);
					});
				})
				.catch((err) => {
					console.log(err, "Error in Verifying JWT");
				});
		});
	}

	// Function to get the media stream for the user and store it in state so that it
	// can be used multiple times without requiring permission.
	async getMyMediaStream(self, type) {
		if (type == "screen") {
			//TODO: Add try catch to handle case when user denies access

			await navigator.mediaDevices
				.getDisplayMedia({
					video: { width: 1024, height: 576 },
					audio: true,
				})
				.then((media) => {
					self.setState({
						myMediaStreamObj: media,
					});
					self.createVideoElement(self, media, "me");
					return media;
				});
		} else if (type == "video") {
			//TODO: Add try catch to handle case when user denies access

			await navigator.mediaDevices
				.getUserMedia({
					video: { width: 1024, height: 576 },
					audio: true,
				})
				.then((media) => {
					self.setState({
						myMediaStreamObj: media,
					});
					self.createVideoElement(self, media, "me");
					return media;
				});
		}
	}

	// Asynchronous function to start a connection to peer with ID friendtkn.
	// The media stream to be used is chosen from this.state.myMediaStreamObj
	async startConnection(self, friendtkn, peer) {
		console.log("starting connection with " + friendtkn);
		//console.log(friendtkn);
		var mediaa = self.state.myMediaStreamObj;
		console.log(mediaa);
		self.sendMediaStream(self, peer, mediaa, friendtkn, false);
		/*
    var connectedPeers = self.state.connectedPeers;
    connectedPeers.add(friendtkn);
    self.setState({
      connectedPeers: connectedPeers,
    });
    */
	}

	// Function to wait for incoming requests onf 'peer' and handle them.
	waitForConnections(self, peer) {
		console.log("Waiting for connections....");
		var mediaa = self.state.myMediaStreamObj;
		peer.on("call", function (call) {
			self.sendMediaStream(self, peer, mediaa, null, true, call);
			/* This logic just hides the duplicate connections. For better performance.
			 * Duplicate connections should be closed. */
			//calls.add(thiscall);
			/*
var calls = self.state.calls;
console.log(calls);
var duplicateCall = false;
calls.forEach((val, index) => {
        console.log('checking with ' + val.peer);
        if(val.peer == call.peer) {
                duplicateCall = val;
                return;
        }
});
if(duplicateCall) {
        console.log('closing a duplicate call.');
        console.log(duplicateCall.peer);
  //      calls.delete(duplicateCall);
        duplicateCall.close();
}
//calls.add(call);
console.log(calls);
self.setState(
  {
    //call: peer.call(friendtkn, media),//to be updated appropriately
    calls: [...self.state.calls, call],
    //calls: calls,
  },
);
      */
			/*
      var connectedPeers = self.state.connectedPeers;
      connectedPeers.add(call.peer);
      self.setState({
        connectedPeers: connectedPeers,
      });
      */
		});
	}

	// Function to send the mediaStream passed through media. if isAnswer is true,
	// the mediaStream is sent as an answer to the 'call' object, otherwise a new call is created.
	sendMediaStream(self, peer, media, friendtkn, isAnswer, call) {
		var friendtkn;
		if (isAnswer) {
			friendtkn = call.peer;
			console.log("Connected to " + friendtkn);
			this.createNotif("Member joined", `${friendtkn} joined the call`, "info");
		}
		var tracks = media.getTracks();
		var track = tracks[0];
		var thiscall = call;

		// triggered when our stream being sent ends.
		track.addEventListener("ended", () => {
			console.log("My stream ended. Please show this");
			thiscall.close();
      self.deleteVideoElement(thiscall.peer);
			//self.sendRequestToEndCall();
			//self.startConnection(friendtkn, peer, self);
		});

		//Can't figure out the exact conditions which cause this event to be handled,
		//but this handler maybe useful, if we are enabling and disabling streams.
		track.addEventListener("mute", () => {
			console.log("My stream muted. Please show this");
		});

		if (isAnswer) {
			thiscall.answer(media);
		} else {
			thiscall = peer.call(friendtkn, media);
		}
		self.addHandlersToCall(self, thiscall, friendtkn, peer, isAnswer);
		console.log("exit4d");
	}

	// Add Event handlers to the thiscall call - error, stream used as of now.
	addHandlersToCall(self, thiscall, friendtkn, peer, isAnswer) {
		// Triggered when an error is observed in connection.
		thiscall.on("error", (err) => {
			// TODO: Add condition to close the connection.
			console.log("Connection failed for " + friendtkn);
			console.log(friendtkn);
			console.log(err);
			thiscall.close();
      self.deleteVideoElement(thiscall.peer);
			//self.startConnection(self, friendtkn, peer);

			// If an error is observed, we automatically send another request to start connection,
			// to provide reliability. Since, we dont want both the receiver and username of the stream
			// to send new calls, only the receiver initiates a new connection.
			if (!isAnswer) {
				console.log(friendtkn);
				//self.startConnection(self, friendtkn, peer);
			}
		});

		// Triggered when receiving a stream from peer.
		thiscall.on("stream", function (stream) {
			console.log("stream received from" + thiscall.peer);
			var calls = self.state.calls;
			console.log(calls);
			var duplicateCall = false;
			var duplicateCallIndex = -1;
			calls.forEach((val, index) => {
				console.log("checking with " + val.peer);
				if (val.peer == thiscall.peer) {
					duplicateCallIndex = index;
					duplicateCall = val;
					return;
				}
			});
			if (duplicateCall) {
				console.log("closing a duplicate call.");
				console.log(duplicateCall.peer);
				//      calls.delete(duplicateCall);
				//calls.splice(duplicateCallIndex, 1);
				return;
				//duplicateCall.close();
			}
			//calls.add(call);
			console.log(calls);
			console.log(thiscall);
			self.setState({
				//call: peer.call(friendtkn, media),//to be updated appropriately
				calls: [...calls, thiscall],
				//calls: calls,
			});
			self.createStream(self, stream, friendtkn);
		});
	}

	// Add event handlers to the incoming stream and do some other processing,
	// before being sent to the video object to be displayed on screen.
	createStream(self, stream, friendtkn) {
		var tracks = stream.getTracks();
		var track = tracks[0];

		//Experimental event handler - to be removed.
		stream.onremovetrack = function (evt) {
			console.log("Track removed");
			console.log(evt);
		};

		//console.log(track.remote);

		// These handlers being added are to the incoming stream we are receiving, while
		// the handlers added before were to the stream which we were sending.

		// triggered when the remote stream being received ends due to connection error
		track.addEventListener("ended", () => {
			console.log("Receiving stream ended. Please show this");
		});

		//Can't figure out the exact conditions which cause this event to be handled,
		//but this handler maybe useful, if we are enabling and disabling streams.
		track.addEventListener("mute", () => {
			console.log("muted. Please show this");
		});

		console.log(stream.getTracks());

		self.createVideoElement(self, stream, friendtkn);

		//self.videoRef.current.srcObject = stream;
	}

	// Creates a new video element to show the stream passed to it.
	createVideoElement(self, stream, friendtkn) {
		let video = document.createElement("video");
		video.width = "200";
		video.id = friendtkn;
		video.height = "350";
		video.srcObject = stream;
		video.autoplay = true;
		video.onclick = self.switchContext;
		document.getElementById("videos").appendChild(video);
	}

  deleteVideoElement(id) {
    let video = document.getElementById(id);
    video.remove();
  }

  deleteAllVideoElements() {
    /*
    let videos = document.getElementById("videos");
    videos.empty();
    */
    $("#videos").empty();
  }

	sendCallEndedSignal() {
		const reqData = {
			roomName: this.state.roomName,
		};
		axios
			.post("http://localhost:5000/api/room/exitstream", reqData, {
				headers: {
					"milaap-auth-token": localStorage.getItem("milaap-auth-token"),
				},
			})
			.then((res) => {
				console.log(res.data);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	sendRequestToEndCall(next) {
		const reqData = {
			roomName: this.state.roomName,
		};
		axios
			.post("http://localhost:5000/api/room/exitstream", reqData, {
				headers: {
					"milaap-auth-token": localStorage.getItem("milaap-auth-token"),
				},
			})
			.then((res) => {
				console.log(res.data);
				var idToBeDestroyed = res.data.idToBeDestroyed;
        console.log(this.state.myPeers);
				this.state.myPeers.forEach((val, index) => {
          if(val) {
					  val.destroy();
          }
				});
				next();
			})
			.catch((err) => {
				console.log(err);
				next(false, "Error");
			});
	}

	endCall(next) {
		this.sendRequestToEndCall(next);
		if (this.state.myMediaStreamObj) {
			this.state.myMediaStreamObj.getTracks().forEach((track) => {
				console.log(track);
				track.stop();
			});
			this.state.myMediaStreamObj.getTracks().forEach((track) => {
				this.state.myMediaStreamObj.removeTrack(track);
			});
			this.setState({
				myMediaStreamObj: null,
			});
		}
		//Add by appropriate UI changes which clears the screen.
    this.deleteAllVideoElements();
	}

	render() {
		const self = this;
		return (
			<Container>
				<br />
				<br />
				<Row className="justify-content-center text-center">
					<AwesomeButtonProgress
						type="primary"
						size="medium"
						action={(element, next) => {
							this.startScreenShare("video", next);
						}}
					>
						<i className="icon-user icons"></i>
						<span> Video</span>
					</AwesomeButtonProgress>
					<AwesomeButtonProgress
						type="primary"
						size="medium"
						action={(element, next) => this.startScreenShare("screen", next)}
					>
						<i className="icon-screen-desktop icons"></i>
						<span> Screen</span>
					</AwesomeButtonProgress>
					<AwesomeButtonProgress
						type="primary"
						size="medium"
						//visible={!self.state.calls.length} //use this if we want it completely hidden until needed instead
						disabled={!self.state.myMediaStreamObj}
						action={(element, next) => {
							this.endCall(next);
						}}
					>
						<i className="icon-call-end icons"></i>
						<span> End Call</span>
					</AwesomeButtonProgress>
				</Row>
				<br />
				<h3>Members</h3>
				<ListGroup flush>
					{this.state.active
						? this.state.active.map((user) => {
								return (
									<ListGroupItem key={Math.random()}>
										<Spinner type="grow" size="sm" variant="success" />
										{user.username}
									</ListGroupItem>
								);
						  })
						: " "}
				</ListGroup>
			</Container>
		);
	}
}

export default Controls;
