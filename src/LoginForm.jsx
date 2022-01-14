import React from "react";
import { Form, Icon, Input, Button, Checkbox, notification, Avatar, Badge, Tooltip } from "antd";
import { reactLocalStorage } from "reactjs-localstorage";
import "../styles/css/login.scss";
import { AutoComplete } from 'antd';
import CheckIcon from "mdi-react/CheckIcon";
import ServerNetworkIcon from "mdi-react/ServerNetworkIcon";
import GoogleClassroomIcon from "mdi-react/GoogleClassroomIcon";
import ProgressClockIcon from "mdi-react/ProgressClockIcon";
import ProgressAlertIcon from "mdi-react/ProgressAlertIcon";
import ProgressCloseIcon from "mdi-react/ProgressCloseIcon";
import UploadLockIcon from "mdi-react/UploadLockIcon";
import DownloadLockIcon from "mdi-react/DownloadLockIcon";
import { LanguageCodes } from "./data/language"
const language = LanguageCodes.map(val => val.name)
import axios from "axios"
import { v4 as uuidv4 } from 'uuid';
const TEST_STEPS = {
  biz: { title: 'Biz Websocket', icon: <ServerNetworkIcon /> },
  lobby: { title: 'Joining Test Room', icon: <GoogleClassroomIcon /> },
  publish: { title: 'Publish', icon: <UploadLockIcon /> },
  subscribe: { title: 'Subscription', icon: <DownloadLockIcon /> },
};

const ICONS = {
  connected: CheckIcon,
  ok: CheckIcon,
  pending: ProgressClockIcon,
  warning: ProgressAlertIcon,
  "no candidates": ProgressAlertIcon,
  error: ProgressCloseIcon,
  joined: CheckIcon,
  published: CheckIcon,
  subscribed: CheckIcon,
};


class LoginForm extends React.Component {


  componentDidMount = () => {
    const { form } = this.props;
    console.log("window.location:" + window.location);
    console.log("url:" + window.location.protocol + window.location.host + "  " + window.location.pathname + window.location.query);

    console.log('Making test client');


    let params = this.getRequest();

    let Language = 'room1';
    let Level = 'Guest';
    let audioOnly = false;

    let localStorage = reactLocalStorage.getObject("loginInfo");

    if (localStorage) {
      Language = localStorage.Language || 'None';
      Level = localStorage.Level || 'None';
      audioOnly = localStorage.audioOnly;
      console.log('localStorage:' + Language + ' ' + Level);
    }

    if (params && params.hasOwnProperty('room')) {
      Language = params.room;
    }
    this.setState({ newUrl: reactLocalStorage.getObject("newUrl") })
    form.setFieldsValue({
      'Language': Language,
      'Level': Level,
      'audioOnly': audioOnly,
    });

  };

  componentWillUnmount = () => {
    this._cleanup();
  }

  _notification = (message, description) => {
    notification.info({
      message: message,
      description: description,
      placement: "bottomRight"
    });
  };



  _stopMediaStream = async (stream) => {
    let tracks = stream.getTracks();
    for (let i = 0, len = tracks.length; i < len; i++) {
      await tracks[i].stop();
    }
  };

  _cleanup = async () => {
    if (this.stream) {
      await this._stopMediaStream(this.stream);
      await this.stream.unpublish();
    }
    if (this.client)
      await this.client.leave();
  };


  handleSubmit = e => {

    e.preventDefault();
    this.props.form.validateFields(async (err, values) => {
      if (!err) {
        const handleLogin = this.props.handleLogin;
        var data = JSON.stringify({
          "user_id": uuidv4(),
          "language": values.language,
          "level": values.level
        });
        var config = {
          method: 'POST',
          url: 'https://nowtalk.fun/api/room',
          headers: {
            'Content-Type': 'application/json',
          },
          data: data
        };
        this.props.handleLoading(true)
        try {
          const response = await axios(config)
          if (response.status == 200) {
            let info = { ...values, roomId: response.data.data }
            handleLogin(info);
          }
        } catch (error) {
          this.props.handleLoading(false)
        }
      }
    });
  };

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

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <>
        <Form onSubmit={this.handleSubmit} className="login-form">
          <Form.Item
            label="Language"
          >{getFieldDecorator('language', {
            initialValue: "None",
          })(
            <AutoComplete
              style={{ width: "90%" }}
              dataSource={language}
              placeholder="None"
              filterOption={(inputValue, option) =>
                option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />)}
          </Form.Item>
          <Form.Item
            label="Level"
          >{getFieldDecorator('level', {
            initialValue: "None",
          })(
            <AutoComplete
              style={{ width: "90%" }}
              dataSource={["None", "Low", "Medium", "High"]}
              placeholder="None"
              filterOption={(inputValue, option) =>
                option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
              }
            />)}
          </Form.Item>
          <Form.Item>
            {getFieldDecorator('audioOnly', {
              valuePropName: 'checked',
              initialValue: true,
            })(
              <Checkbox>
                Audio only
              </Checkbox>
            )}
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-join-button">
              Join
            </Button>
          </Form.Item>
        </Form>
      </>
    );
  }
}

function objToStrMap(obj) {
  const strMap = new Map();
  for (const k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

const WrappedLoginForm = Form.create({ name: "login" })(LoginForm);
export default WrappedLoginForm;
