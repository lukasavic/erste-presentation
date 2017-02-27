import './helpers/modernizr';
//import DomMethods from './helpers/dom-methods';
import io from 'socket.io-client';
import videos from './manifest/video-manifest';
import Vue from 'vue';
let socket = io();

console.log( 'Videos', videos );

let store = {
    socketId: null
}


socket.on('error', function (e) {
    socket.disconnect();
    setTimeout(function () {
        socket.connect();
    }, 1000);
});

setInterval( () => { 
    if( socket.connected == false ) {
        socket.disconnect();
        socket.connect();
    }
}, 1000)  ;
socket.on('initNewDevice', function (socketId) { 
    store.socketId = socketId;
});

/*
let button = $('.demo-button');
button.click(function(e){

    e.preventDefault();
    console.log('clicked');
    socket.emit('onQuestion', { socketId: store.socketId, video: "somesampleVideo", userName: "Luka" });

});
*/


window.app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
        userName: "",
        calling: false,
        currentItem: false,
        userModalDone: false,
        questions: videos,
        msgModalOpen: false,
        msgOpen: false,
        currentMsg: false,
        busy: false,
        masterTimeout: undefined
    },

    mounted: function() {
        this.init();
    },

    methods: {

        init() {
            $('body').removeClass('no-js').addClass('js');
            //this.currentItem = this.questions[0];
            console.log('working');
             socket.on('askedQuestion', (data) => {

                 let theVideo = this.questions.find( item => item.id == data.videoId );
                 setTimeout(() => theVideo.asked = true, 200 )

             });

             socket.on('masterIsBusy', (data) => {
                 this.busy = true;
                 this.masterTimeout = setTimeout(() => {
                    this.removeCallModal();
                 }, 3500);
             });

             socket.on('userVideoEnded', (data) => {
                this.removeCallModal();
             });

             socket.on('newMessage', (data) => {
                this.$refs.msgAudio.currentItem = 0;
                this.$refs.msgAudio.play();
                this.currentMsg = data;
                console.log(  'currentMsg', JSON.parse( JSON.stringify( this.currentMsg ) ) );
                this.msgModalOpen = true;
             });


             socket.on( 'sendUserMsg', (data) => {
                this.$refs.msgAudio.currentItem = 0;
                this.$refs.msgAudio.play();
                this.currentMsg = data;
                this.msgModalOpen = true;
             });

             
        },

        call( item ) {
            clearTimeout(this.masterTimeout);
            this.currentItem = item;
            socket.emit('onQuestion', { socketId: store.socketId, videoId: item.id, username: this.userName });
            this.calling = true;

        },

        hangUp() {
            socket.emit('endQuestion', { socketId: store.socketId, videoId: this.currentItem.id, username: this.userName });
            this.removeCallModal();
            this.removeCallModal();
        },

        removeCallModal() {
            this.calling = false;
            this.busy = false;
        },

        onSubmit() {
            this.userModalDone = true;
        },

        showMsg() {

            this.msgOpen = true;

        },

        closeMsg() {

            this.msgModalOpen = false;
            this.msgOpen = false;
            setTimeout(()=>{
                this.currentMsg = false;
            });
        },

        shareMsg() {

            console.log( 'share msg' );
            this.currentMsg.canShare = false
            this.currentMsg.from = this.userName;
            socket.emit('sendMsgAll', this.currentMsg );
           // this.closeMsg();

        }

    }
});

console.log( 'Mobile working' );