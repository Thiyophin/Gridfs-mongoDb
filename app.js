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
const { response } = require('express');

const app = express();

//middleWare
app.use(bodyParser.json());
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');

//Mongo URI
const mongoURL = "mongodb://localhost:27017/test"

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
  gfs.files.find().toArray((err,files)=>{
    // Check if files
    if(!files || files.length === 0){
     res.render('index',{files : false});
    }else{
      files.map(files=>{
        if(files.contentType==='image/jpeg' || files.contentType === 'image/png'){
          files.isImage = true;
        }else{
          files.isImage = false;
        }
      })
      res.render('index',{files : files});
    }
  })
});

//@route POST /upload
//@desc Uploads file to DB
app.post('/upload',upload.single('file'),(req,res)=>{
 // res.json({ file: req.file });
 res.redirect('/');
})

// @route GET /files
// @desc Display all files in JSON
app.get('/files',(req,res)=>{
  gfs.files.find().toArray((err,files)=>{
    // Check if files
    if(!files || files.length === 0){
      return res.status(404).json({
        err:'No files exist'
      })
    }

// Files exist
return res.json(files);

  })
})

// @route GET /image/:filename
// @desc Display single file
app.get('/image/:filename',(req,res)=>{
  gfs.files.findOne({filename : req.params.filename},(err,files)=>{
    // Check if files
    if(!files || files.length === 0){
      return res.status(404).json({
        err:'No files exist'
      })
    }

// Check if image
if(files.contentType === 'image/jpeg' || files.contentType === 'img/png'){
     // Read output to browser
     const readstream = gfs.createReadStream(files.filename);
     readstream.pipe(res);
}else{
  res.status(404).json({
    err:'Not an image'
  })
}
  })
})

//@route DELETE /files/:id
// DESC Delete file
app.delete('/files/:id',(req,res)=>{
  gfs.remove({_id:req.params.id,root:'uploads'},(err,gridStore)=>{
    if(err){
      return res.status(404).json({err:err})
    }else{
      res.redirect('/')
    }
  });
})

const port = 5000

app.listen(port,()=>
    console.log(`Server started on port ${port}`));