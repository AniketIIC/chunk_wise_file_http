import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const chunkSize = 400000 * 1024; // 10KB

function App() {
  const [dropzoneActive, setdropzoneActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null);

  function readAndUploadCurrentChunk() {
    const reader = new FileReader();
    const file = files[currentFileIndex];
    console.log("file is: ", file);
    if (!file) {
      return;
    }

    const from = currentChunkIndex * chunkSize;
    const to = from + chunkSize;
    const blob = file.slice(from, to);
    reader.onload = (e) => uploadChunk(e);
    reader.readAsArrayBuffer(blob);
  }

  function uploadChunk(readerEvent) {
    const file = files[currentFileIndex];
    const data = readerEvent.target.result;
    const params = new URLSearchParams();

    console.log("data is: ", data);
    if (data) {
      const formData = new FormData();
      formData.append("name", file.name);
      formData.append("size", file.size);
      formData.append("currentChunkIndex", currentChunkIndex);
      formData.append("totalChunks", Math.ceil(file.size / chunkSize));
      formData.append("file", new Blob([readerEvent.target.result]));
      /* params.set("name", file.name);
      params.set("size", file.size);
      params.set("currentChunkIndex", currentChunkIndex);
      params.set("totalChunks", Math.ceil(file.size / chunkSize));*/

      //If we don't know the type of file
      // const headers = { "Content-Type": "application/octet-stream" };
      const url = "http://localhost:3000/upload";

      /*  fetch(url, { method: "POST", body: formData });
      return;*/

      axios.post(url, formData).then((response) => {
        console.log(response);
        if (response.status === 200) {
          const file = files[currentFileIndex];
          const fileSize = files[currentFileIndex].size;
          const isLastChunk =
            currentChunkIndex === Math.ceil(fileSize / chunkSize) - 1;
          if (isLastChunk) {
            file.finalFileName = response.data.finalFileName;
            setLastUploadedFileIndex(currentFileIndex);
            setCurrentChunkIndex(null);
          } else {
            setCurrentChunkIndex(currentChunkIndex + 1);
          }
        } else {
          setdropzoneActive(false);
          setFiles([]);
          setCurrentFileIndex(null);
          setLastUploadedFileIndex(null);
          setCurrentChunkIndex(null);
        }
      });
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    //console.log("file is: ", e.dataTransfer.files);
    setFiles([...files, ...e.dataTransfer.files]);
  }

  useEffect(() => {
    if (lastUploadedFileIndex === null) {
      return;
    }
    //console.log("lastUploadedFileIndex: ", lastUploadedFileIndex);
    const isLastFile = lastUploadedFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadedFileIndex]);

  useEffect(() => {
    if (files.length) {
      if (!currentFileIndex) {
        console.log("setting Current File Index");
        console.log("last upload File Index: ", lastUploadedFileIndex);
        setCurrentFileIndex(
          lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1
        );
      }
    }
  }, [files.length]);

  useEffect(() => {
    // Will upload file of this currentFileIndex
    console.log("setting current file Index for index: ", currentFileIndex);
    if (currentFileIndex != null) {
      console.log("setting current Index");
      setCurrentChunkIndex(0);
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (currentChunkIndex != null) {
      console.log("reading and uploading Chunk");
      readAndUploadCurrentChunk();
    }
  }, [currentChunkIndex]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          setdropzoneActive(true);
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          setdropzoneActive(false);
          e.preventDefault();
        }}
        onDrop={(e) => handleDrop(e)}
        className={"dropzone" + (dropzoneActive ? " active" : "")}
      >
        Drop your File Here
      </div>
    </div>
  );
}

export default App;
