// Case where there are no more tracks :)

function Scraper(className){
  console.log('starting to scrape track information. Will redirect on completion');

  this.ids=[];
  this.finished=0;
  this.className=className||'youtube_link';
  this.videConversationSite='http://www.vidtomp3.com/';

  this.setupListeners();
  this.loadAllTracks(this.saveAllUrls,this);
}

Scraper.prototype.setupListeners = function(){ // Scraper scope $ is different than 8track's $ (JQuery)
  var self=this;                               // This code allows hijacking of the correct JQuery
                                               // Chrome Extensions cannot have access to window scope
                                               // Hence the event passing and script injection
  document.addEventListener('idReturned',function(evt){
    self.ids.push(evt.detail);
    self.finished++;
    if(self.finished===self.total)
      self.saveUrls();
  });
  document.addEventListener('idNotReturned',function(evt){
    self.finished++;
    if(self.finished===self.total)
      self.saveUrls();
  });
  Helper.injectScript(chrome.extension.getURL('getJQuery.js'), 'body');
}

Scraper.prototype.loadAllTracks = function(cb,context){
  var moreBtn=$('.more')[0],
      numTracks=parseInt($('.favs_count').text()),
      cbCalled=false, //For Backup
      moveOn=function(){
          cbCalled=true;
          $(window).off('DOMNodeInserted',listener);
          cb.apply(context||this,[]);
      },
      listener=function(){
        numTracks--;
        if(numTracks===this.defaultSongsPerPage) //Does not reload already present songs
          moveOn();
      },
      backup=function(){
        if(!cbCalled)
          moveOn();
      },
      href=moreBtn.href;

  moreBtn.href=href.replace(this.defaultSongsPerPage,numTracks)
                   .replace('2','1'); // Make button load all tracks

  $(window).on('DOMNodeInserted',listener);
  moreBtn.click();

  setTimeout(backup,8000);
}

Scraper.prototype.saveUrls = function(){
  var data={},
      self=this;

  data[STORAGE_ID]=this.ids.join(' ');
  chrome.storage.sync.set(data,function(){
    alert('saved ' + self.ids.length + ' ids, now going to download');
    self.goToDownload();
  });
}

Scraper.prototype.goToDownload = function(){
  window.location=this.videConversationSite;
}
Scraper.prototype.defaultSongsPerPage=20;
Scraper.prototype.youtubeURLBase="http://www.youtube.com/v/";

Scraper.prototype.saveAllUrls = function(cb,context){
  this.elems=document.getElementsByClassName(this.className);
  this.total=this.total=this.elems.length;

  for (var i=0;i<this.elems.length;i++) {
    this.elems[i].click();
  }
}