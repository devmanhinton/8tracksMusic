// Fully Open Window
// Iterate through each
// hijack
// Run this code


function Download8tracks(className){
  this.elems=document.getElementsByClassName(className || 'youtube_link');
  this.urls=[];
  this.failures=[];
  this.grabbing=0;
  this.grabbed=0;
  this.hijackRequest();
  this.saveAllUrls();
}
Download8tracks.prototype.dummyLocation = {};
Download8tracks.prototype.hijackRequest = function(){
  window.open = function(){
    return {location: this.dummyLocation}
  }

  var _8tracksCbAmended = function(json) {
    this.grabbed++;
    if (json && json.items && json.items.length) {
      var youtubeId = json.items[0].id.videoId;
      this.urls.push( "http://www.youtube.com/v/" + youtubeId + "?autoplay=1");
    } else {
      this.failures.push({json: json})
    }
  },
  _ajax=$.ajax,
  self=this;

  $.ajax = function(argHsh) {
    if(argHsh.url.match(/www.googleapis.com\/youtube\/v3\/search/)) {
      argHsh.success=_8tracksCbAmended;
      argHsh.context=self;
      _ajax.apply($,[argHsh]);
    } else {
      _ajax.apply($,arguements);
    }
  }
}
Download8tracks.prototype.saveAllUrls = function(cb,context){
  for (var i=0;i<this.elems.length;i++) {
    this.grabUrl(this.elems[i]);
    this.grabbing++;
  }
}
Download8tracks.prototype.grabUrl = function(elem){
  console.log(elem);
  elem.click();
}
Download8tracks.prototype.finishedAprox = function(){
  return this.grabbing===this.grabbed;
}