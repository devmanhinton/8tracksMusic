function Downloader(){ // Disguse IP address of web request?
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
  return $(selector,this.sandbox.prop('contentDocument'));
}

Downloader.prototype.createSandboxThenDownload=function(ids){
  var self=this,
      afterLoad=function(){
        self.sandbox.off('load',afterLoad);
        self.downloadTracks(ids);
      };

  this.container=$('<div class="downloaderContainer notShown"></div>');

  this.sandbox=$('<iframe />');
  this.sandbox.attr('src',window.location.origin);

  this.sandbox.appendTo(this.container.get(0));
  this.captchaBtn().appendTo(this.container.get(0));
  this.container.appendTo('body');

  this.overlay=$('<div id="modalOverlay" class="notShown"></div>');
  this.overlay.appendTo('body');

  this.sandbox.on('load',afterLoad);
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

Downloader.prototype.executePhase=function(on,id,cb,btn,retry){
  var self=this,
      afterLoad=function(){
        self.sandbox.off('load',afterLoad);
        if(on===1)
          self.one(cb,id);
        else if(on===2)
          self.two(cb,id);
        else
          self.three(cb,id);
      };

  if(on===1||retry)
    afterLoad();
  else {
    btn.click();
    this.sandbox.on('load',afterLoad);
  }
}

Downloader.prototype.retryPhase=function(on,cb,id){
  this.executePhase(on,id,cb,document.createElement('button'),true);
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
          self.pauseToDefeatCaptcha(googleFrame,2,cb,id);
          return // and wait for callback
        }

        if(!downloadBtn && attempts) {
            setTimeout(attempt,1000);
        } else if (downloadBtn){
          cb(downloadBtn);
        } else {
          self.failedIds.push(id);
          self.nextTrack();
        }
      };

    attempt();
}

Downloader.prototype.pauseToDefeatCaptcha = function(captcha,on,cb,id){
  var $window=$(this.sandbox.prop('contentWindow')),
      self=this,
      continueDownloads=function(){
          self.captchaBtn().off('click',continueDownloads)
          self.hideContainer();
          self.retryPhase(on,cb,id); // Race - Hit button before captcha
      };

  this.captchaBtn().on('click',continueDownloads);
  this.showContainer();
  $window.scrollTop(captcha.offset().top);

  alert("To get all your tracks you need to verify you are human -- please click --I'm not a robot-- & then continue");
}

Downloader.prototype.showContainer = function(){ // Prevent Scroll and set to size of captcha
  $(this.container).toggleClass('notShown');
  this.overlay.toggleClass('notShown');
  this.container.style.bottom=($(window).height()/2 - $(this.container).height()/2) + "px";
  this.container.style.right=($(window).width()/2 - $(this.container).width()/2) + "px";
}

Downloader.prototype.hideContainer = function(){
  $(this.container).toggleClass('notShown');
  this.overlay.toggleClass('notShown');
}

Downloader.prototype.captchaBtn = function(){
  if(!this.button) {
    this.button=document.createElement('button');
    this.button.textContent='Confirm you are human above, then click this button';
  }

  return $(this.button);
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
  if(!this.sandbox.length)
    return;

  var clicker=$('<button id="clickDownload"></button>'),
      self=this,
      doc=this.sandbox.prop('contentDocument');

  var script=doc.createElement('script');
  script.innerText='window.open=function(){document.dispatchEvent(new CustomEvent("openCalled",{detail:arguments}))}'
  doc.body.appendChild(script);

  doc.addEventListener('openCalled',cb);
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

Downloader.prototype.refresh=function(cb){
  var self=this,
      afterLoad=function(){
        self.sandbox.off('load',afterLoad);
        cb();
      };

  this.sandbox.prop('contentWindow').location=window.location.origin;
  this.sandbox.on('load',afterLoad);
}