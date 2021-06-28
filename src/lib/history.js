const path = require("path");
const fs = require("fs");

const mime = require("mime-types");

const HISTORY_FOLDER_NAME = "history";
const HISTORY_IMAGE_NAME = "image";
const HISTORY_PATH = path.resolve(__dirname, "../../public", HISTORY_FOLDER_NAME);

exports.HISTORY_FOLDER_NAME = HISTORY_FOLDER_NAME;

exports.getHistoryImages = function (callback) {
  fs.readdir(HISTORY_PATH, (err, files) => {
    if (err) return callback(err);

    // filter only the files and only the "images"
    try {
      files = files.filter((fileName) => {
        if (fs.lstatSync(path.resolve(HISTORY_PATH, fileName)).isFile()) {
          const mimeType = mime.lookup(fileName);
          return mimeType && mimeType.startsWith("image/");
        }
        return false;
      });
    } catch (err) {
      return callback(err);
    }

    callback(null, files);
  });
};
