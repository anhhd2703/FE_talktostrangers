import React from "react";
import { Layout, Button, Modal, Icon, notification, Card, Spin, Tooltip } from "antd";
const { confirm } = Modal;
const { Header, Content, Footer, Sider } = Layout;
import { reactLocalStorage } from "reactjs-localstorage";
import "../styles/css/app.scss";
import "./videoview/style.scss";
import LoginForm from "./LoginForm";
import Conference from "./Conference";
import { Client, IonSFUJSONRPCSignal } from "ion-sdk-js";
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      login: false,
      loading: false,
      screenSharingEnabled: false,
      collapsed: true,
      isFullScreen: false,
      vidFit: false,
      loginInfo: {},
      messages: [],
      users: [],
      streamInfo: [],
      newUrl: null
    };

    this._settings = {
      selectedAudioDevice: "",
      selectedVideoDevice: "",
      resolution: "hd",
      bandwidth: 1024,
      codec: "vp8",
      isDevMode: false,
    }


    let settings = reactLocalStorage.getObject("settings");
    if (settings.codec !== undefined) {
      this._settings = settings;
    }

  }
  getRequest() {
    let url = location.search;
    let theRequest = new Object();
    if (url.indexOf("?") != -1) {
      let str = url.substr(1);
      let strs = str.split("&");
      for (let i = 0; i < strs.length; i++) {
        theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
      }
    }
    return theRequest;
  }

  _getNewUrl = (newUrl) => {
    this.setState({ newUrl: newUrl.trim() },
      () => {
        console.log("[App] newUrl", this.state.newUrl);
      })
    reactLocalStorage.setObject("newUrl", newUrl.trim());
  }

  _cleanUp = async () => {
    await this.conference.cleanUp();
    this.client.leave(this.state.loginInfo.Language);
    this.client.close();
  };

  _notification = (message, description) => {
    notification.info({
      message: message,
      description: description,
      placement: 'bottomRight',
    });
  };

  _createClient = () => {
    let newUrl = this.state.newUrl || window.location.host
    let url = "wss://" + newUrl + "/ws";
    console.log(url);
    if (process.env.NODE_ENV == "development") {
      const proto = this._settings.isDevMode ? "ws" : "wss"
      url = proto + "://" + window.location.host;
    }
    url = "ws://localhost:7000/ws"
    const signal = new IonSFUJSONRPCSignal(url);
    signal._onerror = (res) => {
      console.log("===================", res);
    }
    this.signal = signal
    let client = new Client(signal);

    client.url = url;

    return client
  }

  _handleLoading = value => {
    console.log("_handleLoading", value);
    this.setState({ loading: value });
  }
  _handleJoin = async values => {
    this.setState({ loading: true });

    let client = this._createClient();
    window.onunload = async () => {
      await this._cleanUp();
    };
    this.signal._onopen = () => {
      console.log("=======onready====");
      this._handleTransportOpen(values);
    }

    this.client = client;
  };

  _handleTransportOpen = async (values) => {
    reactLocalStorage.remove("loginInfo");
    reactLocalStorage.setObject("loginInfo", values);
    console.log("--------_handleTransportOpen-------------->", values);

    this.rid = values.roomId;
    await this.client.join(this.rid);
    this.setState({
      login: true,
      loading: false,
      loginInfo: values,
      localVideoEnabled: !values.audioOnly,
    });
    await this.conference.handleLocalStream(true);
  }

  _onRef = ref => {
    this.conference = ref;
  };

  _openOrCloseLeftContainer = collapsed => {
    this.setState({
      collapsed: collapsed
    });
  };

  _onVidFitClickHandler = () => {
    this.setState({
      vidFit: !this.state.vidFit
    });
  };

  _onFullScreenClickHandler = () => {
    let docElm = document.documentElement;

    if (this._fullscreenState()) {

      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
      else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
      else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }

      this.setState({ isFullScreen: false });

    } else {
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      }
      //FireFox
      else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
      }
      //Chrome等
      else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
      }
      //IE11
      else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }

      this.setState({ isFullScreen: true });
    }
  }

  _fullscreenState = () => {
    return document.fullscreen ||
      document.webkitIsFullScreen ||
      document.mozFullScreen ||
      false;
  }

  _onMediaSettingsChanged = async (selectedAudioDevice, selectedVideoDevice, resolution, bandwidth, codec, isDevMode) => {
    this._settings = { selectedAudioDevice, selectedVideoDevice, resolution, bandwidth, codec, isDevMode }
    if (this.state.login) {
      await this.conference.handleSwitchDevices(this._settings);
    }
    reactLocalStorage.setObject("settings", this._settings);
  }

  _onMessageReceived = (data) => {
    console.log('Received message:' + data.senderName + ":" + data.msg);
    let messages = this.state.messages;
    let uid = 1;
    messages.push(new Message({ id: uid, message: data.msg, senderName: data.senderName }));
    this.setState({ messages });
  }

  _onSendMessage = (data) => {
    console.log('Send message:' + data);
    var info = {
      "senderName": this.state.loginInfo.Level,
      "msg": data,
    };
    this.client.broadcast(info);
    let messages = this.state.messages;
    let uid = 0;
    messages.push(new Message({ id: uid, message: data, senderName: 'me' }));
    this.setState({ messages });
  }

  _onSystemMessage = (msg) => {
    let messages = this.state.messages;
    let uid = 2;
    messages.push(new Message({ id: uid, message: msg, senderName: 'System' }));
    this.setState({ messages });
  }

  render() {
    const {
      login,
      loading,
      localAudioEnabled,
      localVideoEnabled,
      vidFit
    } = this.state;
    return (
      <div className="grid-video">
        {login ? (
          <Conference
            onMessageReceived={this._onMessageReceived}
            collapsed={this.state.collapsed}
            uid={this.uid}
            rid={this.rid}
            forceLeave={this._forceLeave}
            client={this.client}
            signal={this.signal}
            settings={this._settings}

            vidFit={vidFit}
            ref={ref => {
              this.conference = ref;
            }}
          />

        ) : loading ? (
          <>
            <Spin size="large" tip="Connecting... " />
          </>
        ) : (
          <Card>
            <LoginForm handleLogin={this._handleJoin} createClient={this._createClient} getNewUrl={this._getNewUrl} handleLoading={this._handleLoading} />
          </Card>
        )}
      </div>

    );
  }
}

export default App;
