import React from "react";
import { Spin } from "antd";
import { SmallVideoView } from "./videoview";
import { LocalStream } from 'ion-sdk-js';
import "../styles/css/conference.scss";

class Conference extends React.Component {
  constructor() {
    super();
    this.state = {
      streams: [],
      localStream: null,
      localScreen: null,
      audioMuted: false,
      videoMuted: false,
      users: [],
      streamInfo: [],
    };
    let getStats
  }
  componentDidMount = () => {
    const { client, signal } = this.props;
    let newStream
    let newPeer
    signal.onnotis = (resp) => {
      if (resp.method === "peer-remove") {
        if (resp.params.uid === this.props.uid) {
          this.props.forceLeave()
        }

      }
      if (resp.method === "peer-list") {
        this.setState(
          {
            users: !resp.params.peers ? [] : resp.params.peers,
            streamInfo: !resp.params.streams ? [] : resp.params.streams
          }
        )
      }
      if (resp.method === "stream-add") {
        newStream = resp.params.stream
      }
      if (resp.method === "peer-join") {
        newPeer = resp.params
      }
      if (resp.method === "broadcast") {
        this.props.onMessageReceived(resp.params.info)
      }
      if (resp.method === "peer-leave") {
        let streams = this.state.streams;
        let uidLeave = resp.params.uid
        streams = streams.filter(item => item.stream.info.uid !== uidLeave);
        this.setState({ streams }, () => {
          console.log("remove stream", this.state.streams);
        });
      }
    }
    client.removeTrack = (track) => {
      let streams = this.state.streams;
      streams = streams.filter(item =>
        item.track.id !== track.id
      );
      this.setState({ streams }, () => {
        console.log("remove stream", this.state.streams);
      });
    }
    client.ontrack = (track, stream) => {
      let streams = this.state.streams;
      if (streams.filter(st => st?.stream?.id == stream.id).length == 0) {
        stream.preferLayer('none')
        streams.push({ track, stream, mid: stream.id });
        this.setState({ streams }, async () => {
        });
      }
    };
  };

  cleanUp = async () => {
    let { localStream, localScreen, streams } = this.state;
    await this.setState({ localStream: null, localScreen: null, streams: [] });
    await this._unpublish(localStream)
  };

  handleLocalStream = async (enabled) => {
    let { localStream } = this.state;
    const { client, settings } = this.props;
    try {
      if (enabled) {
        localStream = await LocalStream.getUserMedia(
          {
            audio: false,
            video: true,
            simulcast: true,
            sendEmptyOnMute: true,
          }
        );
        client.publish(localStream)
        console.log(localStream);
        let streams = this.state.streams;
        streams.push({ stream: localStream, mid: localStream.id });
        this.setState({ streams });
      } else {
        if (localStream) {
          this._unpublish(localStream);
          localStream = null;
        }
      }
      this.setState({ localStream });
    } catch (e) {
      console.log("handleLocalStream error => " + e);
    }
  };

  _handleRemoveStream = async (stream) => {
    let streams = this.state.streams;
    streams = streams.filter(item => item.sid !== stream.mid);
    this.setState({ streams });
  };



  render = () => {
    const { client, vidFit } = this.props;
    const {
      streams,
      localStream,
      localScreen,
      audioMuted,
      videoMuted
    } = this.state;

    return (
      <div className="gallery" id="gallery">
        {streams.length === 0 && (
          <div className="conference-layout-wating">
            <Spin size="large" tip="Wait for other people joining ..." />
          </div>
        )}
        {streams.map((item, index) => {
          console.log("===========", item);
          return (
            <SmallVideoView
              key={item.mid}
              id={item.mid}
              stream={item.stream}
              videoCount={streams.length}
              collapsed={this.props.collapsed}
              index={index}
              onClick={this._onChangeVideoPosition}
            />
          )
        })}
      </div>
    );
  };
}

export default Conference;
