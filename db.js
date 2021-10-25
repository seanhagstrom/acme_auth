const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false,
};
const SECRET_KEY = process.env.JWT;

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: {
    type: Sequelize.STRING,
  },
});

Note.belongsTo(User);
User.hasMany(Note);

User.byToken = async (token) => {
  try {
    // jwt token -> userid
    const payload = jwt.verify(token, SECRET_KEY);
    const user = await User.findByPk(payload.userId);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  const match = await bcrypt.compare(password, user.password);
  console.log('match here', match);
  if (match) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);
    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async (user) => {
  const saltRounds = 10;
  // console.log(user.password);
  const hashed = await bcrypt.hash(user.password, saltRounds);
  // console.log(hashed);
  user.password = hashed;
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );

  const notes = [
    {
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem dolor sed viverra ipsum nunc aliquet bibendum enim facilisis. Massa vitae tortor condimentum lacinia quis vel eros donec.',
    },
    {
      text: 'Pretium nibh ipsum consequat nisl vel pretium lectus. Sagittis aliquam malesuada bibendum arcu vitae. Dolor sit amet consectetur adipiscing. Bibendum est ultricies integer quis auctor elit sed vulputate mi.',
    },
    {
      text: 'Tellus rutrum tellus pellentesque eu tincidunt tortor aliquam nulla. Leo a diam sollicitudin tempor id eu. Commodo quis imperdiet massa tincidunt nunc pulvinar. Mi quis hendrerit dolor magna eget est lorem ipsum dolor. ',
    },
    {
      text: 'Another note',
    },
  ];
  const [note1, note2, note3, note4] = await Promise.all(
    notes.map((note) => Note.create(note))
  );

  await lucy.addNote(note1);
  await moe.addNotes([note2, note4]);
  await larry.addNote(note3);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
