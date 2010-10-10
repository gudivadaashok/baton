var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    configuration = require('../lib/configuration'),
    sys = require('sys'),
    pub = require('./controllers/publish_controller'),
    sub = require('./controllers/subscribe_controller');

function App() {
  var _this = this;
  this.m = {};
  
  function model(name, file) {
    var loaded = require('./models/' + file).load(_this);
    if (loaded) {
      _this.m[name] = loaded;
    }
  }
  
  model("ChannelManager", "channel_manager");
  model("Channel", "channel");
  model("Message", "message");
  
  this.start = function(arguments) {
    var config = configuration.parse(arguments),
    send404 = function(res) {
      res.writeHead(404);
      res.write('404 Not Found');
      res.end();
    },
    channelManager = new _this.m.ChannelManager(_this, config),
    publishEndpoint = pub.createPublisherEndpoint(_this, config, channelManager),
    publisherServer = http.createServer(function(req, res) {
      var path = url.parse(req.url).pathname;

      if (publishEndpoint.handle(path, req, res)) { return; }

      switch (path) {
        case '/':
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write('<h1>Welcome to baton publisher endpoint.</h1>');
          res.end();
          break;

        default:
          send404(res);
          break;
      }
    });
    publisherServer.listen(config.publishPort, config.publishIpAddress);
    sub.startSubscriberServer(config, channelManager);
  };
}
exports.load = function() {
  return new App();
};
