var _ajax=$.ajax,
    sendData=function(data,name){
      document.dispatchEvent(new CustomEvent(name, {'detail': data}));
    },
    idSuccess=function(id){
      sendData(id,'idReturned');
    },
    idFailure=function(id){
      sendData('nothing','idNotReturned');
    };

var sendId = function(json) {
  if (json && json.items && json.items.length) {
    var youtubeId = json.items[0].id.videoId;
    idSuccess(youtubeId);
  } else {
    idFailure();
  }
};

$.ajax = function(argHsh) {
  if(argHsh.url.match(/www.googleapis.com\/youtube\/v3\/search/)) {
    argHsh.success=sendId;
    _ajax.apply($,[argHsh]);
  } else {
    _ajax.apply($,arguments);
  }
}

