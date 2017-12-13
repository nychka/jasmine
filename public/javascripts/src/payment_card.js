function PaymentCard(settings){

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
    this.settings = $.extend({}, this.default_settings, settings);
    this.card_types = [];
    this.storage = {};
    this.states = {
        'default': new DefaultState()
    };
    this.default = {
        cvv: null
    };
    this.currentCardType = null;
    this.setStorage = function(storage)
    {
        this.storage = storage;
    };
    this.getStorage = function()
    {
        return this.storage;
    };
    this.addCardType = function(card_type)
    {
        var cardType = new CardType(card_type);
        this.card_types.push(cardType);
        this.defineAvailableStates();
    };

    this.getNumberInputs = function(){
        var wrapper = this.getWrapper();
        var numbers = wrapper.find(this.settings.card_input_wrapper + ' input');
        return numbers;
    };
    this.getActiveNumberInputs = function(){
        return $(this.settings.card_input_wrapper + ' input:visible');
    };
    this.getCount = function(){
        var count = 0;
        var numbers = this.getActiveNumberInputs();

        numbers.each(function(i, number){
            count += number.value.length;
        });

        return count;
    };
    this.bindListeners = function(){
        var self = this;
        var numbers = $(this.settings.card_input_wrapper + ' input');

        numbers.each(function(i, number){
            $(number).on('keyup', function(e){ self.operate(e); });
        });
    };
    this.getForm = function(){
        var form = $('form:first');

        if(window.time_to_debug){
            var serializedArray = form.serializeArray();
            console.table(serializedArray);
        }

        return form;
    };
    this.getFirstInput = function(){
        return $(this.settings.card_input_wrapper + ' ' + this.settings.first_input);
    };
    this.getActiveFirstInput = function(){
        var firstInput = this.getFirstInput(), activeFirstInput;

        activeFirstInput = firstInput.filter(function(){ if($(this).is(':visible')) { return $(this); }});
        if(activeFirstInput.length !== 1) throw Error('active first input not found! check selector for PaymentCard::getFirstInput');

        return activeFirstInput;
    };
    //FIXME: включення через кукі доробити
    this.debug = function(message)
    {
        if(window.time_to_debug){
            Hub.track(message);
        }
    };
    this.operate = function(e){
        var current_state = this.getCurrentState();
        var count = this.getCount();
        this.debug('count: ' + count + ' state: ' + current_state.name);
        try{
            var numbers = ''; this.getActiveNumberInputs().map(function(i, input){ return numbers += $(input).val(); });
            this.passLuhnAlgorythm(numbers);
        }catch(e){ this.debug(e.message); }


        if(count == 18 && current_state.name == 'momentum_activated'){
            this.transitToState('momentum_filled');
            this.debug('count: ' + count + ' state: ' + current_state.name + ' next: momentum_filled');
        }
        if(count < 18 && current_state.name == 'momentum_filled'){
            this.transitToState('momentum_activated');
            this.debug('count: ' + count + ' state: ' + current_state.name + ' next: momentum_activated');
        }
    };
    this.getCardTypeByFirstDigits = function(combination)
    {
        if(typeof combination !== 'number' && typeof combination !== 'string') {
            throw Error('Combination must consist from two digits!');
        }
        if(typeof combination === 'string' && combination.length >= 2 && parseInt(combination)){
            combination = parseInt(combination.substr(0,2));
        }
        var result = this.card_types.filter(function(item) { return item.numbers.indexOf(combination) >= 0; });

        if(result.length > 1) { throw Error('More than one card type was found by combination:  ' + combination); }

        return result.length ? result[0] : false;
    };
    this.defineState = function(cardType)
    {
        if(cardType instanceof CardType){
            var state = cardType.getId() + '_activated';

            if(this.states.hasOwnProperty(state)){
                return state;
            }
        }

        return 'default';
    };
    this.transit = function(combination){
        var cardType = this.getCardTypeByFirstDigits(combination);
        if(cardType instanceof CardType && ! cardType.isActive()){
            this.reset();
            return false;
        }
        var state = this.defineState(cardType);

        this.transitToState(state);
        this.setCurrentCardType(cardType);
    };
    this.bindFirstInputListener = function(){
        var self = this;
        var firstInput = $(this.settings.card_input_wrapper + ' ' + this.settings.first_input);

        firstInput.on('keyup', function(e){ self.transit(e.target.value); });
    };
    this.addValidationRule = function(rule){
        this.getFirstInput()
            .addClass(rule)
            .removeClass('valid_card_number_visa_master');

        this.setValidationRule(rule);
    };
    this.setValidationRule = function(rule)
    {
        this.settings.validation_rule = rule;
    };
    this.removeValidationRule = function(){
        if(!this.getFirstInput().hasClass(this.settings.validation_rule)) { return false; }
        this.getFirstInput()
            .removeClass(this.settings.validation_rule)
            .addClass('valid_card_number')
            .addClass('valid_card_number_visa_master');
    };
    this.prepareValidationRule = function(rule){
        var self = this;

        if(typeof $.validator.methods[rule] !== 'function'){
            $.validator.addMethod(rule, function(value, element){
                var first_n = $(element).parents('.card_num').find('input:first').val().substr(0, 2);

                var matches = self.getCardTypeByFirstDigits(first_n);
                if(!matches){
                    $(element).parent().addClass('error');
                }

                return matches;
            }, "Please enter a valid card number. Maestro MOMENTUM");
        }
    };
    this.passLuhnAlgorythm = function(numbers)
    {
        var sum = 0;
        var length = 0;
        numbers = numbers.replace(/\s/g, '');
        for (var i = 0; i < numbers.length; i++) {
            var intVal = parseInt(numbers.substr(i, 1));
            if (i % 2 == 0) {
                intVal *= 2;
                if (intVal > 9) {intVal = 1 + (intVal % 10);}
            }
            sum += intVal;
        }
        this.debug('sum: '+ sum+ ' length: '+ numbers.length+' valid: '+ (sum % 10 == 0));
        return (sum % 10 == 0);
    };
    this.getCardBlocks = function()
    {
        var blocks = $(this.settings.card_wrapper);
        if(!(blocks && blocks.length)) throw ('No card block found! Check ' + selector + ' at first');
        if(!this.hasOwnProperty('card_blocks')) this.card_blocks = blocks;

        return this.card_blocks;
    };
    this.getWrapper = function()
    {
        var block = $(this.settings.card_wrapper);
        if(!(block)) throw ('No card block found! Check ' + selector + ' at first');
        if(!this.hasOwnProperty('active_wrapper')) this.active_wrapper = block;

        return this.active_wrapper;
    };
    this.getContext = function()
    {
        var wrapper = this.getWrapper();
        var context = {
            'self':             this,
            'wrapper':          wrapper,
            'card_input_wrapper': wrapper.find(this.settings.card_input_wrapper),
            'card_number_0':    wrapper.find(this.settings.card_number_0),
            'card_number_1':    wrapper.find(this.settings.card_number_1),
            'card_number_2':    wrapper.find(this.settings.card_number_2),
            'card_number_3':    wrapper.find(this.settings.card_number_3),
            'card_number_4':    wrapper.find(this.settings.card_number_4),
            'card_date_month':  wrapper.find(this.settings.card_date_month),
            'card_date_year':   wrapper.find(this.settings.card_date_year),
            'card_holder':      wrapper.find(this.settings.card_holder),
            'card_cvv':         wrapper.find(this.settings.card_cvv)
        };
        return context;
    };
    this.getCurrentState = function()
    {
        if(!this.hasOwnProperty('current_state')){
            var states = this.getAllStates();
            this.current_state = states['default'];
        }

        return this.current_state;
    };
    this.getAllStates = function()
    {
        return this.states;
    };
    this.getCardTypes = function(active)
    {
        return this.card_types.filter(function(cardType){
            return active == undefined || cardType.isActive() == active;
        });
    };
    this.defineAvailableStates = function()
    {
        var card_types = this.getCardTypes();
        var states = {};

        card_types.forEach(function(card_type){
            if(card_type && card_type.hasOwnProperty('states')){
                card_type.states.forEach(function(state){
                    var obj = new state();
                    states[obj.name] = obj;
                });
            }
        });

        $.extend(this.states, states);
    };
    this.getState = function(state)
    {
        var states = this.getAllStates();
        if(!states[state]) throw('State ' + state + ' not found!');

        return states[state];
    };
    this.transitToState = function(state)
    {
        var previous_state = this.getCurrentState()['name'];
        var envelope = {
            event: 'card_state_changed',
            message: 'card state transits from: ' + previous_state + ' to: ' + state,
            data: { previous_state: previous_state, current_state: state }
        };
        Hub.publish(envelope.event, envelope);
        var state = this.getState(state);
        var context = this.getContext();
        state.handle(context);
        this.current_state = state;
    };
    this.bindLinkIfYouHaveCvv = function(){
        var self = this,
            wrapper = this.getWrapper();

        wrapper.find(this.settings['if_you_have_cvv']).on('click', function(e){
            e.preventDefault();
            self.transitToState('momentum_activated');
        });
    };
    this.initializeDefaultCardTypes = function()
    {
        this.addCardType({
            card_type: 'visa',
            numbers: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
            states: [DefaultState]
        });
        this.addCardType({
            card_type: 'mastercard',
            numbers: [51, 52, 53, 54, 55],
            states: [DefaultState]
        });
    };
    this.init = function(){
        this.transitToState('default');
        this.bindListeners();
        this.bindFirstInputListener();
        this.initializeDefaultCardTypes();
    };
    this.hasDefaultValue = function(key)
    {
        return this.default.hasOwnProperty(key) && this.default[key] !== null;
    };
    this.setDefaultValue = function(key, value)
    {
        if(this.default.hasOwnProperty(key) && this.default.key == null){
            this.default[key] = value;
        }else{
            Hub.warn('You are trying to change default value from: ' + this.default.key + ' to: ' + value);
        }
    };
    this.getDefaultValue = function(key)
    {
        return this.default[key];
    };
    this.getCurrentCardType = function()
    {
        return this.currentCardType;
    };
    this.reset = function()
    {
        $.each(this.getNumberInputs(), function(i, item){ $(item).val(''); });
        this.transitToState('default');
        this.setCurrentCardType(false);
    };
    this.setCurrentCardType = function(type)
    {
        var card_type = type instanceof CardType ? type.getId() : false;
        var message = 'card type changed ';
        message += this.currentCardType ? 'from ' + this.currentCardType.getId() : '';
        message += ' to ' + card_type;

        var envelope = {
            event: 'card_type_changed',
            message: message,
            data: { card_type: card_type }
        };

        Hub.publish(envelope.event, envelope);
        this.currentCardType = type;
    };
    this.getCardTypeById = function(id)
    {
        var result = this.card_types.filter(function(cardType){ return cardType.getId() === id; });
        if(result.length !== 1) return false;//TODO: throw Error('card type by id: ' + id + ' not found!');

        return result[0];
    };
};

function Motion(component)
{
    var self = this;
    this.component = component;
    this.context = component.getContext();
    this.current = null;

    this.setup();
};

Motion.prototype.setup = function()
{
    var self = this;

    this.getMembers(true).each(function(i, el){
        $(el).on('keyup', function(){ self.copy(el); self.move($(el)); });
        $(el).on('focus', function(){ self.setCurrent($(el)); });
    });
};

Motion.prototype.getMembers = function(all)
{
    var selector = 'input[tabindex]';

    if(!all) selector += ':visible';

    return this.context.wrapper
        .find(selector)
        .sort(function(a, b){
            return $(a).prop('tabindex') - $(b).prop('tabindex');
        });
};

Motion.prototype.getCurrent = function()
{
    if(!this.current || $(document.activeElement).prop('id') !== this.current.prop('id')) this.setCurrent(null);

    return this.current;
};

Motion.prototype.getNext = function()
{
    var focused = this.getCurrent()[0];
    var members = this.getMembers();

    for(var currentIndex = 0, focusedIndex = -1; currentIndex < members.length; currentIndex++)
    {
        if(focused === members[currentIndex]) { focusedIndex = currentIndex; continue; }

        var forward = $(members[currentIndex]);
        var canForwardBeFilled = forward.length && !this.isFilled(forward);
        var isFurtherThanFocused = focusedIndex >= 0 && currentIndex > focusedIndex;

        if(isFurtherThanFocused && canForwardBeFilled){
            return forward;
        }
    }

    return false;
};

Motion.prototype.isFilled = function(input)
{
    var length = input.val().length;
    var maxLength = input.prop('maxlength');

    return length === maxLength;
};

Motion.prototype.setCurrent = function(current)
{
    var message = current ? current.prop('id') + ' gets focus' : ' loses focus';  console.warn(message);


  this.current = current;
};

Motion.prototype.move = function(input)
{
    if($(document.activeElement).prop('id') !== input.prop('id')) input.focus();

    var next = this.getNext();

    if(this.isFilled(input) && next) next.focus();
};

Motion.prototype.copy = function(input)
{
  this.context.wrapper.find('#' + input.id).each(function(i, clone){
      if(input !== clone) clone.value = input.value;
  });
};

function CardType(obj)
{
    this.id = obj.card_type;
    this.numbers = obj.numbers;
    this.states = obj.states;
    this.active = true;

    this.disable = function()
    {
        this.active = false;

        var self = this;
        var envelope = {
            event: self.id + '_disabled',
            message: 'card type: ' + self.id + ' disabled',
            data: self
        };
        Hub.publish(envelope.event, envelope);
    };
    this.enable = function()
    {
        this.active = true;

        var self = this;
        var envelope = {
            event: self.id + '_enabled',
            message: 'card type: ' + self.id + ' enabled',
            data: self
        };
        Hub.publish(envelope.event, envelope);
    };
    this.isActive = function()
    {
        return this.active;
    };
    this.getId = function()
    {
        return this.id;
    };
};

function DefaultState()
{
    this.name = 'default';

    this.handle = function(context)
    {
        var card = context.self;
        card.removeValidationRule();
        context.card_number_4.prop('disabled', true).val('').hide();
        context.card_holder.prop('required', true);
        context.card_cvv.val('');
        context.wrapper.find(card.settings['card_holder_wrapper']).show();
        context.wrapper.find(card.settings['card_cvv_wrapper']).show();
        context.wrapper.find(card.settings['if_you_have_cvv']).hide();
        context.wrapper.find(card.settings['card_holder_not_required']).hide();

        this.restore_cvv_description(context);
        context.card_number_3.prop('maxlength', 4).attr('maxlength', 4);
        context.card_number_3.prop('data-length', 4).attr('data-length', 4);
        context.card_number_3.prop('placeholder', 'XXXX').attr('placeholder', 'XXXX');

        context.card_cvv
            .prop('maxlength', 3)
            .attr('maxlength', 3)
            .prop('placeholder', 'XXX');

        context.card_input_wrapper.removeClass('jcb union mir');

        context.card_number_0.prop('readonly', false);
        context.card_number_1.prop('readonly', false);
        context.card_number_2.prop('readonly', false);
        context.card_number_3.prop('readonly', false);
    };

    this.restore_cvv_description = function(context)
    {
        var card = context.self,
            cvv_wrapper = context.wrapper.find(card.settings['card_cvv_wrapper']),
            cvv_description_element  = cvv_wrapper.find('[data-cvv=description]'),
            cvv_title_element = cvv_wrapper.find('[data-cvv=title]'),
            cvv_description = cvv_description_element.first().text(),
            cvv_title = cvv_title_element.first().text();

        if(!card.hasDefaultValue('cvv'))
            card.setDefaultValue('cvv', { description: cvv_description, title: cvv_title });

        if(card.hasDefaultValue('cvv') && card.getDefaultValue('cvv').description !== cvv_description){
            var cvv = card.getDefaultValue('cvv');

            cvv_wrapper.each(function(i, wrapper){
                $(wrapper).find('[data-cvv=description]').text(cvv.description);
                $(wrapper).find('[data-cvv=title]').text(cvv.title);
            });
        }
    };
};

function MomentumActivatedState()
{
    this.name = 'momentum_activated';
    this.rule = 'valid_card_number_maestro_momentum';
    this.handle = function(context)
    {
        var card = context.self;
        context.wrapper.find(card.settings['card_holder_wrapper']).show();
        context.card_holder.prop('required', false);
        context.card_number_4.prop('disabled', false).show();
        context.wrapper.find(card.settings['card_holder_not_required']).removeAttr('hidden').show();
        context.wrapper.find(card.settings['card_cvv_wrapper']).show();
        context.card_cvv.val('');
        context.wrapper.find(card.settings['if_you_have_cvv']).hide();

        card.prepareValidationRule(this.rule);
        card.addValidationRule(this.rule);
    };
};
function MomentumFilledState()
{
    this.name = 'momentum_filled';
    this.handle = function(context)
    {
        var card = context.self;
        context.card_holder.val('');
        context.card_cvv.val('123');
        context.wrapper.find(card.settings['card_holder_wrapper']).hide();
        context.wrapper.find(card.settings['card_cvv_wrapper']).hide();
        context.wrapper
            .find(card.settings['if_you_have_cvv'])
            .off('click').on('click', function(e){
            e.preventDefault();
            card.transitToState('momentum_activated');
            context.card_cvv.focus();
        })
            .show();
    };
};

function AmexActivatedState()
{
    this.name = 'amex_activated';
    this.rule = 'valid_card_number_amex';
    this.handle = function(context)
    {
        var lastCardInputSize = 3,
            cvvInputSize      = 4;

        context.card_number_3
            .prop('maxlength', lastCardInputSize)
            .data('length', lastCardInputSize).attr('data-length', lastCardInputSize).prop('data-length', lastCardInputSize);

        context.card_number_3.prop('placeholder', 'XXX');

        context.card_cvv
            .prop('maxlength', cvvInputSize)
            .prop('placeholder', 'XXXX');

        this.set_cvv_description(context);

        context.self.prepareValidationRule(this.rule);
        context.self.addValidationRule(this.rule);
    };
    this.set_cvv_description = function(context)
    {
        var card = context.self,
            element = context.wrapper.find(card.settings['card_cvv_wrapper']).find('span:first'),
            cvv_description = Hub.archive && Hub.archive.getData().translations && Hub.archive.getData().translations.cvv_description;

        if(typeof cvv_description === 'string' && cvv_description.length){
            element.each(function(i, item){
                $(item).text(cvv_description);
            });
        }else{
            console.warn('cvv_description for Amex is not defined! Look first into storage.translations, then into client_storage.php for more details');
            console.info(storage);
        }
    };
};

function JcbActivatedState()
{
    this.name = 'jcb_activated';
    this.cvv_title = 'CAV2';
    this.cvv_description = null;

    this.handle = function(context)
    {
        context.card_input_wrapper.addClass('jcb');
        this.set_cvv_description(context);
    };

    this.set_cvv_description = function(context)
    {
        var self = this,
            card_wrapper = context.wrapper.find(context.self.settings['card_cvv_wrapper']);

        if(self.cvv_description === null){
            var defaultDescription = context.self.getDefaultValue('cvv').description;
            var divideLineIndex = defaultDescription.indexOf('-');
            var replacementText = defaultDescription.substr(0, divideLineIndex - 1);
            self.cvv_description = defaultDescription.replace(replacementText, self.cvv_title);
        }

        card_wrapper.each(function(i, wrapper){
            $(wrapper).find('[data-cvv=description]').text(self.cvv_description);
            $(wrapper).find('[data-cvv=title]').text(self.cvv_title);
        });
    };
};