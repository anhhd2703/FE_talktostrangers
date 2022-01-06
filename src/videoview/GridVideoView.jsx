import "./style.scss";
import debounce from "lodash.debounce";

export function recalculateLayout() {
    const gallery = document.getElementById("gallery");
    const aspectRatio = 16 / 9;
    const screenWidth = document.body.getBoundingClientRect().width;
    const screenHeight = document.body.getBoundingClientRect().height;
    const videoCount = document.getElementsByTagName("video").length;
    console.log(" screenWidth,screenHeight", screenWidth, screenHeight)
    // or use this nice lib: https://github.com/fzembow/rect-scaler
    function calculateLayout(
        containerWidth,
        containerHeight,
        videoCount,
        aspectRatio
    ) {
        let bestLayout = {
            area: 0,
            cols: 0,
            rows: 0,
            width: 0,
            height: 0
        };
        // brute-force search layout where video occupy the largest area of the container
        for (let cols = 1; cols <= videoCount; cols++) {
            const rows = Math.ceil(videoCount / cols);
            console.log("rows", rows)
            const hScale = containerWidth / (cols * aspectRatio);
            const vScale = containerHeight / rows;
            let width;
            let height;
            if (hScale <= vScale) {
                width = Math.floor(containerWidth / cols);
                height = Math.floor(width / aspectRatio);
                console.log("hScale <= vScale", width, height)
            } else {
                height = Math.floor(containerHeight / rows);
                width = Math.floor(height * aspectRatio);
                console.log("hScale =========== vScale", width, height)
            }
            const area = width * height;
            if (area > bestLayout.area) {
                bestLayout = {
                    area,
                    width,
                    height,
                    rows,
                    cols
                };
            }
        }
        return bestLayout;
    }

    const { width, height, cols } = calculateLayout(
        screenWidth,
        screenHeight,
        videoCount,
        aspectRatio
    );
    console.log("==================", width)
    gallery.style.setProperty("--width", width + "px");
    gallery.style.setProperty("--height", height + "px");
    gallery.style.setProperty("--cols", cols + "");
}

const debouncedRecalculateLayout = debounce(recalculateLayout, 50);
window.addEventListener("resize", debouncedRecalculateLayout);

