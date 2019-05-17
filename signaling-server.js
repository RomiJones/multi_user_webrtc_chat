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
var privateKey = fs.readFileSync('./zs_pri.key');
var certificate = fs.readFileSync('./zs_pub.crt');
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

var allrooms = {};
var sockets = {};
var theHandler = function (socket) {
    console.log("["+ socket.id + "] connection accepted");
	
    socket.room_id = "unkown";  //本socket加入的房间号
    sockets[socket.id] = socket;//本socket加入全局sockets
    
    socket.on('disconnect', function () {
        console.log("["+ socket.id + "] disconnected");
        leave(socket.room_id)
        delete sockets[socket.id];
    });

    socket.on('join', function (config) {
        console.log("["+ socket.id + "] join ", config);
		
        var room_id = config.roomid.toString();
        var userdata = config.userdata;

        socket.room_id = room_id;
		
		//这个socket要加入的room_id名的插入全局allrooms
        if(!(room_id in allrooms)){
            allrooms[room_id] = {};
        }
		
		//同一个room中的
        for (tmp_s_id in allrooms[room_id]) {
			//对n-1个端(除了己端)都发送addPeer命令，要求每个端都建立peerconnect，用于等待接收offer
			//对应于每个端，也对己端发送addPeer命令,发送n-1个，准备发起createOffer
            allrooms[room_id][tmp_s_id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false});
            socket.emit('addPeer', {'peer_id': tmp_s_id, 'should_create_offer': true});
        }
		
        //保存join到此room的全部用户的socket
        //在服务端socket.id唯一标识一个用户
        allrooms[room_id][socket.id] = socket;
    });

    function leave(room_id) {
        console.log("["+ socket.id + "] leave ");
        if(room_id != socket.room_id){
            console.log("error : room_id not match when a user leave[" + room_id + " | " + socket.room_id + "]");
        }

        if(allrooms[room_id] != null && allrooms[room_id][socket.id] != null){
            delete allrooms[room_id][socket.id];
        }

        for (tmp_s_id in allrooms[room_id]) {
            allrooms[room_id][tmp_s_id].emit('removePeer', {'peer_id': socket.id});
            socket.emit('removePeer', {'peer_id': tmp_s_id});
        }
    }
	
    socket.on('leave', leave);

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
