describe('ServiceManager', function(){
    var service, manager;

    beforeEach(function(){
        loadFixtures('additional_services.html');

       service = new FooService();
       service.setCost(0);
       manager = new ServiceManager();
    });

    describe('canAdd', function(){
        it('when has implemented ServiceInterface', function(){
           expect(manager.canAdd(service)).toBeTruthy();
        });

        it('when has not implemented ServiceInterface', function(){
            expect(manager.canAdd({ id: 'fake'})).toBeFalsy();
        });

        it('when has invalid cost', function(){
            service.setCost(undefined);

           expect(manager.canAdd(service)).toBeFalsy();
        });
    });

    describe('check', function(){
       it('when not implemented ServiceInterface, throws error', function(){
           var fake_service = { id: 'fake', getId: function(){ return 'fake'; }};

           expect(function(){
               manager.check(fake_service)
           }).toThrow(new ServiceInterfaceNotImplementedException(fake_service));
       });

       it('when has invalid cost, throws error', function(){
           service.setCost(NaN);

           expect(function(){
               manager.check(service)
           }).toThrow(new ServiceInterfaceCostIsNotNumberException(service));
       });
    });

    describe('add', function(){
        it('decreases count by 1', function(){
            expect(manager.add(service)).toEqual(1);
        });
    });

    describe('getServices', function(){
       it('returns collection of all services', function(){
           manager.add(service);
           var services = manager.getServices();
           var id = service.getId();

           expect(Object.keys(services).length).toEqual(1);
           expect(services[id]).toEqual(service);

           manager.add(new BarService());

           expect(manager.count()).toEqual(2);
       });
    });
});