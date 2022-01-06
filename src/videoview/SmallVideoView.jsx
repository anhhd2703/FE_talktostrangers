import React from "react";
import { recalculateLayout } from "./GridVideoView";
class SmallVideoView extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      clientWidth: document.body.offsetWidth,
      clientHeight: document.body.offsetHeight,
    }
  }

  componentDidMount = () => {
    const { stream } = this.props;
    this.video.srcObject = stream;
    recalculateLayout()

  };

  componentWillUnmount = () => {
    this.video.srcObject = null;
  }



  render = () => {
    const { id, stream } = this.props;

    return (
      <div className="video-container" >
        <div className="small-video-div">
          <video
            ref={ref => {
              this.video = ref;
            }}
            id={id}
            autoPlay
            playsInline
            muted={false}
          />
          <div className="small-video-id-div">
            {/* <p className="small-video-id-a">{stream.info.name}</p> */}
          </div>
        </div>

      </div>
    );
  };
}

export default SmallVideoView;
