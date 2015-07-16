// Fully Open Window
// Iterate through each
// hijack
// Run this code

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
  this.downloadURLs=[];
  var self=this;
  chrome.storage.sync.get(STORAGE_ID,function(data){
    if(!data || !data[STORAGE_ID])
      return // May be not ids to scrape

    self.download(data[STORAGE_ID].split(' '));
  });
}

Downloader.prototype.download=function(ids){
  this.createSandboxThenDownload(ids);
}

Downloader.prototype.createSandboxThenDownload=function(ids){
  var self=this,
      downloadURLs=[],
      afterLoad=function(){
        self.sandbox.removeEventListener('load',afterLoad);
        self.downloadTracks(ids);
      }
  this.sandbox=$('<iframe />')[0];
  this.sandbox.src=window.location.origin;
  $(this.sandbox).appendTo('body');

  this.sandbox.addEventListener('load',afterLoad);
}

Downloader.prototype.downloadTracks=function(ids){
  var current=-1,
      self=this,
      downloadUntilDone=function(){
        current++
        if(current<ids.length && current<5)
          self.refresh(function(){
            self.downloadTrack(ids[current],downloadUntilDone);
          });
        else
          debugger
      }

  this.nextTrack=downloadUntilDone;

  downloadUntilDone();
}

Downloader.prototype.downloadTrack=function(id,cb){
  var total=3,
      on=0,
      self=this,
      stepPhase=function(btn){
        on++;
        if(on<=total)
          self.executePhase(on,id,stepPhase,btn);
        else
          cb();
      };

  stepPhase();
}

Downloader.prototype.executePhase=function(on,id,cb,btn){
  var self=this,
      afterLoad=function(){
        self.sandbox.removeEventListener('load',afterLoad);
        if(on===1)
          self.one(id,cb);
        else if(on===2)
          self.two(cb);
        else
          self.three(cb);
      };


  if(on===1)
    afterLoad();
  else {
    btn.click();
    this.sandbox.addEventListener('load',afterLoad);
  }
}

Downloader.prototype.one=function(id,cb){
  debugger;
  var inputField=this.$('#url'),
      nextPageBtn=this.$('#downloadbutton');

  inputField.attr('value',YOUTUBE_BASE+id);
  cb(nextPageBtn);
}
Downloader.prototype.two=function(cb){
  debugger;
  var attempts=20,
      self=this,
      attempt=function(){
        attempts--;
        var downloadBtn=self.$('a[href*="download"]').get(0);

        if(!downloadBtn && attempts)
          setTimeout(attempt,1000);
        else if (downloadBtn){
          cb(downloadBtn);
        } else {
          alert('failure');
          this.nextTrack();
        }
      };

    attempt();
}
Downloader.prototype.three=function(cb){
  debugger;
  var downloadBtn=this.$('#downloadmp3'),
      self=this;

  this.hijackOpen(function(evt){
    var mp3URL=evt.detail[0];
    self.downloadURLs.push(mp3URL);
    cb();
    debugger;
  });
  downloadBtn.click();
}
Downloader.prototype.refresh=function(cb){
  var self=this,
      afterLoad=function(){
        self.sandbox.removeEventListener('load',afterLoad);
        cb();
      };
  this.sandbox.contentWindow.location=window.location.origin;
  this.sandbox.addEventListener('load',afterLoad);
}

Downloader.prototype.$=function(selector){
  return $(selector,this.sandbox.contentDocument);
}

Downloader.prototype.hijackOpen=function(cb){
  if(!this.sandbox)
    return;

  var clicker=$('<button id="clickDownload"></button>'),
      self=this;

  var script=this.sandbox.contentDocument.createElement('script');
  script.innerText='window.open=function(){alert("yo"); document.dispatchEvent(new CustomEvent("openCalled",{detail:arguments}))}'
  this.sandbox.contentDocument.body.appendChild(script);

  this.sandbox.contentDocument.addEventListener('openCalled',cb);
}

Downloader.prefix='__downloader';

var scraper,
    downloader;

if(window.location.origin.match('8tracks'))
  scraper=new Scraper();
else
  downloader=new Downloader();

// $('iframe').each(function(num,iframe){console.log(iframe)})
// $('iframe').each(function(num,iframe){console.log(iframe.contentWindow.open=function(){debugger})})


//https://8tracks.com/*/favorite_tracks