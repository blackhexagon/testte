import "./styles.css";
import * as faceapi from "face-api.js";

/**
 * All of the necessary HTML elements
 */
const videoEl = document.querySelector("#video");
const startButtonEl = document.querySelector("#start");
const stopButtonEl = document.querySelector("#stop");
const deviceDropdownEl = document.querySelector("#deviceSelector");
const hatSelectorEl = document.querySelector("#hatSelector");
const hatEl = document.querySelector("#hat");

/**
 * All of the available hats
 */
const hats = {
  tophat: {
    hat: "🎩",
    positioning: (box) => ({
      top: box.top - box.height * 1.1,
      left: box.left,
      fontSize: box.height
    })
  },
  bowhat: {
    hat: "👒",
    positioning: (box) => ({
      top: box.top - box.height,
      left: box.left + box.width * 0.1,
      width: box.width,
      fontSize: box.height
    })
  },
  cap: {
    hat: "🧢",
    positioning: (box) => ({
      top: box.top - box.height * 0.8,
      left: box.left - box.width * 0.1,
      fontSize: box.height * 0.9
    })
  },
  graduationcap: {
    hat: "🎓",
    positioning: (box) => ({
      top: box.top - box.height,
      left: box.left,
      fontSize: box.height
    })
  },
  rescuehelmet: {
    hat: "⛑️",
    positioning: (box) => ({
      top: box.top - box.height * 0.75,
      left: box.left,
      fontSize: box.height * 0.9
    })
  }
};

let selectedHat = "tophat";

const listHats = () => {
  hatSelectorEl.innerHTML = Object.keys(hats)
    .map((hatKey) => {
      const hat = hats[hatKey];

      return `<option value="${hatKey}">${hat.hat}</option>`;
    })
    .join("");
};

/**
 * List all available camera devices in the select
 */
let selectedDevice = null;

let devices = [];

const listDevices = async () => {
  if (devices.length > 0) {
    return;
  }

  devices = (await navigator.mediaDevices.enumerateDevices()).filter(
    (d) => d.kind === "videoinput"
  );

  if (devices.length > 0) {
    deviceDropdownEl.innerHTML = devices
      .map(
        (d) => `
      <option value="${d.deviceId}">${d.label}</option>
    `
      )
      .join("");

    // Select first device
    selectedDevice = devices[0].deviceId;
  }
};

/**
 * Detects a face and, if necessary, initializes face-api first.
 */
let faceApiInitialized = false;

const initFaceApi = async () => {
  if (!faceApiInitialized) {
    await faceapi.loadFaceLandmarkModel("/models");
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");

    faceApiInitialized = true;
  }
};

const detectFace = async () => {
  await initFaceApi();

  return await faceapi.detectSingleFace(
    videoEl,
    new faceapi.TinyFaceDetectorOptions()
  );
};

/**
 * Positions the hat by a given box
 */
const positionHat = (box) => {
  const hatConfig = hats[selectedHat];
  const positioning = hatConfig.positioning(box);

  hatEl.classList.add("visible");
  hatEl.innerHTML = hatConfig.hat;
  hatEl.setAttribute(
    "style",
    `
    top: ${positioning.top}px; 
    left: ${positioning.left}px; 
    width: ${box.width}px; 
    height: ${box.height}px; 
    font-size: ${positioning.fontSize}px;
  `
  );
};

/**
 * Start and stop the video
 */
let faceDetectionInterval = null;

const startVideo = async () => {
  listHats();
  await listDevices();

  stopVideo();

  try {
    videoEl.srcObject = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        deviceId: selectedDevice
      },
      audio: false
    });

    faceDetectionInterval = setInterval(async () => {
      try {
        const positioning = await detectFace();

        if (positioning) {
          positionHat(positioning._box);
        }
      } catch (e) {
        console.error(e);
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
      }
    }, 60);
  } catch (e) {
    console.error(e);
  }
};

const stopVideo = () => {
  clearInterval(faceDetectionInterval);
  hatEl.classList.remove("visible");

  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach((t) => {
      t.stop();
    });
    videoEl.srcObject = null;
  }
};

/**
 * Event listeners
 */
startButtonEl.addEventListener("click", startVideo);

stopButtonEl.addEventListener("click", stopVideo);

deviceDropdownEl.addEventListener("change", (e) => {
  selectedDevice = e.target.value;
  startVideo();
});

hatSelectorEl.addEventListener("change", (e) => {
  selectedHat = e.target.value;
});
