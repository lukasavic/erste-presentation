import './helpers/modernizr';
//import DomMethods from './helpers/dom-methods';
import breakPoints from '../shared-vars.json';
import io from 'socket.io-client';
import Vue from 'vue';
import videos from './manifest/video-manifest';
let socket = io();

// this will emit as the main for all others 

socket.on('disconnect', () => {
    socket.socket.reconnect();
});

socket.on('connect', () => {
    console.log('reconnect socket');
    socket.emit('masterPageEvent', { master: 'true' });
});



var app = new Vue({
    el: '#app',
    data: {
        isReady: false,
        message: 'Hello Vue!',
        defaultVolume: 1,
        countQuestions: 0,
        awardModule: false,
        busy: false,
        hold: false,
        appLoaded: false,
        endTimeOut: undefined,
        startTimeOut: undefined,
        helperTimeout: undefined,
        videoInterval: undefined,
        watchVideoInterval: undefined,
        videos: videos,
        callerName: "",
        currentVideo: false,
        callerSocketId: false,
        loadingNewVideo: false,
        newVideoActive: false,
        videoActive: false,
        answerVideoActive: false,
        mainVideoPrecentage: 0,
        mainVolume: 0.3,
        mainVideoSrc: '/assets/h264/intro-video.mp4' // '/assets/videos/video-1.mp4'
    },

    created: function(){
        //this.init();
    },

    mounted: function() {
        this.init();
    },

    methods: {

        init() {
            $('body').removeClass('no-js').addClass('js');
            // setup the stuff with 
            const body = document.body;
            body.classList.remove('no-js');
            body.classList.add('js');
            this.$refs.answerVideo.volume = 0;
            this.loadFirstVideo();
            this.setupSockets();
            this.isReady = true;


            // also hack
            setInterval(() => {
                if( this.newVideoActive == false && this.$refs.mainAudio.volume == 0 ) {
                    console.log('try to fix the volume');
                    this.dimmSoundUp(this.mainVolume);
                }
            }, 1500);

        },

        setupSockets() {

            socket.on('endVideo', (data) => {

                if( data.socketId == this.callerSocketId ) {
                    this.endVideo(data);
                }

            });

            socket.on('newQuestion',  (data) => {
                
                if( this.busy === true ) {
                    socket.emit('masterBusy', { socketId: data.socketId });
                    return; 
                }

                this.countQuestions++;
                this.busy = true;
                this.callerName = data.username;
                this.callerSocketId = data.socketId;  
                this.awardModule = false; 


                let theVideo = this.videos.find((item) => {
                    return item.id == data.videoId;
                });

                this.currentVideo = theVideo;

                this.loadNewVideo( theVideo, () => {

                    this.$refs.answerVideo.currentTime = 0;
                    this.$refs.answerVideo.play();
                    if( theVideo.hasOwnProperty('msg') ) {
                        theVideo.msg.emited = false;
                    }

                    this.watchVideo(data, theVideo);

                    this.helperTimeout = setTimeout (() => {
                        this.dimmSoundDown(0);

                        this.$refs.answerVideo.volume = 1;
                        this.newVideoActive = true; 
                        this.loadingNewVideo = false;
                        this.$refs.mainVideo.pause();
                        console.log('2222');

                    }, 1000 );
                    
                    

                });

            });

        },

        watchVideo(data, theVideo) {
            // QUICK;
            let hasMsg = theVideo.hasOwnProperty('msg');

            let answerVideo = this.$refs.answerVideo;
            this.watchVideoInterval = setInterval( () => {
                let currentTime = answerVideo.currentTime;

                if( hasMsg && answerVideo.currentTime > theVideo.msg.time && theVideo.msg.emited == false )  {

                    theVideo.msg.emited = true;
                    let msgRespn = Object.assign( data, theVideo.msg );
                    socket.emit('sendNewMsg', msgRespn );
                }

                if( answerVideo.currentTime >= ( answerVideo.duration - 4 ) ) {
                    clearInterval( this.watchVideoInterval );
                    this.endVideo(data, theVideo);
                    socket.emit('userVideoEnded', data );
                }
            }, 150);
        },


        showAward(award) {
            setTimeout( () => {
                this.awardModule = award;
                setTimeout( () => { 
                    this.awardModule = false; 
                    this.busy = false;
                    this.hold = false;
                }, 15000 );
            }, 1000 )
        },

        endVideo(data, theVideo) {
       
        console.log( 'Is Paused', this.$refs.answerVideo.paused );

        this.endTimeOut = setTimeout( () => {
            this.hold = true;

            if( data.socketId != this.callerSocketId ) {
                return;
            }

            //if( this.thisHe != undefined ) {
            clearTimeout( this.helperTimeout );
            //}

            /*
            if( this.endTimeOut != undefined ) {
                clearTimeout( this.endTimeOut );
            }
            */

            /*
            if( this.startTimeOut != undefined ) {
                clearTimeout( this.startTimeOut );
            }
            */

            if( this.videoInterval != undefined ) {
                clearInterval( this.videoInterval );
            }

            if( this.watchVideoInterval != undefined ) {
                clearInterval( this.watchVideoInterval );
            }

                this.$refs.mainVideo.play();
                setTimeout(() => this.dimmSoundUp(this.mainVolume), 200 );
                

                this.newVideoActive = false; 
                this.loadingNewVideo = false;

                this.fadeInVideoSound(this.$refs.mainVideo);
                this.fadeOutVideoSound(this.$refs.answerVideo, () => {
            
                    if( this.countQuestions == 1 ) {

                        this.showAward( { username: this.callerName, msg: " je osvojio/la nagradu za prvo postavljeno pitanje!" } );
                        
                    }  else {


                        console.log( theVideo );
                        if( theVideo != undefined && theVideo.hasOwnProperty('award') && theVideo.award.valid == true ) {
                           
                           theVideo.award.valid = false;
                           this.showAward( { username: this.callerName, msg: theVideo.award.msg } );

                        } else {

                            this.busy = false;
                            this.hold = false;

                        }
                    }
                });

            }, 0 );

        },

        loadNewVideo(newVideo, callback ) {
            this.newVideoActive = false;
            let answerVideo = this.$refs.answerVideo;

            this.fadeOutVideoSound(this.$refs.mainVideo);
            this.loadingNewVideo = true;
            answerVideo.volume = 0;

            // setup the video
            answerVideo.src = newVideo.videoUrl;
            answerVideo.currentTime = 0;

            let vFlag = 0;

            this.videoInterval = setInterval( ()  => {
                if( answerVideo.readyState > 0 && vFlag == 0 ) {
                    vFlag = 1;
                    answerVideo.play();
                }

                if( answerVideo.readyState > 0 ) {

                    let bufferedEnd = answerVideo.buffered.end(0),
                        duration = answerVideo.duration;

                   

                    let precentage = ((bufferedEnd / duration) * 100);
                    this.answerVideoPrecentage = Math.ceil(precentage);
                    answerVideo.currentTime = bufferedEnd;

                    if( precentage > 10 ) {

                        clearInterval( this.videoInterval );
                        if( typeof callback == 'function' ) {

                            callback();

                        }
                    }
                }

            }, 200 );
        },

        loadFirstVideo() {

            const mainVideo = this.$refs.mainVideo;
            
            mainVideo.src = this.mainVideoSrc;
            mainVideo.volume =  0; //this.defaultVolume;
            mainVideo.currentTime = 0;
            mainVideo.play();
            let vFlag = 0;
            

            let a = setInterval(() => {
                if( mainVideo.readyState > 0 && vFlag == 0 ) { 
                    vFlag = 1;
                    mainVideo.play();
                }

                if( mainVideo.readyState > 0 ) {
                    let bufferedEnd = mainVideo.buffered.end(0),
                        duration = mainVideo.duration;

                   

                    let precentage = ((bufferedEnd / duration) * 100);
                    this.mainVideoPrecentage = Math.ceil(precentage);
                    mainVideo.currentTime = bufferedEnd;

                    if( precentage >= 90 ) {

                        window.clearInterval(a);
                        this.mainVideoPrecentage = 100;
                        this.appLoaded = true;

                        setTimeout( () => {

                            mainVideo.pause();
                            mainVideo.currentTime = 0;
                            this.videoActive = true;
                            console.log(mainVideo);
                            mainVideo.play();

                            this.$refs.mainAudio.currentTime = 5;
                            this.$refs.mainAudio.volume = this.mainVolume;
                            this.$refs.mainAudio.play();
                            

                        }, 1400 );
                        
                    }
                }

            }, 200);
        },

        dimmSoundDown(value, callback) {
            let audio = this.$refs.mainAudio;
            let vol = audio.volume;
            let interval = 180;
            let fadeout = setInterval(
            function() {
                if (vol > value) {
                vol -= 0.05;
                if( vol <= value ) {
                    vol = value;
                }
                 audio.volume = vol;
                } else {
                    clearInterval(fadeout);
                        if( typeof callback == 'function' ) {
                            callback();
                    }
                }
            }, interval );
        },

        dimmSoundUp( value, callback) {
            //value = 0.3; // rewrite
            var audio = this.$refs.mainAudio;
            var vol = audio.volume;
            var interval = 200;

            var fadein = setInterval(
            function() {
                if ( vol < value  ) {
                vol += 0.05;
                if( vol >= value ) {
                    vol = value;
                }
                audio.volume = vol;
                }
                else {
                clearInterval(fadein);
                if( typeof callback == 'function' ) {
                    callback();
                }
                }
            }, interval );
        },

        fadeInVideoSound(videoRef, callback) {
            var selVideo = videoRef;
            var vol = selVideo.volume;

            var interval = 110;
            var fadein = setInterval(
            function() {
                if ( vol < 1  ) {
                vol += 0.05;
                if( vol >= 1 ) {
                    vol = 1;
                }
                selVideo.volume = vol;
                }
                else {
                clearInterval(fadein);
                if( typeof callback == 'function' ) {
                    callback();
                }
                }
            }, interval);
        },

        fadeOutVideoSound(videoRef, callback) {

            let selVideo = videoRef;
            let vol = selVideo.volume;
            let interval = 120; // 200ms interval
            let fadeout = setInterval(
            function() {
                if (vol > 0) {
                vol -= 0.05;
                if( vol < 0 ) {
                    vol = 0;
                }
                selVideo.volume = vol;
                }
                else {
                clearInterval(fadeout);
                if( typeof callback == 'function' ) {
                    callback();
                }
                }
            }, interval);
        }

    }
});