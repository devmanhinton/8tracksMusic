// Fully Open Window
// Iterate through each
// hijack
// Run this code

function Download8tracks(className){
  this.className=className||'youtube_link';
  this.urls=[];
  this.failures=[];
  this.grabbing=0;
  this.grabbed=0;
  this.hijackRequest();
  this.loadAllTracks(this.saveAllUrls,this);
}
Download8tracks.prototype.defaultSongsPerPage=20;
Download8tracks.prototype.loadAllTracks = function(cb,context){
  var moreBtn=$('.more')[0],
      numTracks=parseInt($('.favs_count').text()),
      cbCalled=false, //For Backup
      listener=function(){
        numTracks--;
        if(numTracks===this.defaultSongsPerPage){ //Does not reload already present songs
          cbCalled=true;
          $(window).off('DOMNodeInserted',listener);
          cb.apply(context||this,[]);
        }
      },
      href=moreBtn.href;

  moreBtn.href=href.replace(this.defaultSongsPerPage,numTracks).replace('2','1');

  $(window).on('DOMNodeInserted',listener);
  moreBtn.click();

  setTimeout(function(){ //Backup
    if(!cbCalled){
      cbCalled=true;
      $(window).off('DOMNodeInserted',listener);
      cb.apply(context||this,[]);
    }
  }, 4000);
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
      _ajax.apply($,arguments);
    }
  }
}
Download8tracks.prototype.saveAllUrls = function(cb,context){
  this.elems=document.getElementsByClassName(this.className);

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