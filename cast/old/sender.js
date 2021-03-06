// Copyright 2014 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * global variables
 */
var applicationID = '941E4CC3';
var MESSAGE_NAMESPACE = 'urn:x-cast:com.google.cast.sample.mediaplayer';
var currentMedia = null;
var currentVolume = 0.5;
var progressFlag = 1;
var mediaCurrentTime = 0;
var session = null;
var mediaURLs = [
           'http://commondatastorage.googleapis.com/gtv-videos-bucket/dash/BigBuckBunny/bunny_10s/BigBuckBunny_10s_isoffmain_url_relative_DIS_23009_1_v_2_1c2_2011_08_30.mpd',
           'http://yt-dash-mse-test.commondatastorage.googleapis.com/media/car-20120827-manifest.mpd',
           'http://www.corsproxy.com/playertest.longtailvideo.com/adaptive/bbbfull/bbbfull.m3u8',
           'http://www.corsproxy.com/stream.gravlab.net/003119/sparse/v1d30/posts/2014/barcelona/barcelona.m3u8',
           'http://www.corsproxy.com/devimages.apple.com.edgekey.net/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
           'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
           'http://playready.directtaps.net/smoothstreaming/SSWSS720H264PR/SuperSpeedway_720.ism/Manifest'];
var mediaTitles = [
           'Big Buck Bunny',
           'Public DASH: CAR',
           'Big Buck Bunny HLS',
           'Gravlab HLS',
           'Apple HLS',
           'Super Speedway SS',
           'Super Speedway SS PlayReady'];

var mediaTypes = [
           'video/mp4',
           'video/mp4',
           'video/mp4',
           'application/vnd.apple.mpegurl',
           'application/vnd.apple.mpegurl',
           'application/vnd.apple.mpegurl',
           'text/xml',
           'text/xml'];

var currentMediaURL = mediaURLs[0];
var currentMediaIndex = 0;

var initialTimeIndexSeconds = 0;

var timer = null;

/**
 * Call initialization
 */
if (!chrome.cast || !chrome.cast.isAvailable) {
  setTimeout(initializeCastApi, 1000);
}

/**
 * initialization
 */
function initializeCastApi() {
  var sessionRequest = new chrome.cast.SessionRequest(applicationID);
  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
    sessionListener,
    receiverListener);

  chrome.cast.initialize(apiConfig, onInitSuccess, onError);

  code = '  var sessionRequest = new chrome.cast.SessionRequest(appID);\n\n' + 
    '  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,\n\n' +
    '    sessionListener,\n\n' +
    '    receiverListener);\n\n' +
    '  chrome.cast.initialize(apiConfig, onInitSuccess, onError);';
  showCodeSnippet(code, 'sender');
};

/**
 * initialization success callback
 */
function onInitSuccess() {
  appendMessage("init success");
}

/**
 * initialization error callback
 */
function onError() {
  console.log("error");
  appendMessage("error");
}

/**
 * generic success callback
 */
function onSuccess(message) {
  console.log(message);
}

/**
 * callback on success for stopping app
 */
function onStopAppSuccess() {
  console.log('Session stopped');
  appendMessage('Session stopped');
}

/**
 * session listener during initialization
 */
function sessionListener(e) {
  console.log('New session ID: ' + e.sessionId);
  appendMessage('New session ID:' + e.sessionId);
  session = e;
  if (session.media.length != 0) {
    appendMessage(
        'Found ' + session.media.length + ' existing media sessions.');
    onMediaDiscovered('sessionListener', session.media[0]);
  }
  session.addMediaListener(
      onMediaDiscovered.bind(this, 'addMediaListener'));
  session.addUpdateListener(sessionUpdateListener.bind(this));  
  session.addMessageListener(MESSAGE_NAMESPACE, onReceiverMessage.bind(this));
}


/**
 * handle message from receiver app
 * @param {string} namespace A message string
 * @param {string} message A message string
 */
function onReceiverMessage(namespace, message) {
  var messageJSON = JSON.parse(message);
  console.log(namespace + ':' + message);
  var captions_div = document.getElementById('captions');
  if( messageJSON['captions'] ) {
    var captions = messageJSON['captions'];
    captions_div.innerHTML = '';
    for (var i in captions) {
      var input = document.createElement('input');
      input.type = 'submit';
      input.onclick = (function() {
        var currentI = i;
        return function() { 
          setCaptions(currentI);
        };
      })();
      input.value = captions[i];
      captions_div.appendChild(input);
    }
    document.getElementById('instream_caption_div').style.display = 'block';
  } else if( messageJSON['video_bitrates'] ) {
    var video_bitrates = messageJSON['video_bitrates'];
    video_bitrates_div.innerHTML = 'Video Bitrates:';
    for (var i in video_bitrates) {
      var input = document.createElement('input');
      input.type = 'submit';
      input.onclick = (function() {
        var currentI = i;
        return function() { 
          setQualityLevel(currentI, 'video');
        };
      })();
      input.value = video_bitrates[i];
      input.style.fontSize='5px';
      input.style.margin='3px';
      video_bitrates_div.appendChild(input);
    }
  } else if( messageJSON['audio_bitrates'] ) {
    var audio_bitrates = messageJSON['audio_bitrates'];
    audio_bitrates_div.innerHTML = 'Audio Bitrates:';
    for (var i in audio_bitrates) {
      var input = document.createElement('input');
      input.type = 'submit';
      input.onclick = (function() {
        var currentI = i;
        return function() { 
          setQualityLevel(currentI, 'audio');
        };
      })();
      input.value = audio_bitrates[i];
      input.style.fontSize='5px';
      input.style.margin='3px';
      audio_bitrates_div.appendChild(input);
    }
  }
}

/**
  }
}

/**
 * @param {boolean} isAlive A boolean
 * true for session being live
 */
function sessionUpdateListener(isAlive) {
  var message = isAlive ? 'Session Updated' : 'Session Removed';
  message += ': ' + session.sessionId;
  appendMessage(message);
  if (!isAlive) {
    session = null;
    var playpauseresume = document.getElementById("playpauseresume");
    playpauseresume.innerHTML = 'Play Media';
    if( timer ) {
      clearInterval(timer);
    }
  }
};

/**
 * receiver listener during initialization
 * @param {string} e A message string
 */
function receiverListener(e) {
  if( e === 'available' ) {
    console.log("receiver found");
    appendMessage("receiver found");
  }
  else {
    console.log("receiver list empty");
    appendMessage("receiver list empty");
  }
}

/*e
 * select a media URL 
 * @param {string} m An index for media URL
 */
function selectMedia(m) {
  console.log("media selected" + m);
  appendMessage("media selected" + m);
  currentMediaIndex = m;
  currentMediaURL = mediaURLs[m]; 

  var alertmessage = document.getElementById('alertmessage');
  if( m == 0 ) {
    alertmessage.value = "MPEG-DASH stream\nRead about api: Host, Player and protocol";
  }
  else if( m == 1 ) {
    alertmessage.value = "MPEG-DASH stream\nLearn more about MSE, EME and DRM";
  }
  else if( m == 2 ) {
    alertmessage.value = "This HLS stream requires CORS\nRead more at https://developers.google.com/cast/docs/player\nHere http://www.corsproxy.com/ is used.";
  }
  else if( m == 3 ) {
    alertmessage.value = "This HLS stream requires CORS\nProxy server http://www.corsproxy.com/ is used";
  }
  else if( m == 4 ) {
    alertmessage.value = "This requires CORS and has 8 in-streams captions in 4 languages that you can choose to enable\nProxy server http://www.corsproxy.com/ is used";
  }
  else if( m == 5 ) {
    alertmessage.value = "SS stream with no PlayReady DRM\nPlay with external captions in WebVTT or TTML";
  }
  else if( m == 6 ) {
    alertmessage.value = "PlayReady DRM with license server:\n http://playready.directtaps.net/pr/svc/rightsmanager.asmx";
    document.getElementById('license').style.display = 'block';
  }
  else {
  }
  
  // reset video and audio quality index
  sendMessage({'type':'qualityIndex','value':-1, 'mediaType':'video'});
  sendMessage({'type':'qualityIndex','value':-1, 'mediaType':'audio'});
}


/**
 * enter a media URL
 * @param {string} m An media URL
 */
function setMyMediaURL(e) {
  if( e.value ) {
    currentMediaURL = e.value;
  }
}

/**
 * launch app
 */
function launchApp() {
  console.log("launching app...");
  appendMessage("launching app...");
  chrome.cast.requestSession(onRequestSessionSuccess, onLaunchError);

  code = '  chrome.cast.requestSession(onRequestSessionSuccess, ...);\n\n' + 
      '  onRequestSessionSuccess() {\n' +
      '    session = e;\n' + 
      '    session.addMessageListener(MESSAGE_NAMESPACE,\n' + 
      '    onReceiverMessage.bind(this));\n' + 
      '  }';
    
  showCodeSnippet(code, 'sender');

  code = '  mediaManager = new cast.receiver.MediaManager(mediaElement);\n\n' +
      '  var appConfig = new cast.receiver.CastReceiverManager.Config();\n' +
      '  castReceiverManager = cast.receiver.CastReceiverManager.getInstance();\n' +
      '  castReceiverManager.start(appConfig);\n\n';
    
  showCodeSnippet(code, 'receiver');
}

/**
 * callback on success for requestSession call  
 * @param {Object} e A non-null new session.
 */
function onRequestSessionSuccess(e) {
  console.log("session success: " + e.sessionId);
  appendMessage("session success: " + e.sessionId);
  session = e;
  session.addMessageListener(MESSAGE_NAMESPACE, onReceiverMessage.bind(this));
}

/**
 * callback on launch error
 */
function onLaunchError() {
  console.log("launch error");
  appendMessage("launch error");
}

/**
 * stop app/session
 */
function stopApp() {
  session.stop(onStopAppSuccess, onError);
  if( timer ) {
    clearInterval(timer);
  }

  code = '  session.stop(success, error);\n';
  showCodeSnippet(code, 'sender');

  code = '  // save original and override onStop\n' +
       '  mediaManager.onStop = function(event) {\n' + 
       '    // your custom code\n' +
       '    mediaManager[\'onStopOrig\'](event);\n' +
       '  }\n';
  showCodeSnippet(code, 'receiver');
}


/**
 * load media specified by custom URL
 */
function loadCustomMedia() {
  var customMediaURL = document.getElementById('customMediaURL').value;
  if( customMediaURL.length > 0 ) {
    loadMedia(customMediaURL);
  }
}

/**
 * load media
 * @param {string} i An index for media
 */
function loadMedia(mediaURL) {
  if (!session) {
    console.log("no session");
    appendMessage("no session");
    return;
  }
  if( mediaURL ) {
    var mediaInfo = new chrome.cast.media.MediaInfo(mediaURL);
  }
  else {
    console.log("loading..." + currentMediaURL);
    appendMessage("loading..." + currentMediaURL);
    var mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL);
  }

  mediaInfo.contentType = mediaTypes[currentMediaIndex];
  var request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.currentTime = initialTimeIndexSeconds;
  request.autoplay = true;
  
  var payload = {
    'title' : mediaTitles[currentMediaIndex],
  };

  var json = {
    "payload" : payload,
  };

  request.customData = json;

  var captions_div = document.getElementById('captions');
  captions_div.innerHTML = '';
  document.getElementById('instream_caption_div').style.display = 'none';

  session.loadMedia(request,
    onMediaDiscovered.bind(this, 'loadMedia'),
    onMediaError);

  document.getElementById('caption_ttml').disabled = undefined;
  document.getElementById('caption_webvtt').disabled = undefined;

  code = '  session.loadMedia(request,onMediaDiscovered,onMediaError);\n\n' + 
      '  onMediaDiscovered() {\n' +
      '    media.addUpdateListener(onMediaStatusUpdate);\n' + 
      '    timer = setInterval(updateCurrentTime.bind(this), 1000);' +
      '  }\n';
    
  showCodeSnippet(code, 'sender');

  code = '  mediaManager.onLoad = function(event) {\n' + 
      '    mediaHost = new cast.player.api.Host({\'mediaElement\': media, \'url\': url});\n' +
      '    if (url.lastIndexOf(\'.m3u8\') >= 0) {\n' +
      '      protocol =  cast.player.api.CreateHlsStreamingProtocol(mediaHost);\n' + 
      '    } else if (url.lastIndexOf(\'.mpd\') >= 0) {\n' +
      '      protocol = cast.player.api.CreateDashStreamingProtocol(mediaHost);\n' +
      '    } else if (url.lastIndexOf(\'.ism/\') >= 0) {\n' +
      '      protocol = cast.player.api.CreateSmoothStreamingProtocol(mediaHost);\n' +
      '    }\n' +
      '    mediaPlayer = new cast.player.api.Player(mediaHost);\n' +
      '    mediaPlayer.load(protocol, initialTimeInSeconds);\n' + 
      '  }\n';
    
  showCodeSnippet(code, 'receiver');
}

/**
 * callback on success for loading media
 * @param {Object} e A non-null media object
 */
function onMediaDiscovered(how, mediaSession) {
  console.log("new media session ID:" + mediaSession.mediaSessionId);
  appendMessage("new media session ID:" + mediaSession.mediaSessionId + ' (' + how + ')');
  currentMedia = mediaSession;
  mediaSession.addUpdateListener(onMediaStatusUpdate);
  mediaCurrentTime = currentMedia.currentTime;
  playpauseresume.innerHTML = 'Pause Media';
  if( !timer ) {
    timer = setInterval(updateCurrentTime.bind(this), 1000);
  }
}

/**
 * callback on media loading error
 * @param {Object} e A non-null media object
 */
function onMediaError(e) {
  console.log("media error");
  appendMessage("media error");
}

/**
 * callback for media status event
 * @param {Object} e A non-null media object
 */
function onMediaStatusUpdate(isAlive) {
  if( progressFlag ) {
    document.getElementById("progress").value = parseInt(100 * currentMedia.currentTime / currentMedia.media.duration);
    document.getElementById("progress_tick").innerHTML = currentMedia.currentTime;
    document.getElementById("duration").innerHTML = currentMedia.media.duration;
  }
  document.getElementById("playerstate").innerHTML = currentMedia.playerState;
}

/**
 * play media
 */
function playMedia() {
  if( !currentMedia ) 
    return;

  if( timer ) {
    clearInterval(timer);
  }

  var playpauseresume = document.getElementById("playpauseresume");
  if( playpauseresume.innerHTML == 'Play Media' ) {
    currentMedia.play(null,
      mediaCommandSuccessCallback.bind(this,"playing started for " + currentMedia.sessionId),
      onError);
      playpauseresume.innerHTML = 'Pause Media';
      currentMedia.addUpdateListener(onMediaStatusUpdate);
      appendMessage("play started");
      timer = setInterval(updateCurrentTime.bind(this), 1000);

    code = '  currentMedia.play(null, success, error);\n';
    showCodeSnippet(code, 'sender');

    code = '  // save original and override onPlay\n' +
         '  mediaManager.onPlay = function(event) {\n' + 
         '    // your custom code\n' +
         '    mediaManager[\'onPlayOrig\'](event);\n' +
         '  }\n';
    showCodeSnippet(code, 'receiver');
  }
  else {
    if( playpauseresume.innerHTML == 'Pause Media' ) {
      currentMedia.pause(null,
        mediaCommandSuccessCallback.bind(this,"paused " + currentMedia.sessionId),
        onError);
      playpauseresume.innerHTML = 'Resume Media';
      appendMessage("paused");

      code = '  currentMedia.pause(null, success, error);\n';
      showCodeSnippet(code, 'sender');

      code = '  // save original and override onPause\n' +
           '  mediaManager.onPause = function(event) {\n' + 
           '    // your custom code\n' +
           '    mediaManager[\'onPauseOrig\'](event);\n' +
           '  }\n' + 
           '  // Watch \'Media Element State\'';
      showCodeSnippet(code, 'receiver');
    }
    else {
      if( playpauseresume.innerHTML == 'Resume Media' ) {
        currentMedia.play(null,
          mediaCommandSuccessCallback.bind(this,"resumed " + currentMedia.sessionId),
          onError);
        playpauseresume.innerHTML = 'Pause Media';
        appendMessage("resumed");
        timer = setInterval(updateCurrentTime.bind(this), 1000);
      }

      code = '  currentMedia.play(null, success, error);\n';
      showCodeSnippet(code, 'sender');

      code = '  // save original and override onPlay\n' +
           '  mediaManager.onPlay = function(event) {\n' + 
           '    // your custom code\n' +
           '    mediaManager[\'onPlayOrig\'](event);\n' +
           '  }\n';
      showCodeSnippet(code, 'receiver');
    }
  }
}

/**
 * stop media
 */
function stopMedia() {
  if( !currentMedia ) 
    return;

  currentMedia.stop(null,
    mediaCommandSuccessCallback.bind(this,"stopped " + currentMedia.sessionId),
    onError);
  var playpauseresume = document.getElementById("playpauseresume");
  playpauseresume.innerHTML = 'Play Media';
  appendMessage("media stopped");
  if( timer ) {
    clearInterval(timer);
  }

  code = '  currentMedia.stop(null, success, error);\n';
  showCodeSnippet(code, 'sender');

  code = '  // save original and override onStop\n' +
       '  mediaManager.onStop = function(event) {\n' + 
       '    // your custom code\n' +
       '    mediaManager[\'onStopOrig\'](event);\n' +
       '  }\n';
  showCodeSnippet(code, 'receiver');
}

/**
 * set receiver volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute
 */
function setReceiverVolume(level, mute) {
  if( !session )
    return;

  if( !mute ) {
    session.setReceiverVolumeLevel(level,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
    currentVolume = level;
  }
  else {
    session.setReceiverMuted(true,
      mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
      onError);
  }

  code = '  session.setReceiverVolumeLevel(level, success, error);\n';
  showCodeSnippet(code, 'sender');

  code = '  // save original and override onSetVolume\n' +
       '  mediaManager.onSetVolume = function(event) {\n' + 
       '    // your custom code\n' +
       '    mediaManager[\'onSetVolumeOrig\'](event);\n' +
       '  }\n' +
       '  // Watch \'Volume State\' in receiver debug message';
  showCodeSnippet(code, 'receiver');
}

/**
 * set media volume
 * @param {Number} level A number for volume level
 * @param {Boolean} mute A true/false for mute/unmute 
 */
function setMediaVolume(level, mute) {
  if( !currentMedia ) 
    return;

  var volume = new chrome.cast.Volume();
  volume.level = level;
  currentVolume = volume.level;
  volume.muted = mute;
  var request = new chrome.cast.media.VolumeRequest();
  request.volume = volume;
  currentMedia.setVolume(request,
    mediaCommandSuccessCallback.bind(this, 'media set-volume done'),
    onError);
}

/**
 * enable/disable live streaming
 * @param {DOM Object} cb A checkbox element
 */
function liveStreaming(cb) {
  if( cb.checked == true ) {
    document.getElementById('initialTimeIndexSeconds').innerHTML = 'initialTimeIndexSeconds: Infinity';
    sendMessage({'type':'live','value':true});
  }
  else {
    document.getElementById('initialTimeIndexSeconds').innerHTML = 'initialTimeIndexSeconds: 0';
    sendMessage({'type':'live','value':false});
  } 
  code = ' // send custom message to set initialTimeIndexSeconds to Infinity\n' +
       '  sendMessage({\'type\':\'live\',\'value\':true});\n' +
       '  // receiver sets liveStreaming flag to true';
  showCodeSnippet(code, 'sender');

  code = '  if( liveStreaming ) {\n' + 
    '    mediaPlayer.load(protocol, Infinity);\n' +
    '  }\n' +
    '  else {\n' +
    '    mediaPlayer.load(protocol, initialTimeIndexSeconds);\n' +
    '  }';
  showCodeSnippet(code, 'receiver');
}

/**
 * enable/disable useCredentials
 * @param {DOM Object} cb A checkbox element
 */
function useCredentialsSegment(cb) {
  if( cb.checked == true ) {
    sendMessage({'type':'segmentCredentials','value':true});
  }
  else {
    sendMessage({'type':'segmentCredentials','value':false});
  } 
  code = ' // send custom message to set segmentCredentials to true\n' +
       '  sendMessage({\'type\':\'segmentCredentials\',\'value\':true});\n' +
       '  // receiver sets segmentCredentials flag to true';
  showCodeSnippet(code, 'sender');

  code = '  if( segmentCredentials ) {\n' + 
    '    mediaHost.updateSegmentRequestInfo = function(requestInfo) {\n' + 
    '      requestInfo.withCredentials = true;\n' + 
    '    };\n' + 
    '  }';
  showCodeSnippet(code, 'receiver');
}

/**
 * enable/disable useCredentials
 * @param {DOM Object} cb A checkbox element
 */
function useCredentialsManifest(cb) {
  if( cb.checked == true ) {
    sendMessage({'type':'manifestCredentials','value':true});
  }
  else {
    sendMessage({'type':'manifestCredentials','value':false});
  } 
  code = ' // send custom message to set credentials to true\n' +
       '  sendMessage({\'type\':\'manifestcredentials\',\'value\':true});\n' +
       '  // receiver sets manifestCredentials flag to true';
  showCodeSnippet(code, 'sender');

  code = '  if( manifestCredentials ) {\n' + 
    '    mediaHost.updateManifestRequestInfo = function(requestInfo) {\n' + 
    '      if (!requestInfo.url) {\n' +
    '        requestInfo.url = url;\n' +
    '      }\n' +
    '      requestInfo.withCredentials = true;\n' + 
    '    };\n' + 
    '  }';
  showCodeSnippet(code, 'receiver');
}

/**
 * enable/disable useCredentials
 * @param {DOM Object} cb A checkbox element
 */
function useCredentialsLicense(cb) {
  if( cb.checked == true ) {
    sendMessage({'type':'licenseCredentials','value':true});
  }
  else {
    sendMessage({'type':'licenseCredentials','value':false});
  } 
  code = ' // send custom message to set licenseCredentials to true\n' +
       '  sendMessage({\'type\':\'licenseCredentials\',\'value\':true});\n' +
       '  // receiver sets licenseCredentials flag to true';
  showCodeSnippet(code, 'sender');

  code = '  if( licenseCredentials ) {\n' + 
    '    mediaHost.updateLicenseRequestInfo = function(requestInfo) {\n' + 
    '      requestInfo.withCredentials = true;\n' + 
    '    };\n' + 
    '  }';
  showCodeSnippet(code, 'receiver');
}

/**
 * mute media
 * @param {DOM Object} cb A checkbox element
 */
function muteMedia(cb) {
  if( cb.checked == true ) {
    document.getElementById('muteText').innerHTML = 'Unmute media';
    //setMediaVolume(currentVolume, true);
    setReceiverVolume(currentVolume, true);
    appendMessage("media muted");
  }
  else {
    document.getElementById('muteText').innerHTML = 'Mute media';
    //setMediaVolume(currentVolume, false);
    setReceiverVolume(currentVolume, false);
    appendMessage("media unmuted");
  } 
}

/**
 * seek media position
 * @param {Number} pos A number to indicate percent
 */
function seekMedia(pos) {
  console.log('Seeking ' + currentMedia.sessionId + ':' +
    currentMedia.mediaSessionId + ' to ' + pos + "%");
  progressFlag = 0;
  var request = new chrome.cast.media.SeekRequest();
  request.currentTime = pos * currentMedia.media.duration / 100;
  request.resumeState = chrome.cast.media.PlayerState.PAUSED; 
  currentMedia.seek(request,
    onSeekSuccess.bind(this, 'media seek done'),
    onError);

  code = '  currentMedia.seek(SeekRequest, success, error);\n';
  showCodeSnippet(code, 'sender');

  code = '  // save original and override onSeek\n' +
       '  mediaManager.onSeek = function(event) {\n' + 
       '    // your custom code\n' +
       '    mediaManager[\'onSeekOrig\'](event);\n' +
       '  }\n' + 
       '  // Watch \'Media Player State\' in receiver debug message';
  showCodeSnippet(code, 'receiver');
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function onSeekSuccess(info) {
  console.log(info);
  appendMessage(info);
  setTimeout(function(){progressFlag = 1},1500);
}

/**
 * callback on success for media commands
 * @param {string} info A message string
 * @param {Object} e A non-null media object
 */
function mediaCommandSuccessCallback(info) {
  console.log(info);
  appendMessage(info);
}

/**
 * Updates the progress bar shown for each media item.
 */
function updateCurrentTime() {
  if (!session || !currentMedia) {
    return;
  }

  if (currentMedia.media && currentMedia.media.duration != null) {
    var cTime = currentMedia.getEstimatedTime();
    document.getElementById("progress").value = parseInt(100 * cTime / currentMedia.media.duration);
    document.getElementById("progress_tick").innerHTML = cTime;
  }
  else {
    document.getElementById("progress").value = 0;
    document.getElementById("progress_tick").innerHTML = 0;
    if( timer ) {
      clearInterval(timer);
    }
  }
};

/**
 * set the closed captioning track
 * @param {string} trackNumber the closed captioning track number
 */
function setCaptions(trackNumber) {
  if (session!=null) {
    if (trackNumber == undefined) {
      message = {
        type: 'DISABLE_CC'
      }
    } else {
      message = {
        type: 'ENABLE_CC',
        trackNumber: trackNumber
      }
    }
    session.sendMessage(MESSAGE_NAMESPACE, message, onSuccess.bind(this, appendMessage("Message sent: " + JSON.stringify(message))), onError);
  } else {
    alert("First connect to a Cast device.");	
  }
  code = '  \/\/Send custom message DISABLE_CC/ENABLE_CC\n' +
       '  sendMessage({\'type\':\'ENABLE_CC\',\n' +
       '    trackNumber: trackNumber});\n';
  showCodeSnippet(code, 'sender');

  code = '  // loop all caption tracks\n' +
       '  // enable this trackNumber\n' +
       '  setCaption(trackNumber);\n';
  showCodeSnippet(code, 'receiver');
}

/**
 * set the closed captioning track
 * @param {string} type the closed captioning type WebVTT or TTML
 */
function setExternalCaptions(type) {
  if (session!=null) {
    message = {
      type: type
    }
    session.sendMessage(MESSAGE_NAMESPACE, message, onSuccess.bind(this, appendMessage("Message sent: " + JSON.stringify(message))), onError);
    document.getElementById('caption_ttml').disabled = 'disabled';
    document.getElementById('caption_webvtt').disabled = 'disabled';
  }

  code = '  //Send custom message WebVTT or TTML\n' +
       '  sendMessage({\'type\':\'WebVTT\'});\n';
       '  //\n' +
       '  sendMessage({\'type\':\'TTML\'});\n';
       '  }';
  showCodeSnippet(code, 'sender');

  code = '  // disable any prior caption\n' +
       '  mediaPlayer.enableCaptions(false);\n' +
       '  // enable captions.vtt or captions.ttml\n' +
       '  mediaPlayer.enableCaptions(true,\'webvtt\',\'captions.vtt\');';
  showCodeSnippet(code, 'receiver');
}

/**
 * set the closed captioning font size
 * @param {string} size the closed captioning size index
 */
function setFont(size) {
  if (session!=null) {
	if (size == 0) {
      message = {
        type: 'NORMAL_FONT'
      }
    } else {
      message = {
        type: 'LARGE_FONT'
      }
    }
    session.sendMessage(MESSAGE_NAMESPACE, message, onSuccess.bind(this, appendMessage("Message sent: " + JSON.stringify(message))), onError);
  } else {
    alert("First connect to a Cast device.");	
  }
};


/**
 * append message to debug message window
 * @param {string} message A message string
 */
function appendMessage(message) {
  var dw = document.getElementById("debugmessage");
  dw.innerHTML += '\n' + JSON.stringify(message);
  return message;
};

/**
 * append message to sendercode window
 * @param {string} message A message string
 * @param {string} type A type string
 */
function showCodeSnippet(code, type) {
  if( type == 'sender' ) {
    var dw = document.getElementById("sendercode");
  }
  else {
    var dw = document.getElementById("receivercode");
  }
  dw.innerHTML = '\n' + code;
};

/**
 * send a custom message to receiver to set max bandwidth
 */
function setMaxBandwidth() {
  var maxBW = document.getElementById('maxBW').value;
  if( maxBW.length > 0 && !isNaN(maxBW) ) {
    sendMessage({'type':'maxBW','value':maxBW});
  }
  code = ' // send custom message to set maxBW\n' +
       '  sendMessage({\'type\':\'maxBW\',\'value\':maxBW});';
  showCodeSnippet(code, 'sender');

  code = '  // receiver calls\n' +
    '  qLevel = protocol.getQualityLevel(c, maxBW);\n' +
    '  // to get quality level for streamVideoQuality\n' +
    '  setDebugMessage(\'streamVideoQuality\', streamInfo.bitrates[qLevel]);\n' +
    '  // up to that specified by ' + maxBW;
  showCodeSnippet(code, 'receiver');
}

/**
 * send a custom message to receiver
 */
function setQualityLevel(qualityIndex, mediaType) {
  sendMessage({'type':'qualityIndex','value':qualityIndex, 'mediaType':mediaType});

/*
  code = ' // send custom message to set server license URL\n' +
       '  sendMessage({\'type\':\'license\',\'value\':licenseUrl});\n';
  showCodeSnippet(code, 'sender');

  code = '  // save original and override updateLicenseRequestInfo\n' +
       '  mediaHost[\'Orig\'] = mediaHost.updateLicenseRequestInfo;\n' +
       '  mediaHost.updateLicenseRequestInfo = function(requestInfo) {\n' +
       '    mediaHost.licenseUrl = licenseUrl;\n' +
       '    mediaHost[\'Orig\'](requestInfo);\n' +
       '  }\n' + 
       '  // Watch \'Media Host State\' for error if incorrect license URL'; 
  showCodeSnippet(code, 'receiver');
*/
}

/**
 * send a custom message to receiver so that
/**
 * send a custom message to receiver
 * so that it will override updateLicenseRequest
 * by setting license server URL
 */
function setLicenseUrl() {
  var licenseUrl = document.getElementById('licenseUrl').value;
  sendMessage({'type':'license','value':licenseUrl});

  code = ' // send custom message to set server license URL\n' +
       '  sendMessage({\'type\':\'license\',\'value\':licenseUrl});\n';
  showCodeSnippet(code, 'sender');

  code = '  // save original and override updateLicenseRequestInfo\n' +
       '  mediaHost[\'Orig\'] = mediaHost.updateLicenseRequestInfo;\n' +
       '  mediaHost.updateLicenseRequestInfo = function(requestInfo) {\n' +
       '    mediaHost.licenseUrl = licenseUrl;\n' +
       '    mediaHost[\'Orig\'](requestInfo);\n' +
       '  }\n' + 
       '  // Watch \'Media Host State\' for error if incorrect license URL'; 
  showCodeSnippet(code, 'receiver');
}

/**
 * send a custom message to receiver so that
 * it will display debug message on TV
 */
function showReceiverDebugMessage() {
  sendMessage({'type':'show','target':'debug'});
  code = '  //Send custom message \'show\'\n' +
       '  sendMessage({\'type\':\'show\',\'target\':\'debug\'});';
  showCodeSnippet(code, 'sender');

  code = '  // onMessage\n' +
       '  document.getElementById(\'messages\').style.display = \'block\';\n';
  showCodeSnippet(code, 'receiver');
}

/**
 * send a custom message to receiver so that
 * it will hide debug message on TV
 */
function hideReceiverDebugMessage() {
  sendMessage({'type':'hide','target':'debug'});
  code = '  //Send custom message \'hide\'\n' +
       '  sendMessage({\'type\':\'hide\',\'target\':\'debug\'});';
  showCodeSnippet(code, 'sender');

  code = '  // onMessage\n' +
       '  document.getElementById(\'messages\').style.display = \'none\';\n';
  showCodeSnippet(code, 'receiver');
}

/**
 * send a custom message to receiver so that
 * it will show video element on TV
 */
function showVideoOnTV() {
  sendMessage({'type':'show','target':'video'});
  code = '  //Send custom message \'show\'\n' +
       '  sendMessage({\'type\':\'show\',\'target\':\'video\'});';
  showCodeSnippet(code, 'sender');

  code = '  // onMessage\n' +
       '  document.getElementById(\'receiverVideoElement\').style.display = \'block\';\n';
  showCodeSnippet(code, 'receiver');
}

/**
 * send a custom message to receiver so that
 * it will hide video element on TV
 */
function hideVideoOnTV() {
  sendMessage({'type':'hide','target':'video'});
  code = '  //Send custom message \'hide\'\n' +
       '  sendMessage({\'type\':\'hide\',\'target\':\'video\'});';
  showCodeSnippet(code, 'sender');

  code = '  // onMessage\n' +
       '  document.getElementById(\'receiverVideoElement\').style.display = \'none\';\n';
  showCodeSnippet(code, 'receiver');
}

/**
 * @param {string} message A message string
 */
function sendMessage(message) {
  if (session!=null) {
    session.sendMessage(MESSAGE_NAMESPACE, message, onSuccess.bind(this, "Message sent: " + message), onError);
  }
};
