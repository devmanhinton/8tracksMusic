YOUTUBE_BASE='http://www.youtube.com/v/';
STORAGE_ID='mp3IDs';
URL_ID='download_urls';
SETTINGS='download_settings_8tracks';

Helper = {};

Helper.injectScript = function(file, node) {
    var th = document.getElementsByTagName(node)[0],
        s = document.createElement('script');

    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    s.id='pageJQuery';
    th.appendChild(s);
}