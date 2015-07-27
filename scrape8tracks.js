var scraper,
    downloader;

chrome.storage.sync.get(SETTINGS,function(data){
    if(!data || !data[SETTINGS] || data[SETTINGS].status==='off')
        return
    else {
      if(window.location.origin.match('8tracks'))
        scraper=new Scraper();
      else
        downloader=new Downloader();
    }
});

