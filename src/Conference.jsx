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
    client.removeTrack = (track) => {
      let streams = this.state.streams;
      streams = streams.filter(item => {
        if (item.hasOwnProperty("track")) {
          if (item.track.id !== track.id) {
            return item
          }
        }
      }
      );
      this.setState({ streams });
    }
    client.onspeaker = (event) => {
      // console.log("client.onspeaker =>", Date(), event);
    }
    client.ondatachannel = ({ channel }) => {
      channel.onmessage = ({ data }) => {
        console.log("client.ondatachannel =>", Date(), data);
      };
    };
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
            audio: true,
            video: true,
            simulcast: true,
            sendEmptyOnMute: true,
          }
        );
        client.publish(localStream)
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
    this.muteMediaTrack("video", this.props.localVideoEnabled);
  };
  muteMediaTrack = (type, enabled) => {

    let { localStream } = this.state;
    if (!localStream) {
      return
    }
    if (enabled) {
      localStream.unmute(type)
    } else {
      this.state.streams[0].stream.preferLayer("low")
      localStream.mute(type)
    }

    if (type === "audio") {
      this.setState({ audioMuted: !enabled });
    } else if (type === "video") {
      this.setState({ videoMuted: !enabled });
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
