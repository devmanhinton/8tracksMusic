function Downloader(){
  this.downloadURLs=[];
  this.failedIds=[];
  var self=this;
  chrome.storage.sync.get(STORAGE_ID,function(data){
    if(!data || !data[STORAGE_ID])
      return // May be not ids to scrape

    self.createSandboxThenDownload(data[STORAGE_ID].split(' '));
  });
}

Downloader.prototype.$=function(selector){
  return $(selector,this.sandbox.contentDocument);
}

Downloader.prefix='__downloader';

Downloader.prototype.createSandboxThenDownload=function(ids){
  var self=this,
      afterLoad=function(){
        self.sandbox.removeEventListener('load',afterLoad);
        self.downloadTracks(ids);
      };

  this.container=document.createElement('div');
  this.container.className="downloaderContainer notShown"

  this.sandbox=$('<iframe />')[0];
  this.sandbox.src=window.location.origin;

  $(this.sandbox).appendTo(this.container);
  $(this.captchaBtn()).appendTo(this.container);
  $(this.container).appendTo('body');
  debugger;

  this.sandbox.addEventListener('load',afterLoad);
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
        var downloadBtn=self.$('a[href*="download"]').get(0),
            googleFrame = self.$('.g-recaptcha');

        if(googleFrame.length) {
          self.pauseToDefeatCaptcha(googleFrame,cb,[cb,id]);
          return // and wait for callback
        }

        if(!downloadBtn && attempts) {
            setTimeout(attempt,1000);
        } else if (downloadBtn){
          cb(downloadBtn);
        } else {
          alert('failure');
          self.failedIds.push(id);
          self.nextTrack();
        }
      };

    attempt();
}

Downloader.prototype.pauseToDefeatCaptcha = function(captcha,cb,args){
  var $window=$(this.sandbox.contentWindow),
      self=this,
      watcher=function(evt){
        if(evt.target.nodeName==='SCRIPT') {
          debugger
        } else {
          debugger;
          $window.off('DOMNodeInserted',watcher);
          self.hideContainer();
          cb.apply(self,args);
        }
      };

  $window.on('DOMNodeInserted',watcher);
  this.showContainer();
  $window.scrollTop(captcha.offset().top);

  alert("To get all your tracks you need to verify you are human -- please click --I'm not a robot-- & then continue");
}

Downloader.prototype.showContainer = function(){
  $(this.container).toggleClass('notShown');
  this.container.style.bottom=($(window).height()/2 - $(this.container).height()/2) + "px";
  this.container.style.right=($(window).width()/2 - $(this.container).width()/2) + "px";
}

Downloader.prototype.hideContainer = function(){
  $(this.container).toggleClass('notShown');
}

Downloader.prototype.captchaBtn = function(){
  if(!this.button) {
    this.button=document.createElement('button');
    this.button.textContent='Click After Confirming You Are Home';
  }

  return this.button;
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

Downloader.prototype.afterDownload=function(){
  var data={};

  data[URL_ID]=this.downloadURLs.join(' ');
  chrome.storage.sync.set(data);
}

Downloader.prototype.actuallyDownload=function(url){
  return;
  if(!this.fakeButton) {
    this.fakeButton=document.createElement('div');
    document.body.appendChild(this.fakeButton);
  }

  this.fakeButton.onclick=function(){
    window.open(url)
  }
  this.fakeButton.click()
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