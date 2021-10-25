const { syncAndSeed } =  require('./db');
const app = require('./app');

// console.log('jwt', process.env.JWT)

const init = async()=> {
  await syncAndSeed();
  const port = process.env.PORT || 8080;
  app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();
