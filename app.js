const express = require('express');
const bodyParser = require('body-parser')
const { listenerCount } = require('multer-gridfs-storage');
const path = require('path');
const crypto = require('crypto')
const mongoose = require('mongoose');
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override');

const app = express();

//middleWare
app.use(bodyParser.json());
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

//Mongo URI
const mongoURL = "mongodb://localhost:27017"

//create mongo connection
const connection = mongoose.createConnection(mongoURL)

//init gfs
let gfs;

connection.once('open', () => {
    // Init stream
    gfs = Grid(connection.db,mongoose.mongo);
    gfs.collection('uploads');
})

//create storage engine
const storage = new GridFsStorage({
    url: mongoURL,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

  //@route POST /upload
//@desc Loads form
app.get('/',(req,res)=>{
res.render('index');
});

//@route POST /upload
//@desc Uploads file to DB
app.post('/upload',upload.single('file'),(req,res)=>{
res.json({file:req.file});
})


const port = 5000

app.listen(port,()=>
    console.log(`Server started on port ${port}`));