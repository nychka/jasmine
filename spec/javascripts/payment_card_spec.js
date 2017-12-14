 describe("PaymentCard", function() {
     beforeEach(function () {
         loadFixtures("momentum_card_with_four_layers.html");

         this.card = new PaymentCard();
         this.card.initializeDefaultCardTypes();
         this.card.addCardType({
             card_type: 'momentum',
             numbers: [63, 66, 67, 68, 69],
             states: [MomentumActivatedState, MomentumFilledState]
         });
     });

     describe('Default Validation', function () {
         it('form is not valid cardholder, month, year and cvv are empty', function () {
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
         it('validates first card number with invalid card type 3168', function () {
             var form = $('form');
             var form_validator = form.validate();
             $('#card_number_0').val('3168');

             expect(form.valid()).toBeFalsy();
             expect(form_validator.errorList.length).toEqual(5);
             expect(form_validator.errorList[0].element).toHaveId('card_number_0');
             expect(form_validator.errorList[0].message).toEqual('Please enter a valid card number.');
         });
         it('validates first card number with card type VISA 4168', function () {
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
         it('validates date month with invalid number 13', function () {
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
         it('validates date year with invalid expiration date', function () {
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
         it('validates card holder with with empty string', function () {
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
         it('validates card cvv with with empty string', function () {
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
         it('validates card cvv with with invalid number 12', function () {
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
         it('validates form with correct data', function () {
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
         it('is not valid when enters only 2 digits', function () {
             var card = new PaymentCard();
             var form = $('form');
             var form_validator = form.validate();
             var first = $('#card_number_0'),
                 second = $('#card_number_1'),
                 third = $('#card_number_2'),
                 fourth = $('#card_number_3'),
                 extra = $('#card_number_4'),
                 month = $('#card_date_month'),
                 year = $('#card_date_year'),
                 card_holder = $('#card_holder'),
                 cvv = $('#card_cvv');


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

     describe('Maestro Momentum', function () {
         it("has label from 16 to 18 signs", function () {
             var text = $('.card-number:visible label').text();
             expect(text).toEqual('Номер карты (от 16 до 18 цифр)');
         });
         it('has 4 card blocks', function () {
             var blocks = $('.way_description_block_aircompany .card_num');
             expect(blocks.length).toEqual(4);
         });
         it('has additional input on each card block', function () {
             var blocks = $('.card_num #card_number_4');
             expect(blocks.length).toEqual(4);
         });
         it('additional input is disabled by default', function () {
             var input = $('#card_number_4');
             expect(input.prop('disabled')).toBeTruthy();
         });
         it('checks card wrapper', function () {
             var card = new PaymentCard();
             expect(card.getWrapper()).toExist();
         });
         it('checks card input wrapper', function () {
             var card = new PaymentCard();
             expect(card.settings.card_input_wrapper).toExist();
         });

     });

     describe('API', function () {
         it('::getNumberInputs', function () {
             var card = new PaymentCard();
             expect(card.getNumberInputs().length).toEqual(20);
         });

         it('::getActiveNumberInputs()', function () {
             var card = new PaymentCard();
             expect(card.getActiveNumberInputs().length).toEqual(5);
         });

         it('::getCount() with 0', function () {
             var card = new PaymentCard();
             expect(card.getCount()).toEqual(0);
         });

         it('::getCount() with 4', function () {
             var card = new PaymentCard();
             $('#card_number_0').val(1234);
             expect(card.getCount()).toEqual(4);
         });

         it('::getCardTypeByFirstDigits()', function () {
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

         it('::getFirstInput', function () {
             var card = new PaymentCard();
             var input = card.getFirstInput();
             expect(input).toBeInDOM();
             expect(input).toHaveId('card_number_0');
         });

         it('::passLuhnAlgorythm', function () {
             var card = new PaymentCard();
             expect(card.passLuhnAlgorythm('6368 5168 7572 9718 56')).toBeTruthy();
             expect(card.passLuhnAlgorythm('6368 5168 7572 9718 55')).toBeFalsy();
             expect(card.passLuhnAlgorythm('6368 5168 7572 9731')).toBeTruthy();
             expect(card.passLuhnAlgorythm('6368 5168 7572 9732')).toBeFalsy();
             expect(card.passLuhnAlgorythm('6368516875729731')).toBeTruthy();
         });

         it('::getCardBlocks', function () {
             var card = new PaymentCard();
             var blocks = $('.card_data');
             expect(blocks.length).toEqual(4);
             expect(card.hasOwnProperty('card_blocks')).toBeFalsy();
             expect(card.getCardBlocks()).toEqual(blocks);
         });

         it('::getWrapper', function () {
             var card = new PaymentCard();
             var wrapper = $('.card_data');
             expect(card.getWrapper()).toEqual(wrapper);
         });

         it('::bindFirstNumberListener', function () {
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

         it('::getContext', function () {
             var card = new PaymentCard();
             var active_block = card.getWrapper();
             var inputs = active_block.find('.card_input');
             var card_blocks = card.getCardBlocks();
             var context = {
                 'self': card,
                 'wrapper': active_block,
                 'card_input_wrapper': active_block.find(card.settings.card_input_wrapper),
                 'card_number_0': active_block.find('#card_number_0'),
                 'card_number_1': active_block.find('#card_number_1'),
                 'card_number_2': active_block.find('#card_number_2'),
                 'card_number_3': active_block.find('#card_number_3'),
                 'card_number_4': active_block.find('#card_number_4'),
                 'card_date_month': active_block.find('#card_date_month'),
                 'card_date_year': active_block.find('#card_date_year'),
                 'card_holder': active_block.find('#card_holder'),
                 'card_cvv': active_block.find('#card_cvv')
             };
             expect(inputs.length).toEqual(9 * card_blocks.length);
             expect(card.getContext()).toEqual(context);
         });

         it('::getCurrentState', function () {
             var card = new PaymentCard();
             var state = card.getCurrentState();

             expect(state instanceof DefaultState).toBeTruthy();
         });

         it('::getAllStates', function () {
             var states = this.card.getAllStates();

             expect(Object.keys(states).length).toEqual(3);
             expect(states['default'] instanceof DefaultState).toBeTruthy();
             expect(states['momentum_activated'] instanceof MomentumActivatedState).toBeTruthy();
             expect(states['momentum_filled'] instanceof MomentumFilledState).toBeTruthy();
         });

         it('::getState', function () {
             var card = new PaymentCard();
             var state = card.getState('default');

             expect(state instanceof DefaultState).toBeTruthy();
         });

         it('::transitToState', function () {
             var state = this.card.getState('momentum_activated');
             var current_state = this.card.getCurrentState();

             expect(current_state instanceof DefaultState).toBeTruthy();
             this.card.transitToState('momentum_activated');
             expect(this.card.getCurrentState() instanceof MomentumActivatedState).toBeTruthy();
         });

         describe('::getCardTypes', function () {
             it('all', function () {
                 expect(this.card.getCardTypes().length).toEqual(3);
             });
             it('enabled', function () {
                 this.card.getCardTypeById('momentum').disable();
                 expect(this.card.getCardTypes(true).length).toEqual(2);
             });
             it('disabled', function () {
                 this.card.getCardTypeById('momentum').disable();
                 expect(this.card.getCardTypes(false).length).toEqual(1);
             });
         });

         it('::getCurrentCardType', function () {
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

         it('::getCardTypeById', function () {
             var type = this.card.getCardTypeById('momentum');

             expect(type instanceof CardType).toBeTruthy();
             expect(type.id).toEqual('momentum');
         });

         it('::disableCardType', function () {
             var types = this.card.getCardTypes();

             expect(types.length).toEqual(3);

             this.card.getCardTypeById('momentum').disable();

             expect(this.card.getCardTypes(true).length).toEqual(2);
             this.card.transit('63');
             expect(this.card.getCurrentCardType()).toBeFalsy();
             expect(this.card.getCurrentState().name).toEqual('default');
         });
     });
 });
