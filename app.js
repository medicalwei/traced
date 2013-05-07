
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , crypto = require('crypto');

var app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var sockets = {};

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var genID = function(req, res){
  crypto.randomBytes(4, function(ex, buf){
    var id = buf.toString('hex');

    // Prevent duplication
    if (sockets[id]){
      genID(req, res);
      return;
    }

    sockets[id] = {stat: "ready",
                   selfdestroy: setTimeout(function(){destroy(id)}, 60000)};
    console.log("id "+id+" created");
    res.redirect('/'+id);
  });
};

var destroy = function(id){
  delete(sockets[id]);
  console.log("id "+id+" destroyed");
};

app.get('/', function(req, res){
  res.render('index');
});

app.post('/', genID);

app.get('/:id', function(req, res){
  var id = req.params.id;
  if (sockets[id]){
    var userinfo = {
      time: new Date(),
      ip: req.ip,
      ua: req.get('User-Agent')
    };
    if(sockets[id].stat == "ready"){
      // first person open this page: start the log
      sockets[id].user = userinfo;
      res.render('log', { id: id });
    } else {
      // this user is being traced by other person
      sockets[id].socket.emit('trace', userinfo);
      // tell the tracer i am ok (?)
      res.send(200);
    }
  } else {
    res.send(404);
  }
});

io.sockets.on('connection', function(socket){
  socket.emit('id');
  socket.on('set id', function (id){
    if (sockets[id] && sockets[id].stat == "ready"){
      clearTimeout(sockets[id].selfdestroy);
      socket.set('id', id, function(){
        sockets[id].socket = socket;
        sockets[id].stat = "running";
        socket.emit('trace', sockets[id].user);
      });
    }
  });
  socket.on('disconnect', function (){
    socket.get('id', function(err, id){
      destroy(id);
    });
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
