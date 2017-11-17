var HTTP_PORT = 3100;
var HTTPS_PORT = 3101;

const fs = require('fs');
var path = require("path");
var express = require('express');
var bodyParser = require('body-parser')

//----server app-----
var app = express()

//----http server----
var httpServer = require("http").createServer(app);
httpServer.listen(HTTP_PORT, function(){
	console.log("http listening on port " + HTTP_PORT);
});

//----https server----
var privateKey = fs.readFileSync('./tongbupan_new_ssl_private.key');
var certificate = fs.readFileSync('./tongbupan1.crt');
var credentials = {key: privateKey, cert: certificate};
var httpsServer = require('https').createServer(credentials, app);
httpsServer.listen(HTTPS_PORT, null, function() {
    console.log("https listening on port " + HTTPS_PORT);
});

//app.use(express.bodyParser());
app.get("/", function(req, res){res.sendFile(__dirname + '/client.html');});
app.use("/static", express.static(path.join(__dirname, "webstatic")));

//----websocket server----
var io = require('socket.io').listen(httpServer);
var io_ssl = require('socket.io').listen(httpsServer);

var channels = {};
var sockets = {};
var theHandler = function (socket) {
    console.log("["+ socket.id + "] connection accepted");
	
	socket.channels = {};		//本socket新增一个channels属性,保存socket加入到全部channel的名称
    sockets[socket.id] = socket;//本socket加入全局sockets
    
    socket.on('disconnect', function () {
        for (var channel in socket.channels) {
            part(channel);
        }
        console.log("["+ socket.id + "] disconnected");
        delete sockets[socket.id];
    });

    socket.on('join', function (config) {
        console.log("["+ socket.id + "] join ", config);
		
        var channel = config.channel;
        var userdata = config.userdata;

        if (channel in socket.channels) {
            console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }
		
		//这个socket要加入的channel名的插入全局channels，channel有点类似room的概念
        if (!(channel in channels)) {
            channels[channel] = {};
        }
		
		//同一个channel(同一个room)中的
        for (id in channels[channel]) {
			//对n-1个端(除了己端)都发送addPeer命令，要求每个端都建立peerconnect，用于等待接收offer
			//对应于每个端，也对己端发送addPeer命令,发送n-1个，准备发起createOffer
            channels[channel][id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true});
        }
		
        channels[channel][socket.id] = socket;  //在channel中保存join到此channel的全部用户的socket，在服务端socket.id唯一标识一个用户
        socket.channels[channel] = channel;		
    });

    function part(channel) {
        console.log("["+ socket.id + "] part ");

        if (!(channel in socket.channels)) {
            console.log("["+ socket.id + "] ERROR: not in ", channel);
            return;
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];

        for (id in channels[channel]) {
            channels[channel][id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': id});
        }
    }
	
    socket.on('part', part);

    socket.on('relayICECandidate', function(config) {
        var peer_id = config.peer_id;
        var ice_candidate = config.ice_candidate;
        console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ", ice_candidate);

        if (peer_id in sockets) {
            sockets[peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
        }
    });

    socket.on('relaySessionDescription', function(config) {
        var peer_id = config.peer_id;
        var session_description = config.session_description;
        console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ", session_description);

        if (peer_id in sockets) {
            sockets[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
        }
    });
};

//同时支持http和https
io.sockets.on('connection', theHandler);
io_ssl.sockets.on('connection', theHandler);
