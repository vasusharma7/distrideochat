import React, { Component, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import * as router from 'react-router-dom';
import { Container } from 'reactstrap';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import { connect } from 'react-redux';
import ReactNotification, { store } from 'react-notifications-component';
import * as actions from '../../redux/loginRedux/loginAction';
import './DefaultLayout.css';
import {
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav2 as AppSidebarNav
} from '@coreui/react';
import routes from '../../routes';

const socket = socketIOClient(`${global.config.backendURL}/`);
const DefaultHeader = React.lazy(() => import('./DefaultHeader'));
function getGroupElements(rooms) {
  const groupElements = [];
  if (rooms === undefined) {
    return {};
  }
  rooms.forEach((item, index) => {
    const groupElem = {};
    groupElem.name = item;
    groupElem.url = '/rooms/' + item;
    groupElem.icon = 'icon-screen-desktop';
    groupElem.state = true;
    groupElements.push(groupElem);
  });
  return groupElements;
}

class DefaultLayout extends Component {
  getRooms = async () => {
    const token = localStorage.getItem('milaap-auth-token');
    const reqHeader = { 'milaap-auth-token': token };
    await axios
      .post(
        `${global.config.backendURL}/api/user/getrooms`,
        {},
        {
          headers: reqHeader
        }
      )
      .then((res) => {
        if (res.status === 201) {
          this.setState({
            navigation: {
              items: [
                {
                  title: true,
                  name: 'Rooms',
                  icon: 'icon-puzzle'
                },
                {
                  icon: 'icon-user',
                  name: 'Login To View Rooms',
                  url: '/login'
                }
              ]
            }
          });
          return;
        }
        console.log(res);
        var rooms = res.data.rooms;
        this.setState({ rooms: rooms });
        const GroupList = getGroupElements(rooms);
        // axios
        //   .post(
        //     `${global.config.backendURL}/api/room/getActive`,
        //     {},
        //     {
        //       headers: {
        //         'milaap-auth-token': localStorage.getItem('milaap-auth-token')
        //       }
        //     }
        //   )
        //   .then((res) => {
        //     console.log(res);
        //     var active = res.data.active;
        //     console.log(active);
        //     console.log({ ...GroupList });
        this.setState({
          navigation: {
            items: [
              {
                title: true,
                name: 'Rooms',
                icon: 'icon-puzzle',
                children: [
                  {
                    // title: true,
                    name: 'No Messages Yet.',
                    icon: 'icon-puzzle',
                    badge: {
                      variant: 'info',
                      text: 'Add'
                    },
                    class: ''
                  }
                ]
              },
              ...GroupList
            ]
          }
        });
        // })
        // .catch((err) => {
        //   console.log(err);
        // });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  constructor(props) {
    super(props);
    var rooms;
    const GroupList = getGroupElements(rooms);
    this.state = {
      rooms: [],
      userToken: localStorage.getItem('milaap-auth-token'),
      navigation: {
        items: [
          {
            title: true,
            name: 'Rooms',
            icon: 'icon-puzzle',
            children: [
              {
                // title: true,
                name: 'No Messages Yet.',
                icon: 'icon-puzzle',
                badge: {
                  variant: 'info',
                  text: 'Add'
                },
                class: ''
              }
            ]
          },
          GroupList
        ]
      }
    };
    if (this.state.userToken === null) {
      return;
    }
    this.getRooms();
    this.state = {
      navigation: {
        items: [
          {
            title: true,
            name: 'Rooms',
            icon: 'icon-puzzle',
            children: [
              {
                // title: true,
                name: 'No Messages Yet.',
                icon: 'icon-puzzle',
                badge: {
                  variant: 'info',
                  text: 'Add'
                },
                class: ''
              }
            ]
          },
          GroupList
        ]
      }
    };
    socket.on('newRoom', (data) => {
      console.log('ROOM ADDED');
      console.log(data);
      this.getRooms();
    });
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>;

  signOut(e) {
    e.preventDefault();
    this.props.logout();
    localStorage.clear();
    this.props.history.push('/landing');
  }

  componentDidMount() {
    if (
      this.props.location.state !== undefined &&
      this.props.location.state !== null
    ) {
      store.addNotification({
        title: `Hi ${this.props.location.state}`,
        message: 'Welcome to Dashboard',
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
  }

  render() {
    if (localStorage.getItem('milaap-auth-token') === null) {
      if (this.props.location.pathname.match('/rooms/')) {
        var room = this.props.location.pathname.split('/')[2];
        return <Redirect to={{ pathname: '/join', room: room }} />;
      }
      return <Redirect to={{ pathname: '/landing' }} />;
    }
    console.log(this.props);
    return (
      <React.Fragment>
        <div className="app">
          <AppHeader className="navbar navbar-dark bg-dark" fixed>
            <Suspense fallback={this.loading()}>
              <DefaultHeader onLogout={(e) => this.signOut(e)} />
            </Suspense>
          </AppHeader>
          <div className="app-body">
            <ReactNotification />
            <AppSidebar fixed display="lg">
              <AppSidebarHeader />
              <AppSidebarForm />
              <Suspense>
                <AppSidebarNav
                  navConfig={this.state.navigation}
                  {...this.props}
                  router={router}
                />
              </Suspense>
              <AppSidebarFooter />
              <AppSidebarMinimizer />
            </AppSidebar>
            <Container fluid id="main-container">
              <Suspense fallback={this.loading()}>
                <Switch>
                  {routes.map((route, idx) => {
                    return route.component ? (
                      <Route
                        key={idx}
                        path={route.path}
                        exact={route.exact}
                        name={route.name}
                        render={(props) => <route.component {...props} />}
                      />
                    ) : null;
                  })}
                  <Redirect from="/" to="/dashboard" />
                </Switch>
              </Suspense>
            </Container>
            {/*
            <Suspense fallback={this.loading()}>
              <aside className="aside-menu bg-dark" display="md">
                <DefaultAside />
              </aside>
            </Suspense>
            */}
          </div>
        </div>
      </React.Fragment>
    );
  }
}
const mapStateToProps = (state) => {
  return {};
};

const mapDispatchToProps = (dispatch) => {
  return {
    logout: () => dispatch(actions.logout())
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DefaultLayout);
