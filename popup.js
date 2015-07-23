(function(){
    document.addEventListener('DOMContentLoaded',function(){
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
            var settings_obj={status: 'on'},
                wrapper={};

            console.log('starting the process and initing the data');

            wrapper[SETTINGS]=settings_obj;

            chrome.storage.sync.set(wrapper,function(){
                current_settings=wrapper[SETTINGS];
                setUpPage();
            });
        }

        function setUpPage(){
            document.getElementById('currentState').textContent=currentState();
            document.getElementById('oppositeState').textContent=oppositeState();
        }

        function toggleSettings(){



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