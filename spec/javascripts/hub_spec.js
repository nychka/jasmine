describe('Hub', function(){
    var extensions = Hub.getExtensions();
    var hub;

    beforeEach(function(){
        hub = new Hub.constructor();
        hub.extend('logger', extensions.logger);
    });

    describe('extend', function(){
        it('extend by object', function(){
            var extension = { foo: 42 };

            hub.extend('bar', extension);

            expect(hub.bar).toEqual(extension);
        });

        it('extend by function', function(){
            var extension = function(){
                this.foo = 42;
            };

            hub.extend('bar', extension);

            expect(hub.bar).toEqual(new extension());
        });

        it('get all available extensions', function(){
            var extension = function(){
                this.foo = 42;
            };

            hub.extend('foo', extension);

            expect(Object.keys(hub.getExtensions()).length).toEqual(2);
            expect(hub.getExtensions()['foo']).toEqual(new extension);
        });

        it('extend by Dispatcher', function(){
            var extensions = Hub.getExtensions();
            var fooManager  = { foo: 42 };

            hub.extend('dispatcher', extensions.dispatcher);

            expect(typeof hub.dispatcher.addManager === 'function').toBeTruthy();
            hub.dispatcher.addManager('foo', fooManager);

            expect(hub.dispatcher.getManager('foo')).toEqual(fooManager);
        });
    });

    describe('publish', function(){
        it('creates event when publish', function(){
            hub.publish('custom', function(){});

            expect(Object.keys(hub.getEvents()).length).toEqual(1);
            expect(hub.getEvents().hasOwnProperty('custom')).toBeTruthy();
        });

        it('keep publishing', function(){
            var data = { data: { foo: 42 }};

           hub.publish('custom', data);

           expect(hub.getDelayedPublishing('custom')).toEqual(data);
        });

        it('runs all callbacks', function(){
           var obj = { foo: 2};

           hub.publish('custom', { data: { foo: 2 } });

           hub.subscribe('custom', function(data){
              obj.foo += data.data.foo;
           });

           hub.subscribe('custom', function(data){
               obj.foo *= data.data.foo;
           });

           expect(obj.foo).toEqual(8);
        });
    });

    describe('subscribe', function(){
        it('handles errors thrown on callbacks', function(){
            hub.publish('custom', {});
            hub.subscribe('custom', function(){});
            expect(hub.getEvents()['custom'].callbacks.length).toEqual(1);

            hub.subscribe('custom', function(){ throw new Error('You cannot pass!')});
            expect(hub.getEvents()['custom'].callbacks.length).toEqual(2);
        });

        it('creates event when subscribes on it', function(){
            hub.subscribe('custom', function(){});

            expect(Object.keys(hub.getEvents()).length).toEqual(1);
            expect(hub.getEvents().hasOwnProperty('custom')).toBeTruthy();
        });

        it('different callbacks on same event', function(){
            expect(Object.keys(hub.getEvents()).length).toEqual(0);

            hub.subscribe('custom', function(){});

            expect(Object.keys(hub.getEvents()).length).toEqual(1);

            hub.subscribe('custom', function(){});

            expect(Object.keys(hub.getEvents()).length).toEqual(1);

            expect(hub.getEvents()['custom'].callbacks.length).toEqual(2);
        });

        it('same callback can subscribe only once', function(){
            var callback = function(){ return 'I am the same'; };

            hub.subscribe('custom', callback);
            expect(hub.getEvents()['custom'].callbacks.length).toEqual(1);

            hub.subscribe('custom', callback);
            expect(hub.getEvents()['custom'].callbacks.length).toEqual(1);
        });

        it('after publish', function(){
            var obj = { };
            hub.publish('foo_called', { data: { foo: 'bar' }, message: 'foo was called'});
            hub.subscribe('foo_called', function(){ obj.foo = 'bar'});

            expect(obj.hasOwnProperty('foo')).toBeTruthy();
        });

        it('before publish', function(){
            var obj = { };
            hub.subscribe('foo_called', function(){ obj.foo = 'bar'});
            hub.publish('foo_called', { data: { foo: 'bar' }, message: 'foo was called'});

            expect(obj.hasOwnProperty('foo')).toBeTruthy();
        });
    });
});