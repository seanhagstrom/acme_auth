const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');

const requireToken = async (req, res, next) => {
  try {
    req.user = await User.byToken(req.headers.authorization);
    next();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

// GET /api/notes/:userID **get all notes by userid**
app.get('/api/users/notes', requireToken, async (req, res, next) => {
  try {
    const user = req.user;

    const userNotes = await Note.findAll({
      where: { userId: user.id },
    });
    res.json(userNotes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
