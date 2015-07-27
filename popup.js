(function(){
    document.addEventListener('DOMContentLoaded',function(){ // order - specific ordered --> more general
        var current_settings;
        chrome.storage.sync.get(SETTINGS,function(data){
            if(!data || !data[SETTINGS])
                initSettingsFirst();
            else {
                console.log('on setup -- setting is: ' + data[SETTINGS].status);
                current_settings=data[SETTINGS];
                setUpPage();
            }
        });

        function initSettingsFirst(){ // Might want to look for error
            console.log('starting the process and initing the data');
            saveSettings({status: 'on'}, setUpPage);
        }

        function setUpPage(){
            setUpDom();
            setUpListeners();
        }

        function setUpListeners(){
            document.getElementById('toggleButton').addEventListener('click',function(){
                toggleSettings(setUpDom);
            });
        }

        function setUpDom(){
            document.getElementById('currentState').textContent="'" + currentState() + "'";
            document.getElementById('oppositeState').textContent="'" +  oppositeState() + "'";
        }

        function toggleSettings(cb){
            current_settings.status=oppositeState();
            saveSettings(current_settings,cb);
        }

        function saveSettings(settings,cb){
            var wrapper={};

            wrapper[SETTINGS]=settings;

            chrome.storage.sync.set(wrapper,function(){
                current_settings=wrapper[SETTINGS];
                cb();
            });
        }

        function currentState(){
            return current_settings.status;
        }

        function oppositeState(){
            if(current_settings.status==='on')
                return 'off';
            else
                return'on';
        }
    });
})();