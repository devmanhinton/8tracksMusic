var scraper,
    downloader;

if(window.location.origin.match('8tracks'))
  scraper=new Scraper();
else
  downloader=new Downloader();