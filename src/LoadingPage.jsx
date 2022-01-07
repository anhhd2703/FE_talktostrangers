import React from "react"
import "../styles/css/loading.scss"

class LoadingPage extends React.Component {
    render() {
        return (
            <>
                <div class="loading">
                    <h2>2021</h2>
                    <div class="bar"></div>
                    <h2>2022</h2>
                </div>
                <div class="center-loading">
                    <div><h2>Goo!!!!!!!!!!</h2></div>
                    <div></div>
                    <div><h2>2022!</h2></div>
                    <div></div>
                </div>
            </>
        )
    }
}
export default LoadingPage;