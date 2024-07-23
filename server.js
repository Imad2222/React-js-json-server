const jsonServer = require('json-server');
const multer = require('multer');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const adminRouter = jsonServer.router('db2.json');
const middlewares = jsonServer.defaults();
const bodyParser = require('body-parser');

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// To handle POST, PUT and PATCH you need to use a body-parser
server.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    let date = new Date();
    let imageFilename = date.getTime() + "_" + file.originalname;
    req.body.imageFilename = imageFilename;
    cb(null, imageFilename);
  }
});

const upload = multer({ storage: storage }).any();

// Endpoint for admin login
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const admins = adminRouter.db.get('admins').value();
  const admin = admins.find(admin => admin.email === email && admin.password === password);

  if (admin) {
    res.status(200).json({ message: 'Login successful', admin });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// Middleware for checking authentication before accessing admin routes
server.use((req, res, next) => {
  if (req.path.startsWith('/admin') && !req.headers.authorization) {
    res.status(401).json({ error: 'Unauthorized' });
  } else {
    next();
  }
});

// create product
server.post("/products", upload, (req, res, next) => {
  let date = new Date();
  req.body.createdAt = date.toISOString();

  if (req.body.price) {
    req.body.price = Number(req.body.price);
  }

  let hasErrors = false;
  let errors = {};

  if (req.body.name.length < 2) {
    hasErrors = true;
    errors.name = "Name must be at least 2 characters long";
  }
  if (req.body.price < 0) {
    hasErrors = true;
    errors.price = "Price must be a positive number";
  }

  if (req.body.brand.length < 2) {
    hasErrors = true;
    errors.brand = "Name must be at least 2 characters long";
  }

  if (hasErrors) {
    res.status(400).jsonp(errors);
    return;
  }

  // Continue to JSON Server router
  next();
});

// Use default router
server.use(router);
server.use('/admins', adminRouter);
server.listen(4000, () => {
  console.log('JSON Server is running');
});
