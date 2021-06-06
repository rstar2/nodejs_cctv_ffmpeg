const path = require('path');

const express = require('express');
const app = express();

const PORT_APP = process.env.PORT_APP || 3000;
const PORT_WEBSOCKET = process.env.PORT_WEBSOCKET || 9999;

// return the video websocket server port
app.get('/wsport', (req, res) => res.send('' + PORT_WEBSOCKET));

// redirect to the static index.html
app.get('/', (req, res) => res.redirect('/index.html'));

// serve all static resources
app.use(express.static(path.resolve(__dirname, 'public')));

app.listen(PORT_APP, () => {
  console.log(`App listening on port ${PORT_APP}`);
});
