const { desktopCapturer, remote } = require("electron");
// desktopCapturer to obviously capture to current screen and remote will be useful for handling dialog boxes

const { writeFile } = require("fs");
const { Stream } = require("stream");
// writeFile is present in node module helps to save files locally

const { dialog, Menu } = remote;

// global variables

let mediaRecorder;
// for recording the screen

const recordedChunks = [];
// array which will store the recorded videos

// id reference

const videoElement = document.querySelector("video");

const startBtn = document.getElementById("startBtn");

const stopBtn = document.getElementById("stopBtn");

startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerHTML = "Recording Screen";
};

stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerHTML = "Start";
};

const videoSelectBtn = document.getElementById("videoSelectBtn");

videoSelectBtn.onclick = getVideoSources;

// get all screens open in the window
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name, //name of the screen
        click: () => selectSource(source),
      };
    })
  );

  videoOptionsMenu.popup();
}

async function selectSource(source) {
  console.log(source);

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  };

  // Create a stream to record screen

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;

  videoElement.play();

  // media recorder creation

  const options = {
    //the format in which the videos should be recorded
    mimeType: "video/webm;codecs=vp9",
  };

  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event handlers

  mediaRecorder.ondataavailable = handleDataAvailable;

  mediaRecorder.onstop = handleStop;
}

// captures all recorded chunks and pushing it to recordedchunks array
function handleDataAvailable(e) {
  console.log("Video Data Available");
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm;codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  // to save the video
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `vid-${Date.now()}.webm`, //the name of the recorded video
  });

  // write the filepath

  if (filePath) {
    writeFile(filePath, buffer, () => {
      console.log("Filed Saved Successfully");
    });
  }
}
