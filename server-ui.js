const path = require("path");
const fs = require("fs");

const express = require("express");

const logger = require("./logger");

const app = express();

const PORT_APP = process.env.WEBCAM_PORT_APP || 3000;
const PORT_WEBSOCKET = process.env.WEBCAM_PORT_WEBSOCKET || 9999;

const SECRET_PASS = process.env.WEBCAM_SECRET_PASS || "!@rkm@!_";

const HISTORY_FOLDER_NAME = "history";
const HISTORY_PATH = path.resolve(__dirname, "public", HISTORY_FOLDER_NAME);

app.use("*", (req, res, next) => {
  if (logger.isDebug()) {
    const { ip, originalUrl, method } = req;
    logger.debug(`Request received: ${method} ${originalUrl}, from ${ip}`);
  }
  next();
});

// return the video websocket server port
app.get("/api/live", (req, res) => {
  res.json({ wsport: PORT_WEBSOCKET });
});
app.get("/api/history", (req, res) => {
  listFolder(HISTORY_PATH, (err, /* string[] */ files) => {
    // on error
    if (err) return res.status(500).json({ err: err.message || "" + err });

    // return the history images
    const images = files.map((fileName) => ({ url: `${HISTORY_FOLDER_NAME}/${fileName}`, meta: {} }));
    res.json({ images });
  });
});

// protect all "protect" routes
app.get("/protected/*", (req, res, next) => {
  const pass = req.query.pass;
  if (pass != SECRET_PASS) return res.status(500).end();

  next();
});
app.get("/protected/reboot", (req, res) => {
  res.send();
  process.nextTick(reboot);
});

// redirect to the static index.html
app.get("/", (req, res) => res.redirect("/live.html"));

// serve all static resources
app.use(express.static(path.resolve(__dirname, "public")));

app.listen(PORT_APP, () => {
  logger.info(`App listening on port ${PORT_APP}`);
});

/**
 * Reboot.
 * Use a ready module for this.
 * Any solution would require the running NodeJS process to have proper permissions
 * (as it not good to run NodeJS as root)
 * Other solution is to execute a process with ```sudo shutdown -r now```
 * and add the NodeJS executing user sudo permissions (e.g. add it to sudoers
 * with ```rumen ALL=/sbin/shutdown
 *         rumen ALL=NOPASSWD: /sbin/shutdown
 *      ```),
 * But with the module feels more native to me (it's written in C).
 * Note: To work again proper caps must be given to the NodeJS executable
 * So ```sudo setcap CAP_SYS_BOOT=+ep /usr/local/bin/node```
 * See ```man capabilities``` and {@link https://www.npmjs.com/package/reboot}
 */
function reboot() {
  logger.info("Rebooting");
  require("reboot").reboot();
  logger.info("Rebooting failed - probably no permissions");
}

function listFolder(folderName, callback) {
  fs.readdir(folderName, (err, files) => {
    if (err) return callback(err);

    // filter only the files
    files = files.filter((fileName) => {
      return fs.lstatSync(path.resolve(folderName, fileName)).isFile();
    });

    callback(null, files);
  });
}
