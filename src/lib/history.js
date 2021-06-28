const path = require("path");
const fs = require("fs");

const mime = require("mime-types");

const HISTORY_FOLDER_NAME = "history";
const HISTORY_IMAGE_NAME = "image";
const HISTORY_IMAGE_NAME_EXT = ".jpg";
const HISTORY_PATH = path.resolve(__dirname, "../../public", HISTORY_FOLDER_NAME);

exports.HISTORY_FOLDER_NAME = HISTORY_FOLDER_NAME;

const HISTORY_MAX = 15;

// keep track of the next "new" image
let lastImageNum = 1;

/**
 *
 * @param {(error: Error, files: string[])=> void} callback
 */
exports.getHistoryImages = function (callback) {
  fs.readdir(HISTORY_PATH, (err, files) => {
    if (err) return callback(err);

    // filter only the files and only the "images" and happing the "imageNUM" pattern
    try {
      files = files.filter((fileName) => {
        if (fs.lstatSync(path.resolve(HISTORY_PATH, fileName)).isFile()) {
          const mimeType = mime.lookup(fileName);
          if (
            mimeType &&
            mimeType.startsWith("image/") &&
            fileName.startsWith(HISTORY_IMAGE_NAME) &&
            fileName.endsWith(HISTORY_IMAGE_NAME_EXT)
          ) {
            let num = fileName.replace(HISTORY_IMAGE_NAME, "").replace(HISTORY_IMAGE_NAME_EXT, "");

            if (Number.isInteger(Number.parseInt(num))) {
              return true;
            }
          }
        }
        return false;
      });
    } catch (err) {
      return callback(err);
    }

    callback(null, files);
  });
};

/**
 * @return {string}
 */
exports.createNewHistoryImageName = function () {
  if (lastImageNum > HISTORY_MAX) lastImageNum = 1;
  const newImageName = path.resolve(
    HISTORY_PATH,
    `${HISTORY_IMAGE_NAME}${lastImageNum}${HISTORY_IMAGE_NAME_EXT}`
  );
  lastImageNum++;
  if (lastImageNum > HISTORY_MAX) lastImageNum = 1;
  return newImageName;
};

// initially get(calculate) the "next" image
this.getHistoryImages((error, files) => {
  if (!files) return;

  // we know that they will be rel integer numbers
  let fileNums = files.map(
    (fileName) => +fileName.replace(HISTORY_IMAGE_NAME, "").replace(HISTORY_IMAGE_NAME_EXT, "")
  );
  // get max allowed
  if (fileNums.length > HISTORY_MAX) fileNums.length = HISTORY_MAX;
  // sort it
  fileNums.sort();

  lastImageNum = fileNums[fileNums.length - 1] + 1;
  if (lastImageNum > HISTORY_MAX) lastImageNum = 1;
});
