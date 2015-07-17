function Downloader(){
  this.downloadURLs=[];
  this.failedIds=[];
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
      afterLoad=function(){
        self.sandbox.removeEventListener('load',afterLoad);
        self.downloadTracks(ids);
      }

  debugger;
  this.sandbox=$('<iframe />')[0];
  this.sandbox.src=window.location.origin;
  $(this.sandbox).appendTo('body');

  this.sandbox.addEventListener('load',afterLoad);
}

Downloader.prototype.afterDownload=function(){

  var data={};

  data[URL_ID]=this.downloadURLs.join(' ');
  chrome.storage.sync.set(data);
}

Downloader.prototype.actuallyDownload=function(url){
  if(!this.fakeButton) {
    this.fakeButton=document.createElement('div');
    document.body.appendChild(this.fakeButton);
  }

  this.fakeButton.onclick=function(){
    window.open(url)
  }
  this.fakeButton.click()
}

Downloader.prototype.downloadTracks=function(ids){
  var current=-1,
      self=this,
      downloadUntilDone=function(){
        current++
        console.log('downloading track ' + current + ' out of ' + ids.length);
        if(current<ids.length)
          self.refresh(function(){
            self.downloadTrack(ids[current],downloadUntilDone);
          });
        else
          self.afterDownload();
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
          self.one(cb,id);
        else if(on===2)
          self.two(cb,id);
        else
          self.three(cb,id);
      };


  if(on===1)
    afterLoad();
  else {
    btn.click();
    this.sandbox.addEventListener('load',afterLoad);
  }
}

Downloader.prototype.one=function(cb,id){
  //debugger;
  var inputField=this.$('#url'),
      nextPageBtn=this.$('#downloadbutton');

  inputField.attr('value',YOUTUBE_BASE+id);
  cb(nextPageBtn);
}
Downloader.prototype.two=function(cb,id){
  //debugger;
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
          self.failedIds.push(id);
          self.nextTrack();
        }
      };

    attempt();
}
Downloader.prototype.three=function(cb){
  //debugger;
  var downloadBtn=this.$('#downloadmp3'),
      self=this;

  this.hijackOpen(function(evt){
    var mp3URL=evt.detail[0];
    self.downloadURLs.push(mp3URL);
    self.actuallyDownload(mp3URL);
    cb();
    //debugger;
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
  script.innerText='window.open=function(){document.dispatchEvent(new CustomEvent("openCalled",{detail:arguments}))}'
  this.sandbox.contentDocument.body.appendChild(script);

  this.sandbox.contentDocument.addEventListener('openCalled',cb);
}

Downloader.prefix='__downloader';