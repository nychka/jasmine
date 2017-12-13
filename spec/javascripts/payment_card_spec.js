 describe("PaymentCard", function(){
    beforeEach(function(){
        loadFixtures("momentum_card_with_four_layers.html");
    });
    it("has label from 16 to 18 signs", function(){
        var text = $('.card-number:visible label').text();
        expect(text).toEqual('Номер карты (от 16 до 18 цифр)');
    });
    it('has 4 card blocks', function(){
        var blocks = $('.way_description_block_aircompany .card_num');
        expect(blocks.length).toEqual(4);
    });
    it('has additional input on each card block', function(){
        var blocks = $('.card_num #card_number_4');
        expect(blocks.length).toEqual(4);
    });
    it('additional input is disabled by default', function(){
        var input = $('#card_number_4');
        expect(input.prop('disabled')).toBeTruthy();
    });
    describe('Default Validation', function(){
        it('form is not valid cardholder, month, year and cvv are empty', function(){
            var active_block = $('.card_number:visible');
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('5168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('4168');
            $('#card_number_3').val('9712');

            expect(form.valid()).toBeFalsy();
            // debugger;
            expect(form_validator.errorList.length).toEqual(4);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');

            expect(form_validator.errorList[1].element).toHaveId('card_date_year');
            expect(form_validator.errorList[1].message).toEqual('This field is required.');

            expect(form_validator.errorList[2].element).toHaveId('card_holder');
            expect(form_validator.errorList[2].message).toEqual('This field is required.');

            expect(form_validator.errorList[3].element).toHaveId('card_cvv');
            expect(form_validator.errorList[3].message).toEqual('This field is required.');
        });
        it('validates first card number with invalid card type 3168', function(){
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('3168');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(5);
            expect(form_validator.errorList[0].element).toHaveId('card_number_0');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number.');
        });
        it('validates first card number with card type VISA 4168', function(){
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(4);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        it('validates date month with invalid number 13', function(){
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_year').val(20);
            $('#card_date_month').val(13);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(3);
            expect(form_validator.errorList[0].element).toHaveId('card_date_month');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid expiration date.');
        });
        it('validates date year with invalid expiration date', function(){
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            var card_date_year = $('#card_date_year');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            card_date_year.val(16);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(3);
            expect(form_validator.errorList[0].element).toHaveId('card_date_year');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid expiration date.');
        });
        it('validates card holder with with empty string', function(){
            var form = $('form');
            var form_validator = form.validate();
            var first_card_number = $('#card_number_0');
            var card_date_year = $('#card_date_year');
            first_card_number.val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            card_date_year.val(20);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(2);
            expect(form_validator.errorList[0].element).toHaveId('card_holder');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        it('validates card cvv with with empty string', function(){
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            $('#card_date_year').val(20);
            $('#card_holder').val('Cardholder');

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(1);
            expect(form_validator.errorList[0].element).toHaveId('card_cvv');
            expect(form_validator.errorList[0].message).toEqual('This field is required.');
        });
        it('validates card cvv with with invalid number 12', function(){
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            $('#card_date_year').val(20);
            $('#card_holder').val('Cardholder');
            $('#card_cvv').val(12);

            expect(form.valid()).toBeFalsy();
            expect(form_validator.errorList.length).toEqual(1);
            expect(form_validator.errorList[0].element).toHaveId('card_cvv');
            expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number.');
        });
        it('validates form with correct data', function(){
            var form = $('form');
            var form_validator = form.validate();
            $('#card_number_0').val('4168');
            $('#card_number_1').val('7572');
            $('#card_number_2').val('5168');
            $('#card_number_3').val('9712');
            $('#card_date_month').val(12);
            $('#card_date_year').val(20);
            $('#card_holder').val('Cardholder');
            $('#card_cvv').val(123);

            expect(form.valid()).toBeTruthy();
            expect(form_validator.errorList.length).toEqual(0);
        });
        it('is not valid when enters only 2 digits', function(){
            var card = new PaymentCard();
            var form = $('form');
            var form_validator = form.validate();
            var first  = $('#card_number_0'),
            second = $('#card_number_1'),
            third  = $('#card_number_2'),
            fourth = $('#card_number_3'),
            extra  = $('#card_number_4'),
            month  = $('#card_date_month'),
            year   = $('#card_date_year'),
            card_holder  = $('#card_holder'),
            cvv    = $('#card_cvv');


            first.val('51');
            // second.val('7572');
            // third.val('5168');
            // fourth.val('9712');
            month.val(12);
            year.val(20);
            card_holder.val('Cardholder');
            cvv.val(123);

            expect(card.getCount()).toEqual(2);
            expect(form.valid()).toBeFalsy();
            expect(first).not.toHaveClass('valid_card_number_maestro_momentum');
        });
    });
    describe('Maestro Momentum', function(){
        beforeEach(function(){
           this.card = new PaymentCard();
           this.card.initializeDefaultCardTypes();
           this.card.addCardType({
               card_type: 'momentum',
               numbers: [63, 66, 67, 68, 69],
               states: [MomentumActivatedState, MomentumFilledState]
           });
        });
    it('checks card wrapper', function(){
        var card = new PaymentCard();
        expect(card.getWrapper()).toExist();
    });
    it('checks card input wrapper', function(){
        var card = new PaymentCard();
        expect(card.settings.card_input_wrapper).toExist();
    });
    it('::getNumberInputs', function(){
        var card = new PaymentCard();
        expect(card.getNumberInputs().length).toEqual(20);
    });
    it('::getActiveNumberInputs()', function(){
        var card = new PaymentCard();
        expect(card.getActiveNumberInputs().length).toEqual(5);
    });
    it('::getCount() with 0', function(){
        var card = new PaymentCard();
        expect(card.getCount()).toEqual(0);
    });
    it('::getCount() with 4', function(){
        var card = new PaymentCard();
        $('#card_number_0').val(1234);
        expect(card.getCount()).toEqual(4);
    });
    it('::getCardTypeByFirstDigits()', function(){
        var card = new PaymentCard();
        card.addCardType({
            card_type: 'momentum',
            numbers: [63, 66, 67, 68, 69],
            states: [MomentumActivatedState, MomentumFilledState]
        });
        expect(card.getCardTypeByFirstDigits('63').id).toEqual('momentum');
        expect(card.getCardTypeByFirstDigits(63).id).toEqual('momentum');
        expect(card.getCardTypeByFirstDigits(64)).toBeFalsy();
        expect(card.getCardTypeByFirstDigits('')).toBeFalsy();
    });
    it('::getFirstInput', function(){
        var card = new PaymentCard();
        var input = card.getFirstInput();
        expect(input).toBeInDOM();
        expect(input).toHaveId('card_number_0');
    });
    it('::passLuhnAlgorythm', function(){
        var card = new PaymentCard();
        expect(card.passLuhnAlgorythm('6368 5168 7572 9718 56')).toBeTruthy();
        expect(card.passLuhnAlgorythm('6368 5168 7572 9718 55')).toBeFalsy();
        expect(card.passLuhnAlgorythm('6368 5168 7572 9731')).toBeTruthy();
        expect(card.passLuhnAlgorythm('6368 5168 7572 9732')).toBeFalsy();
        expect(card.passLuhnAlgorythm('6368516875729731')).toBeTruthy();
    });
    it('::getCardBlocks', function(){
        var card = new PaymentCard();
        var blocks = $('.card_data');
        expect(blocks.length).toEqual(4);
        expect(card.hasOwnProperty('card_blocks')).toBeFalsy();
        expect(card.getCardBlocks()).toEqual(blocks);
    });
    it('::getWrapper', function(){
        var card = new PaymentCard();
        var wrapper = $('.card_data');
        expect(card.getWrapper()).toEqual(wrapper);
    });
    it('::bindFirstNumberListener', function(){
        var card_number = this.card.getFirstInput();
        this.card.bindFirstInputListener();
        card_number.val('63').trigger('keyup');
        var current_state = this.card.getCurrentState();

        expect(this.card.getCount()).toEqual(2);
        expect(current_state.name).toEqual('momentum_activated');

        card_number.val('51').trigger('keyup');
        var current_state = this.card.getCurrentState();

        expect(current_state.name).toEqual('default');
    });
    it('::getContext', function(){
        var card = new PaymentCard();
        var active_block = card.getWrapper();
        var inputs = active_block.find('.card_input');
        var card_blocks = card.getCardBlocks();
        var context = {
            'self':             card,
            'wrapper':       active_block,
            'card_number_0':    active_block.find('#card_number_0'),
            'card_number_1':    active_block.find('#card_number_1'),
            'card_number_2':    active_block.find('#card_number_2'),
            'card_number_3':    active_block.find('#card_number_3'),
            'card_number_4':    active_block.find('#card_number_4'),
            'card_date_month':  active_block.find('#card_date_month'),
            'card_date_year':   active_block.find('#card_date_year'),
            'card_holder':      active_block.find('#card_holder'),
            'card_cvv':         active_block.find('#card_cvv')
        };
        expect(inputs.length).toEqual(9 * card_blocks.length);
        expect(card.getContext()).toEqual(context);
    });
    it('::getCurrentState', function(){
        var card = new PaymentCard();
        var state = card.getCurrentState();

        expect(state instanceof DefaultState).toBeTruthy();
    });
    it('::getAllStates', function(){
        var states = this.card.getAllStates();

        expect(Object.keys(states).length).toEqual(3);
        expect(states['default'] instanceof DefaultState).toBeTruthy();
        expect(states['momentum_activated'] instanceof MomentumActivatedState).toBeTruthy();
        expect(states['momentum_filled'] instanceof MomentumFilledState).toBeTruthy();
    });
    it('::getState', function(){
        var card = new PaymentCard();
        var state = card.getState('default');

        expect(state instanceof DefaultState).toBeTruthy();
    });
    it('::transitToState', function(){
        var state = this.card.getState('momentum_activated');
        var current_state = this.card.getCurrentState();

        expect(current_state instanceof DefaultState).toBeTruthy();
        this.card.transitToState('momentum_activated');
        expect(this.card.getCurrentState() instanceof MomentumActivatedState).toBeTruthy();
    });
    describe('::getCardTypes', function(){
        it('all', function(){
            expect(this.card.getCardTypes().length).toEqual(3);
        });
        it('enabled', function(){
            this.card.getCardTypeById('momentum').disable();
            expect(this.card.getCardTypes(true).length).toEqual(2);
        });
        it('disabled', function(){
            this.card.getCardTypeById('momentum').disable();
            expect(this.card.getCardTypes(false).length).toEqual(1);
        });
    });
    it('::getCurrentCardType', function(){
        this.card.transit('');
        expect(this.card.getCurrentCardType()).toBeFalsy();
        this.card.transit('41');
        var type = this.card.getCurrentCardType();
        expect(type.id).toEqual('visa');
        this.card.transit('55');
        type = this.card.getCurrentCardType();
        expect(type.id).toEqual('mastercard');
        this.card.transit('63');
        type = this.card.getCurrentCardType();
        expect(type.id).toEqual('momentum');
        this.card.transitToState('default');
        type = this.card.getCurrentCardType();
        expect(type.id).toEqual('momentum');
        this.card.reset();
        type = this.card.getCurrentCardType();
        expect(type).toBeFalsy();
    });
    it('::getCardTypeById', function(){
        var type = this.card.getCardTypeById('momentum');

        expect(type instanceof CardType).toBeTruthy();
        expect(type.card_type).toEqual('momentum');
    });
    it('::disableCardType', function(){
       var types = this.card.getCardTypes();

       expect(types.length).toEqual(3);

       this.card.getCardTypeById('momentum').disable();

       expect(this.card.getCardTypes(true).length).toEqual(2);
       this.card.transit('63');
       expect(this.card.getCurrentCardType()).toBeFalsy();
       expect(this.card.getCurrentState().name).toEqual('default');
    });
    describe('CardType', function(){
       it('initialize', function(){
          var type = new CardType({ card_type: 'amex' });

          expect(type.card_type).toEqual('amex');
       });
        it('disable', function(){
            var type = new CardType({ card_type: 'amex' });

            expect(type.isActive()).toBeTruthy();
            type.disable();
            expect(type.isActive()).toBeFalsy();
            type.enable();
            expect(type.isActive()).toBeTruthy();
        });
    });

    describe('Settings', function(){
        beforeEach(function(){
            this.default_settings = {
                card_wrapper:               '.card_data',
                card_input_wrapper:         '.card-num-wrapper',
                first_input:                '#card_number_0',
                card_number_0:              '#card_number_0',
                card_number_1:              '#card_number_1',
                card_number_2:              '#card_number_2',
                card_number_3:              '#card_number_3',
                card_number_4:              '#card_number_4',
                card_date_month:            '#card_date_month',
                card_date_year:             '#card_date_year',
                card_holder:                '#card_holder',
                card_cvv:                   '#card_cvv',
                card_holder_wrapper:        '.card_owner',
                card_cvv_wrapper:           '.card_cvv',
                card_holder_not_required:   '#card_holder_not_required',
                if_you_have_cvv:            '#if_you_have_cvv'
            };
        });
        it('has constructor with settings', function(){
            var settings = { foo: 'bar' };
            var card = new PaymentCard(settings);
            $.extend(settings, this.default_settings);

            expect(card.settings).toEqual(settings);
        });
        it('has default settings', function(){
            var settings = { foo: 'bar' };
            var card = new PaymentCard(settings);

            expect(card.default_settings).toEqual(this.default_settings);
        });
        it('card settings define available states', function(){
            var card = new PaymentCard();
            var card_type = {
                card_type: 'amex',
                numbers: [34, 37],
                states: [AmexActivatedState]
            };

            expect(Object.keys(card.getAllStates()).length).toEqual(1);

            card.addCardType(card_type);

            expect(Object.keys(card.getAllStates()).length).toEqual(2);
        });
    });
    describe('State', function(){
        it('::handle', function(){
            var context = this.card.getContext();
            var state = this.card.getState('momentum_activated');

            expect(context.card_holder.prop('required')).toBeTruthy();
            state.handle(context);
            expect(context.card_holder.prop('required')).toBeFalsy();
        });
        it('::getName', function(){
            var state = new DefaultState();

            expect(state.name).toEqual('default');
        });
    });
    describe('State Contexts', function(){
        beforeEach(function(){
            this.card = new PaymentCard();
            this.card.addCardType({
                card_type: 'momentum',
                numbers: [63, 66, 67, 68, 69],
                states: [MomentumActivatedState, MomentumFilledState]
            });
            this.card.addCardType({
                card_type: 'amex',
                numbers: [34, 37],
                states: [AmexActivatedState]
            });
        });
        describe('Default', function(){
            beforeEach(function(){
                this.card.transitToState('default');
                this.context = this.card.getContext();
            });
            describe('card_number_0: first input', function(){
                it('has rule: valid_card_number - for validation plugin', function(){
                    expect(this.context.card_number_0).toHaveClass('valid_card_number');
                });
                it('has rule: valid_card_number - for validation plugin', function(){
                    expect(this.context.card_number_0).toHaveClass('valid_card_number_visa_master');
                });
                it('has not rule: valid_card_number_maestro_momentum - for validation plugin', function(){
                    expect(this.context.card_number_0).not.toHaveClass('valid_card_number_maestro_momentum');
                });
            });
            describe('card_number_4: extra input', function(){
                it('is hidden', function(){
                    expect(this.context.card_number_4).not.toBeVisible();
                });
                it('is disabled', function(){
                    expect(this.context.card_number_4).toHaveAttr('disabled');
                });
                it('is empty', function(){
                    expect(this.context.card_number_4.val()).toEqual('');
                });
            });
            describe('card_holder', function(){
                it('is required', function(){
                    expect(this.context.card_holder).toHaveAttr('required');
                    expect(this.context.card_holder.prop('required')).toBeTruthy();
                });
                it('is visible', function(){
                    expect(this.context.card_holder).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_holder).not.toHaveAttr('disabled');
                    expect(this.context.card_holder.prop('disabled')).toBeFalsy();
                });
            });
            describe('card_cvv', function(){
                it('is required', function(){
                    expect(this.context.card_cvv).toHaveAttr('required');
                    expect(this.context.card_cvv.prop('required')).toBeTruthy();
                });
                it('is visible', function(){
                    expect(this.context.card_cvv).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_cvv).not.toHaveAttr('disabled');
                    expect(this.context.card_cvv.prop('disabled')).toBeFalsy();
                });
            });
            describe('card cvv wrapper - .card_owner', function(){
                it('is visible', function(){
                    var card_holder_wrapper = this.card.settings['card_holder_wrapper'];

                    expect(this.context.wrapper.find(card_holder_wrapper)).toBeVisible();
                });
            });
            describe('link #if_you_have_cvv', function(){
                it('is hidden', function(){
                    var link = this.card.settings['if_you_have_cvv'];

                    expect(this.context.wrapper.find(link)).not.toBeVisible();
                });
            });
            describe('card holder label #card_holder_not_required', function(){
                it('is hidden', function(){
                    var label = this.card.settings['card_holder_not_required'];

                    expect(this.context.wrapper.find(label)).not.toBeVisible();
                });
            });
        });
        describe('Momentum Activated', function(){
            beforeEach(function(){
                this.card.transitToState('momentum_activated');
                this.context = this.card.getContext();
            });
            describe('card_number_0: first input', function(){
                it('has rule: valid_card_number - for validation plugin', function(){
                    expect(this.context.card_number_0).toHaveClass('valid_card_number');
                });
                it('has rule: valid_card_number - for validation plugin', function(){
                    expect(this.context.card_number_0).not.toHaveClass('valid_card_number_visa_master');
                });
                it('has not rule: valid_card_number_maestro_momentum - for validation plugin', function(){
                    expect(this.context.card_number_0).toHaveClass('valid_card_number_maestro_momentum');
                });
            });
            describe('card_number_4: extra input', function(){
                it('is visible', function(){
                    expect(this.context.card_number_4).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_number_4).not.toHaveAttr('disabled');
                });
            });
            describe('card_holder', function(){
                it('is not required', function(){
                    expect(this.context.card_holder).not.toHaveAttr('required');
                    expect(this.context.card_holder.prop('required')).toBeFalsy();
                });
                it('is visible', function(){
                    expect(this.context.card_holder).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_holder).not.toHaveAttr('disabled');
                    expect(this.context.card_holder.prop('disabled')).toBeFalsy();
                });
            });
            describe('card_cvv', function(){
                it('is required', function(){
                    expect(this.context.card_cvv).toHaveAttr('required');
                    expect(this.context.card_cvv.prop('required')).toBeTruthy();
                });
                it('is visible', function(){
                    expect(this.context.card_cvv).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_cvv).not.toHaveAttr('disabled');
                    expect(this.context.card_cvv.prop('disabled')).toBeFalsy();
                });
            });
            describe('card cvv wrapper - .card_owner', function(){
                it('is visible', function(){
                    var card_holder_wrapper = this.card.settings['card_holder_wrapper'];

                    expect(this.context.wrapper.find(card_holder_wrapper)).toBeVisible();
                });
            });
            describe('link #if_you_have_cvv', function(){
                it('is hidden', function(){
                    var link = this.card.settings['if_you_have_cvv'];

                    expect(this.context.wrapper.find(link)).not.toBeVisible();
                });
            });
            describe('card holder label #card_holder_not_required', function(){
                it('is visible', function(){
                    var label = this.card.settings['card_holder_not_required'];

                    expect(this.context.wrapper.find(label)).toBeVisible();
                });
            });
        });
        describe('Momentum Filled', function(){
            beforeEach(function(){
                this.card.transitToState('momentum_activated');
                this.card.transitToState('momentum_filled');
                this.context = this.card.getContext();
            });
            describe('card_number_0: first input', function(){
                it('has rule: valid_card_number - for validation plugin', function(){
                    expect(this.context.card_number_0).toHaveClass('valid_card_number');
                });
                it('has rule: valid_card_number - for validation plugin', function(){
                    expect(this.context.card_number_0).not.toHaveClass('valid_card_number_visa_master');
                });
                it('has not rule: valid_card_number_maestro_momentum - for validation plugin', function(){
                    expect(this.context.card_number_0).toHaveClass('valid_card_number_maestro_momentum');
                });
            });
            describe('card_number_4: extra input', function(){
                it('is visible', function(){
                    expect(this.context.card_number_4).toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_number_4).not.toHaveAttr('disabled');
                });
            });
            describe('card_holder', function(){
                it('is hidden', function(){
                    expect(this.context.card_holder).not.toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_holder).not.toHaveAttr('disabled');
                    expect(this.context.card_holder.prop('disabled')).toBeFalsy();
                });
                it('has empty value', function(){
                    expect(this.context.card_holder.val()).toEqual('');
                });
            });
            describe('card_cvv', function(){
                it('is required', function(){
                    expect(this.context.card_cvv).toHaveAttr('required');
                    expect(this.context.card_cvv.prop('required')).toBeTruthy();
                });
                it('is hidden', function(){
                    expect(this.context.card_cvv).not.toBeVisible();
                });
                it('is not disabled', function(){
                    expect(this.context.card_cvv).not.toHaveAttr('disabled');
                    expect(this.context.card_cvv.prop('disabled')).toBeFalsy();
                });
                it('is not empty', function(){
                    expect(this.context.card_cvv.val()).not.toEqual('');
                    expect(this.context.card_cvv.val()).toEqual('123');
                });
            });
            describe('card cvv wrapper - .card_owner', function(){
                it('is hidden', function(){
                    var card_holder_wrapper = this.card.settings['card_holder_wrapper'];

                    expect(this.context.wrapper.find(card_holder_wrapper)).not.toBeVisible();
                });
            });
            describe('link #if_you_have_cvv', function(){
                it('is visible', function(){
                    var link = this.card.settings['if_you_have_cvv'];

                    expect(this.context.wrapper.find(link)).toBeVisible();
                });
            });
            describe('card holder label #card_holder_not_required', function(){
                it('is hidden', function(){
                    var label = this.card.settings['card_holder_not_required'];

                    expect(this.context.wrapper.find(label)).not.toBeVisible();
                });
            });
        });
        describe('Amex Activated', function(){
            beforeEach(function(){
                this.card.transitToState('default');
                this.card.transitToState('amex_activated');
                this.context = this.card.getContext();
                this.cvv_description = 'CVV или CVC - трехзначный код на обратной стороне карты';
                this.cvv_amex_token = 'код может быть 4-ёх значным';
                this.cvv_amex_description = this.cvv_description + ' (' + this.cvv_amex_token + ')';
            });
            describe('last 16-th digit of card numbers', function() {
                it('removes last digit', function () {
                    expect(this.context.card_number_3).toHaveAttr('maxlength', '3');
                    expect(this.context.card_number_3).toHaveAttr('data-length', '3');
                    expect(this.context.card_number_3).toHaveAttr('placeholder', 'XXX');
                });
            });
            describe('CVV', function(){
               it('adds extra digit to CVV', function(){
                    expect(this.context.card_cvv).toHaveAttr('maxlength', '4');
                    expect(this.context.card_cvv).toHaveAttr('data-length', '3');
               });
               it('adds description about 4-th digit CVV', function(){
                    var element = this.context.wrapper.find(this.card.settings['card_cvv_wrapper']).find('span:first').first();

                    expect(element).toContainText(this.cvv_amex_description);
                    expect(element.text()).toEqual(this.cvv_amex_description);
               });
            });
            describe('transits to Default state', function(){
                beforeEach(function(){
                    this.card.transitToState('default');
                });
                it('restores default CVV description', function(){
                    var element = this.context.wrapper.find(this.card.settings['card_cvv_wrapper']).find('span:first').first();

                    expect(element.text()).toEqual(this.cvv_description);
                });
                it('restores last 16-th digit of card numbers', function(){
                    expect(this.context.card_number_3).toHaveAttr('maxlength', '4');
                    expect(this.context.card_number_3).toHaveAttr('data-length', '4');
                    expect(this.context.card_number_3).toHaveAttr('placeholder', 'XXXX');
                });
                it('removes extra digit from CVV', function(){
                    expect(this.context.card_cvv).toHaveAttr('maxlength', '3');
                    expect(this.context.card_cvv).toHaveAttr('data-length', '3');
                });
            });
        });
    });
    describe('when active', function(){
        it('when enters 18 signs form is valid according to Luhn\'s algorythm', function(){
            this.card.transitToState('momentum_activated');
            var form = $('form');
            var form_validator = form.validate();
            var first  = $('#card_number_0'),
            second = $('#card_number_1'),
            third  = $('#card_number_2'),
            fourth = $('#card_number_3'),
            extra  = $('#card_number_4'),
            month  = $('#card_date_month'),
            year   = $('#card_date_year'),
            card_holder  = $('#card_holder'),
            cvv    = $('#card_cvv');


            first.val('6368');
            second.val('7572');
            third.val('5168');
            fourth.val('9718');
            extra.val('56');
            month.val(12);
            year.val(20);
            card_holder.val('Cardholder');
            cvv.val(123);

            expect(this.card.getCount()).toEqual(18);
            expect(first).toHaveClass('valid_card_number');
            expect(this.card.passLuhnAlgorythm('6368 7572 5168 9718 56'));
            expect(form.valid()).toBeTruthy();
        });
        it('when enters 18 signs form is not valid: violates Luhn algorythm', function(){
            this.card.transitToState('momentum_activated');
            var form = $('form');
            var form_validator = form.validate();
            var first  = $('#card_number_0'),
            second = $('#card_number_1'),
            third  = $('#card_number_2'),
            fourth = $('#card_number_3'),
            extra  = $('#card_number_4'),
            month  = $('#card_date_month'),
            year   = $('#card_date_year'),
            card_holder  = $('#card_holder'),
            cvv    = $('#card_cvv');


            first.val('6368');
            second.val('7572');
            third.val('5168');
            fourth.val('9718');
            extra.val('55');
            month.val(12);
            year.val(20);
            card_holder.val('Cardholder');
            cvv.val(123);

            expect(this.card.getCount()).toEqual(18);
            expect(first).toHaveClass('valid_card_number');
            expect(form.valid()).toBeFalsy();
        });
        it('form is not valid when enters only 2 digits', function(){
            this.card.transitToState('momentum_activated');
            var form = $('form');
            var form_validator = form.validate();
            var first  = $('#card_number_0'),
            second = $('#card_number_1'),
            third  = $('#card_number_2'),
            fourth = $('#card_number_3'),
            extra  = $('#card_number_4'),
            month  = $('#card_date_month'),
            year   = $('#card_date_year'),
            card_holder  = $('#card_holder'),
            cvv    = $('#card_cvv');


            first.val('63');
                        // second.val('7572');
                        // third.val('5168');
                        // fourth.val('9712');
                        month.val(12);
                        year.val(20);
                        card_holder.val('Cardholder');
                        cvv.val(123);

                        expect(this.card.getCount()).toEqual(2);
                        expect(form.valid()).toBeFalsy();
                    });
        it('appends additional input with XX placeholder', function(){
            this.card.transitToState('momentum_activated');
            expect($('#card_number_4')).toExist();
        });
        it('card holder not required', function(){
            this.card.transitToState('momentum_activated');
            var card_holder = $('#card_holder');
            expect(card_holder).not.toHaveAttr('required');
            expect(card_holder.valid()).toBeTruthy();
            expect($('#card_holder_not_required')).toBeInDOM();
            expect($('#card_holder_not_required')).toBeVisible();
        });
        it('adds validation rule for first input', function(){
            this.card.transitToState('momentum_activated');
            var first_input = this.card.getFirstInput();
            expect(first_input).toHaveClass('valid_card_number_maestro_momentum');
                    // expect(first_input).not.toHaveClass('valid_card_number');
                    expect(first_input).not.toHaveClass('valid_card_number_visa_master');
                });
        describe('enters 16 signs', function(){
            it('all inputs are active', function(){
                this.card.transitToState('momentum_activated');
                var form = $('form');
                var form_validator = form.validate();
                var first  = $('#card_number_0'),
                second = $('#card_number_1'),
                third  = $('#card_number_2'),
                fourth = $('#card_number_3'),
                extra  = $('#card_number_4'),
                month  = $('#card_date_month'),
                year   = $('#card_date_year'),
                card_holder  = $('#card_holder'),
                cvv    = $('#card_cvv');


                first.val('6312');
                second.val('7572');
                third.val('5168');
                fourth.val('9712');
                month.val(12);
                year.val(20);
                card_holder.val('Cardholder');
                cvv.val(123);

                expect(this.card.getCount()).toEqual(16);
                expect(form.valid()).toBeTruthy();

                expect(extra).toBeVisible();
                expect(extra).not.toHaveAttr('required');
                expect(cvv).toBeVisible();
                expect(cvv).toHaveAttr('required');
                expect(month).toHaveAttr('required');
                expect(year).toHaveAttr('required');
                expect(card_holder).not.toHaveAttr('required');
                expect(first).not.toHaveClass('valid_card_number_visa_master');
                expect(first).toHaveClass('valid_card_number_maestro_momentum');
                expect(first).toHaveClass('valid_card_number');
            });
            it('cvv is required and link #if_you_have_cvv is hidden', function(){
                this.card.transitToState('momentum_activated');
                var form = $('form');
                var form_validator = form.validate();
                var first  = $('#card_number_0'),
                second = $('#card_number_1'),
                third  = $('#card_number_2'),
                fourth = $('#card_number_3'),
                extra  = $('#card_number_4'),
                month  = $('#card_date_month'),
                year   = $('#card_date_year'),
                card_holder  = $('#card_holder'),
                cvv    = $('#card_cvv');


                first.val('6368');
                second.val('7572');
                third.val('5168');
                fourth.val('9715');
                month.val(12);
                year.val(20);
                card_holder.val('Cardholder');
                cvv.val(123);

                expect(this.card.getCount()).toEqual(16);
                expect(form.valid()).toBeTruthy();
                expect($('#if_you_have_cvv')).not.toBeVisible();
                expect(cvv).toBeVisible();
                expect(cvv).toHaveAttr('required');
            });
            it('card holder is not required and label #card_holder_not_required is visible', function(){
                this.card.transitToState('momentum_activated');
                var form = $('form');
                var form_validator = form.validate();
                var first  = $('#card_number_0'),
                second = $('#card_number_1'),
                third  = $('#card_number_2'),
                fourth = $('#card_number_3'),
                extra  = $('#card_number_4'),
                month  = $('#card_date_month'),
                year   = $('#card_date_year'),
                card_holder  = $('#card_holder'),
                cvv    = $('#card_cvv');


                first.val('6368');
                second.val('7572');
                third.val('5168');
                fourth.val('9715');
                month.val(12);
                year.val(20);
                card_holder.val('Cardholder');
                cvv.val(123);

                expect(this.card.getCount()).toEqual(16);
                expect(form.valid()).toBeTruthy();
                expect(card_holder).not.toHaveAttr('required');
                expect($('#card_holder_not_required')).toBeVisible();
            });
            it('first input has class .valid_card_number_maestro_momentum', function(){
                this.card.transitToState('momentum_activated');
                var form = $('form');
                var form_validator = form.validate();
                var first  = $('#card_number_0'),
                second = $('#card_number_1'),
                third  = $('#card_number_2'),
                fourth = $('#card_number_3'),
                extra  = $('#card_number_4'),
                month  = $('#card_date_month'),
                year   = $('#card_date_year'),
                card_holder  = $('#card_holder'),
                cvv    = $('#card_cvv');


                first.val('6368');
                second.val('7572');
                third.val('5168');
                fourth.val('9715');
                month.val(12);
                year.val(20);
                card_holder.val('Cardholder');
                cvv.val(123);

                expect(this.card.getCount()).toEqual(16);
                expect(form.valid()).toBeTruthy();

                expect(first).not.toHaveClass('valid_card_number_visa_master');
                expect(first).toHaveClass('valid_card_number_maestro_momentum');
                expect(first).toHaveClass('valid_card_number');
            });
        });
    });
    describe('when unactive', function(){
       it('card holder is required', function(){
           this.card.transitToState('default');
           expect($('#card_holder')).toHaveAttr('required');
       });
       it('card holder text is hidden', function(){
        this.card.transitToState('default');
        expect($('#card_holder_not_required')).not.toBeVisible();
    });
       it('removes validation rule from first input', function(){
        this.card.transitToState('default');
        expect($('#card_number_0')).not.toHaveClass('valid_card_number_maestro_momentum');
        expect($('#card_number_0')).toHaveClass('valid_card_number');
        expect($('#card_number_0')).toHaveClass('valid_card_number_visa_master');
    });
       it('clears additional card number input value', function(){
        this.card.transitToState('momentum_activated');
        var input = this.card.getContext()['card_number_4'];
        input.val('foo');
        this.card.transitToState('default');
        expect(input).toBeInDOM();
        expect(input).not.toBeVisible();
        expect(input).toHaveValue('');
    });
    });
    describe('MultiBlock', function(){
        it('bind listeners to all available card blocks', function(){
            this.card.bindFirstInputListener();
            var card_blocks = this.card.getCardBlocks();
            var active = $(card_blocks[0]);
            var disabled = $(card_blocks[1]);
            expect(active).toBeVisible();
            expect(disabled).not.toBeVisible();

                    var active_first = active.find('#card_number_0');//debugger;
                    var disabled_first = disabled.find('#card_number_0');
                    expect(active_first).not.toHaveClass('valid_card_number_maestro_momentum');
                    expect(disabled_first).not.toHaveClass('valid_card_number_maestro_momentum');
                    active_first.val('63').trigger('keyup');
                    expect(active_first).toHaveClass('valid_card_number_maestro_momentum');

                disabled_first.val('63').trigger('keyup');
                expect(disabled_first).toHaveClass('valid_card_number_maestro_momentum');
            });
    it('binds listener for operate', function(){
        this.card.bindFirstInputListener();
        this.card.bindListeners();
        var card_blocks = this.card.getCardBlocks();
        var active = $(card_blocks[0]);
        var disabled = $(card_blocks[1]);
        expect(active).toBeVisible();
        expect(disabled).not.toBeVisible();

                    var active_first = active.find('#card_number_0');//debugger;
                    var disabled_first = disabled.find('#card_number_0');
                    active.find('#card_number_0').val('6311').trigger('keyup');
                    active.find('#card_number_1').val('1111');
                    active.find('#card_number_2').val('1111');
                    active.find('#card_number_3').val('1111');
                    active.find('#card_number_4').val('11');

                    expect(this.card.getCount()).toEqual(18);
                    expect(this.card.getCurrentState().name).toEqual('momentum_activated');
                    expect(active.find('.card_owner')).toBeVisible();
                    active_first.trigger('keyup');
                    expect(this.card.getCurrentState().name).toEqual('momentum_filled');
                    expect(active.find('.card_owner')).not.toBeVisible();

                    disabled_first.val('63').trigger('keyup');
                    expect(disabled_first).toHaveClass('valid_card_number_maestro_momentum');
                    disabled.find('#card_number_0').val('6311');
                    disabled.find('#card_number_1').val('1111');
                    disabled.find('#card_number_2').val('1111');
                    disabled.find('#card_number_3').val('1111');
                    disabled.find('#card_number_4').val('11');
                    disabled.find('#card_holder').val('Cardholder');
                    expect(this.card.getCount()).toEqual(18);
                    var card_holder = disabled.find('#card_holder');
                    expect(card_holder.val()).toEqual('Cardholder');
                    disabled_first.trigger('keyup');
                    expect(card_holder.val()).toEqual('');
                    expect(card_holder).not.toBeVisible();
                });
    });
    });
    describe('American Express', function(){
        beforeEach(function(){
           this.card = new PaymentCard();
           this.card.addCardType({card_type: 'amex', numbers: [34, 37], states: [AmexActivatedState]});
        });
        describe('validation', function(){
            it('has validation rule only when amex_activated state is active', function(){
                var context = this.card.getContext();
                this.card.transitToState('default');
                expect(context.card_number_0).not.toHaveClass('valid_card_number_amex');
                this.card.transitToState('amex_activated');
                expect(context.card_number_0).toHaveClass('valid_card_number_amex');
                this.card.transitToState('default');
                expect(context.card_number_0).not.toHaveClass('valid_card_number_amex');
            });
            it('card_number_0 is valid when has class valid_card_number_amex', function(){
                this.card.transitToState('amex_activated');
                var form = $('form');
                var form_validator = form.validate();
                var context = this.card.getContext();
                context.card_number_0.val('3400');
                context.card_number_1.val('0000');
                context.card_number_2.val('0000');
                context.card_number_3.val('000');
                context.card_date_month.val(12);
                context.card_date_year.val(20);
                context.card_holder.val('Cardholder');
                context.card_cvv.val(123);

                expect(form.valid()).toBeTruthy();
                expect(form_validator.errorList.length).toEqual(0);
            });
            it('cvv can be 4-digit', function(){
                this.card.transitToState('amex_activated');
                var form = $('form');
                var form_validator = form.validate();
                var context = this.card.getContext();
                context.card_number_0.val('3400');
                context.card_number_1.val('0000');
                context.card_number_2.val('0000');
                context.card_number_3.val('000');
                context.card_date_month.val(12);
                context.card_date_year.val(20);
                context.card_holder.val('Cardholder');
                context.card_cvv.val(1234);

                expect(form.valid()).toBeTruthy();
                expect(form_validator.errorList.length).toEqual(0);
            });
        });
        describe('numbers [34, 37] activates AmexActivatedState', function(){
            it('first input triggers with [34] and transits to AmexActivatedState', function(){
                var card_number = this.card.getFirstInput();
                this.card.bindFirstInputListener();
                card_number.val('34').trigger('keyup');
                var current_state = this.card.getCurrentState();

                expect(this.card.getCount()).toEqual(2);
                expect(current_state.name).toEqual('amex_activated');

                card_number.val('51').trigger('keyup');
                var current_state = this.card.getCurrentState();

                expect(current_state.name).toEqual('default');
            });
        });
    });
});
