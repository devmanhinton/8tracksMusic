// Fully Open Window
// Iterate through each
// hijack
// Run this code

alert && alert('working')
YOUTUBE_BASE='http://www.youtube.com/v/';
STORAGE_ID='mp3IDs';


Helper = {};

Helper.injectScript = function(file, node) {
    var th = document.getElementsByTagName(node)[0],
        s = document.createElement('script');

    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    s.id='pageJQuery';
    th.appendChild(s);
}

Scraper.prototype.setupListeners = function(){
  var self=this;
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

Scraper.prototype.saveUrls = function(){
  var data={};

  data[STORAGE_ID]=this.ids.join(' ');
  chrome.storage.sync.set(data);
}

function Scraper(className){
  this.ids=[];
  this.finished=0;
  this.className=className||'youtube_link';
  this.videConversationSite='http://www.vidtomp3.com/';

  this.setupListeners();
  this.loadAllTracks(this.saveAllUrls,this);
}
Scraper.prototype.defaultSongsPerPage=20;
Scraper.prototype.youtubeURLBase="http://www.youtube.com/v/";
Scraper.prototype.loadAllTracks = function(cb,context){
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
Scraper.prototype.saveAllUrls = function(cb,context){
  this.elems=document.getElementsByClassName(this.className);
  this.total=this.total=this.elems.length;

  for (var i=0;i<this.elems.length;i++) {
    this.elems[i].click();
  }
}

function Downloader(){
  var self=this;
  chrome.storage.sync.get(STORAGE_ID,function(data){
    if(!data || !data[STORAGE_ID])
      return // May be not ids to scrape

    self.download(data[STORAGE_ID].split(' '));
  });
}

Downloader.prototype.download=function(ids){
  this.createSandbox();
}

Downloader.prototype.createSandbox=function(){
  var self=this;
  this.sandbox=$('<iframe />')[0];
  this.sandbox.src=window.location.origin;
  $(this.sandbox).appendTo('body');

  this.sandbox.addEventListener('load',function(){
    self;
    debugger;
  });
}

Downloader.prototype.$=function(args){
  $(args.push(this.sandbox));
}

Downloader.prefix='__downloader';

var scraper,
    downloader;

if(window.location.origin.match('8tracks'))
  scraper=new Scraper();
else
  downloader=new Downloader();


//https://8tracks.com/*/favorite_tracks