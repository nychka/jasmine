describe('PriceAggregator', function(){
    var aggregator, component;

    beforeEach(function(){
        aggregator = new PriceAggregator();
        component = new PriceComponent({ id: 'foo', price: 101 });
    });

    describe('Component progression', function(){

        it('has one component: payment_manager', function(){
            aggregator.registerComponent(new PaymentManager({ id: 'payment_manager' }));
            var components = aggregator.getComponents();

            expect(Object.keys(components).length).toEqual(1);
            expect(components['payment_manager'] instanceof PaymentManager).toBeTruthy();
        });

        it('has one component: payment_manager which is aggregator of components', function(){
            var manager = new PaymentManager({ id: 'payment_manager' });
            manager.registerComponent(new PriceComponent({ id: 'foo', price: 51 }));
            manager.registerComponent(new PriceComponent({ id: 'bar', price: 49 }));

            aggregator.registerComponent(manager);

            expect(aggregator.getPrice()).toEqual(100);
        });

        it('has two components: payment_manager and bonus_manager', function(){
            var payment_manager = new PaymentManager({ id: 'payment_manager' });
            var bonus_manager = new BonusManager({ id: 'bonus_manager' });
            payment_manager.registerComponent(new PriceComponent({ id: 'webmoney', price: 500 }));
            bonus_manager.registerComponent(new PriceComponent({ id: 'ttn', price: -150 }));
            bonus_manager.registerComponent(new PriceComponent({ id: 'promo', price: 650 }));

            aggregator.registerComponent(payment_manager);
            aggregator.registerComponent(bonus_manager);

            expect(aggregator.getPrice()).toEqual(1000);
        });
    });

   describe('API', function(){
      describe('getPrice', function(){
          it('has no components returns zero', function(){
              expect(aggregator.getPrice()).toEqual(0);
          });

          it('has one component', function(){
             component.setPrice(100);
             aggregator.registerComponent(component);

             expect(aggregator.getPrice()).toEqual(100);
          });

          it('register filter', function(){
              component.setPrice(100);
              aggregator.registerComponent(component);
             aggregator.registerFilter('basePrice', function(){
                return this.findComponentById('foo').getPrice() / 100 * 25;
             });

             expect(aggregator.getPrice('basePrice')).toEqual(25);
          });
      });

      describe('getComponents', function(){
          it('is collection of components', function(){
              expect(typeof aggregator.getComponents() === 'object').toBeTruthy();
          });

          it('with callback', function(){
              var foo = component;
              var bar = new PriceComponent({ id: 'bar' });
              var components = [foo, bar];
              var items = [];

              aggregator.registerComponent(foo);
              aggregator.registerComponent(bar);

              aggregator.getComponents(function(comp){
                  items.push(comp);
              });

              expect(components).toEqual(items);
          });

          it('without callback', function(){
              var foo = component;
              var bar = new PriceComponent({ id: 'bar' });
              var components = { foo: foo, bar: bar };

              aggregator.registerComponent(foo);
              aggregator.registerComponent(bar);

              expect(aggregator.getComponents()).toEqual(components);
          });
      });

      it('registerComponent', function(){
          var item = new PriceComponent({ id: 'foobar', price: 10 });
          aggregator.registerComponent(item);

          expect(aggregator.getComponents()).toEqual({ foobar: item });
      });
   });

   describe('Filters', function(){
       var foo, bar;

       beforeEach(function(){
           foo = new PriceComponent({ id: 'foo', price: 125});
           bar = new PriceComponent({ id: 'bar', price: 275});
       });

      it('total', function(){
            var fn = function(aggregator){
                var price = 0;

                aggregator.getComponents(function(component){
                    price += component.getPrice();
                });

                return price;
            };

            aggregator.registerFilter('total', fn);
            aggregator.registerComponent(foo);
            aggregator.registerComponent(bar);

            expect(aggregator.getPrice()).toEqual(400);
      });

      describe('basePrice', function(){
          it('returns sum of payment_system and markup when no markup', function(){
              var payment_system = new PriceComponent({ id: 'payment_system', price: 200 });
              aggregator.registerComponent(payment_system);

              var fn = function(aggregator){
                 return  aggregator.getPrice('sum', ['payment_system', 'markup']);
              };

              aggregator.registerFilter('base', fn);

              expect(aggregator.getPrice('base')).toEqual(200);
          });

          it('returns sum of payment_system and markup', function(){
              var payment_system = new PriceComponent({ id: 'payment_system', price: 200 });
              var markup = new PriceComponent({ id: 'markup', price: 300 });

              aggregator.registerComponent(payment_system);
              aggregator.registerComponent(markup);

              var fn = function(aggregator){
                  return  aggregator.getPrice('sum', ['payment_system', 'markup']);
              };

              aggregator.registerFilter('base', fn);

              expect(aggregator.getPrice('base')).toEqual(500);
          });
      });
   });
});