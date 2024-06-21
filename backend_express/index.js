import express from "express";
import cors from "cors";
import multer from "multer";
import * as fs from "fs";
import md5 from "md5";

const app = express();
const upload = multer();

app.use(cors("*"));
//app.use(upload.array());

app.use("/upload", upload.single("file"), (req, res, next) => {
  const { name, currentChunkIndex, totalChunks } = req.body;
  const firstChunk = parseInt(currentChunkIndex) === 0;
  const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
  const ip = req.ip;
  const file = req.file;
  const buffer = file.buffer;
  const ext = name.split(".").pop();
  const tempFileName = "tmp_" + md5(name + ip) + "." + ext;
  if (firstChunk && fs.existsSync("./uploads/" + tempFileName)) {
    fs.unlinkSync("./uploads/" + tempFileName);
  }

  const directoryPath = "./uploads/";
  if (!fs.existsSync("./uploads/" + tempFileName)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  fs.appendFileSync("./uploads/" + tempFileName, buffer);

  if (lastChunk) {
    const finalFileName = md5(Date.now()).substr(0, 6) + "." + ext;
    fs.renameSync("./uploads/" + tempFileName, "./uploads/" + finalFileName);
    return res.json(finalFileName);
  }
  return res.json({});
});

app.listen(3000, () => {
  console.log("App listenting on port 3000");
});
