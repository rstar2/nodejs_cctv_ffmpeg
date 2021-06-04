const path = require('path');

const express = require('express');
const app = express();

app.get('/', (req, res) => res.redirect('/index.html'));
app.use(express.static(path.resolve(__dirname, 'public')));

app.listen(3000, () => {
  console.log('App listening on port 3000!');
});
