const SMARTTV_IP = '10.241.10.15';
const SMARTTV_PORT = '26101';

const PACKAGE = 'abcdeabcde';
const APP = 'Iframe';

const TIZEN_STUDIO = '~/tizen-studio';
const JAVA_HOME = '/Library/Java/JavaVirtualMachines/jdk1.8.0_151.jdk/Contents/Home';
const DST_FOLDER = '/tmp/zzz';

//////////////////////////////////////////
/// Assuming Mac/Linux file system.
//////////////////////////////////////////

const fs = require('fs');
const cp = require('child_process');

const express = require('express');
const bodyParser = require('body-parser');
const multer  = require('multer');

const upload = multer({ dest: '/tmp/' });

const PORT = 6633;

const app = express();
app.set('x-powered-by', false);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser());

const index = fs.readFileSync('index.html').toString();
const feedback = fs.readFileSync('feedback.html').toString();

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(index);
  res.end();
});

app.get('/favicon.ico', (req, res) => {
  res.status(404).end();
});

function returnFeedback(res, content) {
  res.setHeader('Content-Type', 'text/html');
  res.send( replaceTemplateVar(feedback, 'CONTENT', content) );
  res.end();
}

app.post('/iframe', (req, res) => {
  const ip = req.body.ip;
  const port = req.body.port;

  packageIframe(ip, port, (err, out) => {
    returnFeedback(res, out);
  });
});

app.post('/receive', upload.single('package'), (req, res) => {
  deployFile((err, out) => {
    returnFeedback(res, out);
  });
});

// app.all('*', (req, res) => {});

app.listen(PORT);
console.log('tizen-relay running on port %s ...', PORT);

// TASKS

function packageIframe(ip, port, cb) {
  prepareIframeFolder({
    PACKAGE: PACKAGE,
    APP: APP,
    IP: ip,
    PORT: port,
    HEAD: '',
    HEAD_OLD: `<script src="http://${ip}:8899/js/remote.js?bt"></script>` // use this one to run a local instance of jsconsole on port 8899
  });

  package((err, out) => {
    if (err) { return cb(null, out); }

    deployFile((err, out2) => {
      cb(null, out + out2);
    });
  });
}

function deployFile(cb) {
  connect((err, out) => {
    if (err) { return cb(null, out); }

    deploy((err, out2) => {
      cb(null, out + out2);
    });
  });
}

// tizen commands

const TARGET = `${SMARTTV_IP}:${SMARTTV_PORT}`;
const PATH = `${process.env.PATH}:${TIZEN_STUDIO}/tools/ide/bin:${TIZEN_STUDIO}/tools`;

const ENV = {
  TIZEN_STUDIO: TIZEN_STUDIO,
  JAVA_HOME:    JAVA_HOME,
  PATH:         PATH,
  TARGET:       TARGET
};

const OUTPUT_TO_CONSOLE = true;

function cbFactory(cb) {
  return function(err, stdout, stderr) {
    const out = stdout + stderr;
    if (OUTPUT_TO_CONSOLE) console.log(out);
    cb(err, out);
  };
}

function connect(cb) {
  cp.exec(`sdb connect ${TARGET}`, {env:ENV}, cbFactory(cb));
}

function package(cb) {
  cp.exec(`tizen package -t wgt -- ${DST_FOLDER}`, {env:ENV}, cbFactory(cb));
}

function deploy(cb) {
  cp.exec(`tizen install -s ${TARGET} -n ${APP}.wgt -- ${DST_FOLDER}`, {env:ENV}, cbFactory(cb));
}

function run(cb) { // @TODO NOT WORKING YET
  cp.exec(`tizen run -s ${TARGET} -p ${APP}`, {env:ENV}, cbFactory(cb));
}

// AUX STUFF

function prepareIframeFolder(placeholders) {
  const SRC_FOLDER = './iframeTemplate';
  cp.execSync(`rm -rf ${DST_FOLDER}`);
  cp.execSync(`mkdir ${DST_FOLDER}`);
  transformFile(`${SRC_FOLDER}/config.xml`, `${DST_FOLDER}/config.xml`, placeholders);
  transformFile(`${SRC_FOLDER}/iframe.html`, `${DST_FOLDER}/iframe.html`, placeholders);
}

function replaceTemplateVar(s, varName, value) {
  return s.replace( new RegExp('\\$' + varName, 'gm') , value);
}

function transformFile(srcPath, dstPath, placeholders) {
  let s = fs.readFileSync(srcPath).toString();
  for (let k of Object.keys(placeholders)) {
    s = replaceTemplateVar(s, k, placeholders[k]);
  }
  fs.writeFileSync(dstPath, s);
}