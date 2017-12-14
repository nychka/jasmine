describe('CardsPicker', function(){
    var picker, options, card;

    beforeEach(function(){
        loadFixtures('cards_picker.html');

        options = {
            wrapper: $('.usb_cards_block').first(),
            pickerSelector:  'select',
            cards: [
                { number: "4363231111", group: 'otp' },
                { number: "4363231112", group: 'otp'},
                { number: "4363231113", group: 'default'},
                { number: "4363231114", group: 'default'},
                { number: "4363231115", group: 'default'}
            ]
        };
        Hub.dispatcher.addController('payment', { getPaymentCard: function(){ return new PaymentCard(); }});
        picker = new CardsPicker(options);
        card =  { number: "4363231112", name: 'user_card', group: 'otp' };
    });

    describe('UserCard', function(){
        var userCard;

        beforeEach(function(){
            userCard = new UserCard(card);
        });

        describe('API', function(){
            it('getGroup', function(){
                expect(userCard.getGroup()).toEqual('otp');
            });

            it('first_token', function(){
               expect(userCard.get('first_token')).toEqual('4363');
            });

            it('second_token', function(){
                expect(userCard.get('second_token')).toEqual('23XX');
            });

            it('third_token', function(){
                expect(userCard.get('third_token')).toEqual('XXXX');
            });

            it('last_token', function(){
                expect(userCard.get('last_token')).toEqual('1112');
            });

            it('ten', function(){
               expect(userCard.get('ten')).toEqual(card.number);
               expect(userCard.get()).toEqual(card.number);
            });

            it('sixteen', function(){
                expect(userCard.get('sixteen')).toEqual('4363 23XX XXXX 1112');
            });

            it('eight', function(){
                expect(userCard.get('eight')).toEqual('43631112');
            });
        });
    });

    describe('API', function(){
        describe('getWrapper', function(){
            it('is in DOM', function(){
                expect(picker.getWrapper()).toBeInDOM();
            });

            it('has correct wrapper', function(){
                expect(picker.getWrapper()).toEqual(options.wrapper);
            });
        });

        it('getPickerContainer', function(){
            picker.setup();

            expect(picker.getPickerContainer()).toExist();
        });

        it('prepareCards', function(){
            expect(picker.getCards().length).toEqual(5);
        });

        it('count', function(){
            picker.setup('default');

            expect(picker.count()).toEqual(3);

            picker.state.transitTo('otp');

            expect(picker.count()).toEqual(2);

            picker.clear();

            expect(picker.count()).toEqual(0);
        });

        describe('findCardById', function(){
            it('correct', function(){
                var card  = picker.findCardById("4363231111");

                expect(card.number).toEqual("4363231111");
            });

            it('wrong', function(){
                var card  = picker.findCardById("000000");

                expect(card).toBeFalsy();
            });
        });

       it('clear', function(){
          picker.setup();

          expect(picker.getPickerContainer().children().length).toBeGreaterThan(0);

          picker.clear();

          expect(picker.getPickerContainer().children().length).toEqual(0);
       });

       describe('getCards', function(){
           it('otp', function(){
               var otpCards  = picker.prepareCards().filter(function(card){ return card.group === 'otp'; });

               expect(picker.getCards('group','otp')).toEqual(otpCards);
           });

           it('default', function(){
               var cards  = picker.prepareCards().filter(function(card){ return card.group === 'default'; });

               expect(picker.getCards('group','default')).toEqual(cards);
           });

           it('all', function(){
               expect(picker.getCards()).toEqual(picker.prepareCards());
           });

           it('number', function(){
               var cards  = picker.getCards('number', "4363231111");

               expect(cards.length).toEqual(1);
               expect(cards[0].number).toEqual("4363231111");
           });
       });

       it('getOptions', function(){
           picker.setup({ filter: 'default'} );

           expect(picker.getOptions().length).toEqual(3);
       });

        describe('setup', function(){
            it('prepare card options for picker container', function(){
                var settings = Object.create(options);
                settings.cards = [
                    { number: "4363231112", name: 'user_card', group: 'otp' }
                ];
                picker = new CardsPicker(settings);
                picker.setup();

                var userCard = new UserCard(picker.settings.cards[0]);

                expect(picker.getCards()).toEqual([userCard]);
            });
        });

        describe('buildCardOption', function() {
            it('builds with valid card number 4363231112', function () {
                var text = "4363 23XX XXXX 1112";
                var value = "43631112";
                var option = picker.buildCardOption(new UserCard(card));

                expect(option.text()).toEqual(text);
                expect(option.val()).toEqual(value);
            });
        });

        describe('isValidCardNumber', function(){
            it('when card number has length 10 is valid', function(){
                expect(picker.isValidCardNumber("4363231112")).toBeTruthy();
            });

            it('when card number has length 16 is not valid', function(){
                expect(picker.isValidCardNumber("4111222211113333")).toBeFalsy();
            });
        });
    });

    describe('Scenarios', function(){
       it('when otp bonus is used, user can use only otp cards', function(){
           picker.state.transitTo('otp');

           expect(picker.getOptions().length).toEqual(2);
       });

       it('when otp bonus is not used, user can see only default cards', function(){
           picker.state.transitTo('default');

           expect(picker.getOptions().length).toEqual(3);
       });

       it('component transits to otp, when no otp cards available', function(){
          var settings = Object.create(options);

          settings.cards = [
              { number: "4363231113", group: 'default'},
              { number: "4363231114", group: 'default'}
          ];

          picker = new CardsPicker(settings);

          picker.state.transitTo('otp');

          expect(picker.history.find('state_not_changed').length).toBeTruthy();
          expect(picker.state.getCurrent().getId()).toEqual('default');
       });

        it('component transits to default, when no default cards available', function(){
            var settings = Object.create(options);

            settings.cards = [
                { number: "4363231113", group: 'otp'},
                { number: "4363231114", group: 'otp'}
            ];

            picker = new CardsPicker(settings);
            picker.state.transitTo('disabled');

            picker.state.transitTo('default');

            expect(picker.history.find('state_not_changed').length).toBeTruthy();
            expect(picker.state.getCurrent().getId()).toEqual('disabled');
        });
    });

    describe('History plugin', function(){
       it('initialized', function(){
            expect(picker.history.find('initialized')).toEqual([{ message: 'Component has been initialized with settings' }]);
       });

       it('prepared', function(){
           picker.setup();

           expect(picker.history.find('prepared')).toEqual([{ message: 'Component has been prepared', data: { cards: picker.getCards() }}]);
       });
    });

    describe('State plugin', function(){
        describe('get', function(){
            it('when state registered', function(){
                picker.state.register('default', function(){
                   this.name = 'default';
                });
               expect(picker.state.get('default').name).toEqual('default');
            });

            it('when no state found', function(){
                expect(function(){
                    picker.state.get('fd');
                }).toThrow( State.prototype.errors.state_not_found('fd'));
            });
        });

       describe('getCurrent', function(){
           it('default', function(){
               expect(picker.state.getCurrent()).toEqual(picker.state.get('default'));
           });

           it('activated', function(){
               picker.state.register('activated', function(){
                   this.handle = function(){
                       picker.fakeState = 'foo';
                   }
               });

               expect(picker.fakeState).not.toBe('foo');

               picker.state.transitTo('activated');

               expect(picker.fakeState).toBe('foo');
           });
       });

       it('register', function(){
          picker.state.register('activated', function(){});

          expect(function(){
              picker.state.transitTo('activated');
          }).toThrow(State.prototype.errors.method_not_overloaded('handle'));
       });
    });
});