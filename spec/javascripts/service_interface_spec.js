describe('ServiceInterface', function(){
    var serviceManager, service;

    beforeEach(function(){
        loadFixtures('additional_services.html');

        serviceManager = new ServiceManager();
        service = new FooService();
        service.setManager(serviceManager);
    });

    it('service instance of ServiceInterface', function(){
       expect(service instanceof ServiceInterface).toBeTruthy();
    });

    it('getId', function(){
        expect(service.getId()).toEqual(service.id);
    });

    describe('getContainer', function(){
        it('exists in DOM', function(){
           expect(service.mainWrapp).toExist();
        });
    });

    describe('getCost', function(){
        it('by default 0', function(){
            expect(service.getCost()).toEqual(0);
        });

        it('when NaN, returns 0', function(){
            service.setCost(NaN);

            expect(service.getCost()).toEqual(0);
        });
    });

    it('getManager', function(){
       expect(service.getManager()).toBe(serviceManager);
    });

    describe('changeCurrency', function(){
        it('when has not been implemented, throws error', function() {
            delete service.constructor.prototype['changeCurrency'];

            expect(function () {
                service.changeCurrency('USD')
            }).toThrow(new ServiceInterfaceMethodNotImplementedException(service, 'changeCurrency'));
        });
    });

    describe('canNotify', function(){
        it('by default', function(){
            expect(service.canNotify()).toBeFalsy();
        });

        it('when call allowNotify(true)', function(){
            service.allowNotify(true);

            expect(service.canNotify()).toBeTruthy();
        });

        it('when call allowNotify(false)', function(){
            service.allowNotify(false);

            expect(service.canNotify()).toBeFalsy();
        });
    });

    describe('notify', function(){
       it('when can not notify', function(){
           spyOn(serviceManager, 'update');
           service.notify();

           expect(serviceManager.update).not.toHaveBeenCalled();
       });

        it('when can notify', function(){
            spyOn(serviceManager, 'update');
            service.allowNotify(true);
            service.notify();

            expect(serviceManager.update).toHaveBeenCalled();
            expect(service.canNotify()).toBeFalsy();
        });
    });

    describe('init', function(){
       it('when has not been implemented, throws error', function(){
           delete service.constructor.prototype['init'];

          expect(function(){
              service.init();
          }).toThrow(new ServiceInterfaceMethodNotImplementedException(service, 'init'));
       });
    });

    describe('toggleService', function(){
        it('hides service when toggleService(false)', function(){
            service.toggleService(false);

            expect(service.mainWrapp.is(':hidden')).toBeTruthy();
        });

        it('shows service whne toggleService(true)', function(){
           service.toggleService(true);

           expect(service.mainWrapp.is(':hidden')).toBeFalsy();
        });

        it('when has not been implemented, throws error', function(){
            delete service.constructor.prototype['toggleService'];

            expect(function(){
                service.toggleService();
            }).toThrow(new ServiceInterfaceMethodNotImplementedException(service, 'toggleService'));
        });
    });
});