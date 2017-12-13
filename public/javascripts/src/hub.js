/**
 * Publish/Subscribe Event Broker
 *
 * @author Nychka Yaroslav
 * @email y.nychka@tickets.com.ua
 * @date 2.11.2017
 * @version 1.0.0
 *
 *
 *
 * function Foo(){
 *      Hub.publish('hello_world_event', { data: { foo: 'bar' }, message: 'Foo is Bar' });
 * }
 *
 * function Bar(){
 *      Hub.subscribe('hello_world_event', function(envelope){ console.log(envelope.message); });
 * }
 *
 * Foo(); // now event is published for all subscribers
 * Bar(); // as we've subscribed on event 'hello_world', run our callback and print message
 *
 * > Foo is Bar
 *
 */
(function(globalObj){
    function Hub()
    {
        var events = {};
        var extensions = {};

        this.getEvents = function()
        {
            return events;
        };
        this.delayPublishing = function(event, data)
        {
            events[event]['publishing'] = data;
            this.track(event, data.message);
        };
        this.getDelayedPublishing = function(event)
        {
            return events[event].hasOwnProperty('publishing') && events[event]['publishing'];
        };
        this.checkEvent = function(event)
        {
            if(! events.hasOwnProperty(event)){
                events[event] = { callbacks: [] };
            }
        };
        this.subscribe = function(event, callback, context)
        {
            this.checkEvent(event);
            if(events[event].callbacks.indexOf(callback) === -1){
                if(typeof context === 'object') {
                    callback = callback.bind(context);
                }
                var delayedPublishing = this.getDelayedPublishing(event);

                if(delayedPublishing) { try{ callback.call(this, delayedPublishing); }catch(e){console.error(e); } }

                events[event].callbacks.push(callback);
            }
        };
        this.publish = function(event, data)
        {
            this.checkEvent(event);
            this.delayPublishing(event, data);

            events[event].callbacks.forEach(function(callback){
                callback.call(this, data);
            });
        };

        this.trigger = function(event)
        {
            var package = this.getDelayedPublishing(event);

            if(package && package.data) Hub.publish(event, { data: package.data, message: event + ' was triggered' });
        };

        this.extend = function(id, fn)
        {
            if(extensions.hasOwnProperty(id)) return false;

            var extension = typeof fn === 'function' ? new fn() : fn;
            extensions[id] = extension;

            this[id] = extension;
        };

        this.track = function(event, message)
        {
            if(extensions.logger){
                extensions.logger.track(event, message);
            }else if(console && console.log){
                console.log(event, message);
            }
        };

        this.getExtensions = function()
        {
            return extensions;
        };
    }

    if(! globalObj.hasOwnProperty('Hub')){
        globalObj.Hub = new Hub();
        console.log('Hub was successfully hosted as: Hub. Now you can knitting everything with publish & subscribe methods');
    }else{
        console.log('Hub is loaded more than once - but it still works correct. Removing unnecessary script loading will speed up page loading.');
    }
})(window);

(function(globalObj){
    function Dispatcher()
    {
        var managers = {};
        var controllers = {};

        this.addManager = function(name, manager)
        {
            if(managers.hasOwnProperty(name)){ Hub.logger.warn('manager with name: ' + name + ' already exist!'); return false; }

            managers[name] = manager;
        };

        this.getManager = function(name)
        {
            if(! managers.hasOwnProperty(name)){ Hub.logger.warn('manager with name: ' + name + ' not found!'); }

            return managers[name];
        };

        this.addController = function(name, controller)
        {
            if(controllers.hasOwnProperty(name)){ Hub.logger.warn('controller with name: ' + name + ' already exist!'); return false; }

            controllers[name] = controller;

            var event_name = name + '_controller';
            var envelope = {
                event: event_name + '_initialized',
                message: event_name + ' is initialized. Now call Hub.dispatcher.getController(\'' + name + '\')'
            };
            Hub.publish(envelope.event, envelope);
        };

        this.getController = function(name)
        {
            if(! controllers.hasOwnProperty(name)){ Hub.logger.warn('controller with name: ' + name + ' not found!'); }

            return controllers[name];
        };
    };

    globalObj.Hub.extend('dispatcher', new Dispatcher());
})(window);

(function(globalObj){
    function Logger()
    {
        var canLog = true;
        var loggers = {};
        var history = [];

        var init = function()
        {
            loggers['devtools'] = window.console;
        };

        this.track = function(event, message)
        {
            this.log('[' + event + '] : ' + message);
        };

        this.canLog = function()
        {
            return canLog;
        };

        this.log = function(message)
        {
            if(this.canLog() && Object.keys(loggers).length){

                for(var i in loggers){
                    if(! loggers.hasOwnProperty(i)) continue;

                    loggers[i].log(message);
                }
            }
            history.push(message);
        };

        this.getHistory = function()
        {
            return history;
        };

        this.warn = this.log;
        this.error = this.log;
        this.info = this.log;
        this.count = this.log;

        this.getLoggers = function()
        {
            return loggers;
        };

        init();
    };

    globalObj.Hub.extend('logger', new Logger());
})(window);

(function(globalObj){
    function PriceLogger()
    {
        var priceChangeLog = {};

        this.get = function () {
            return priceChangeLog;
        };

        this.set = function (key, price, msg) {
            priceChangeLog[key] = {};
            priceChangeLog[key]['price'] = price;
            priceChangeLog[key]['log'] = [];
            priceChangeLog[key]['log'].push(price + " (" + msg + ")");

            return price;
        };

        this.add = function (key, add, msg) {
            if (!priceChangeLog.hasOwnProperty(key)) {
                console.error('Price log for [' + key + '] is not initialized!');
                return 0;
            }

            priceChangeLog[key]['price'] += add;
            var log = priceChangeLog[key]['price']
                + "[" + ((add > 0) ? "+" : "") + add + "]"
                + " (" + msg + ")";
            priceChangeLog[key]['log'].push(log);

            return priceChangeLog[key]['price'];
        };
    };

    globalObj.Hub.extend('priceLog', new PriceLogger());
})(window);

(function(globalObj){
    function Archive()
    {
        var storage = {};

        this.initialize = function(data)
        {
            Hub.track('archive', 'start initializing Archive');
            storage = data;
            Hub.publish('archive_initialized', { data: data, message: 'archive initialized with data length' });
        };

        this.getData = function()
        {
            return storage;
        };

        this.updateData = function(key, data)
        {
            $.extend(true, storage.data[key], data);
            Hub.publish('archive_updated', { data: data, message: 'archive key: ' + key + ' was updated' });
        };
    };

    globalObj.Hub.extend('archive', new Archive());
    Hub.publish('archive_loaded', { message: 'archive was loaded', data: {} });
})(window);