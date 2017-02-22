// Simple server

const express = require('express');
const app = express(); 
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const redis = require("redis");
const redisClient = redis.createClient();

app.use('/', express.static(path.join(__dirname + '/')));

app.get('/', function(req, res){
    res.sendFile( __dirname + '/index.html' );
});


io.on('connection', function(socket){

  // send back socketID back to the new user/device
  io.to(socket.id).emit( 'initNewDevice', socket.id ); 

  // store master socket ID
  socket.on('masterPageEvent', function(msg){
    console.log('masterID', socket.id );
    redisClient.set("masterID", socket.id, redis.print);
  });


  socket.on('masterBusy', function( msg ){
    io.to(msg.socketId).emit( 'masterIsBusy', msg );
  });

  socket.on('endQuestion', function( msg ){

     redisClient.get("masterID", function(err, reply){
        let masterID = reply;
        io.to(masterID).emit( 'endVideo', msg );
    });

  });


  // when video ends
  socket.on('userVideoEnded', function(msg){
    io.to(msg.socketId).emit( 'userVideoEnded', msg );
  });

  // controll the messages
  socket.on('sendNewMsg', function(msg){
    console.log('msgggg', msg );
    if( msg.emit == 2 ) {

      io.emit( 'newMessage',  msg );

    } else {
      
      io.to(msg.socketId).emit( 'newMessage',  msg );
    }
  });

  // shareMsg
  socket.on('sendMsgAll', function(msg) {
    console.log( 'sendUserMsg', msg );
    //io.emit( include_self=false, 'sendUserMsg', msg );
    socket.broadcast.emit('sendUserMsg', msg );
  });

  // send message to main page 
  socket.on('onQuestion', function(msg){

    io.emit( 'askedQuestion', msg );

    redisClient.get("masterID", function(err, reply){

        let masterID = reply;
        io.to(masterID).emit( 'newQuestion', msg );

    });
    
  });

  socket.on('disconnect', function(){
    //console.log('user disconnected');
  });

});


app.get('/mobile', function(req, res){
    res.sendFile( __dirname + '/mobile.html' );
});

http.listen(3001, function(){
    console.log( 'listen on *: 3001' );
});