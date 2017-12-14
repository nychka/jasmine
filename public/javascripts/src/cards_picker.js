/**
 * User's cards picker component
 *
 * @author Nychka Yaroslav
 * @email y.nychka@tickets.com.ua
 * @date 04.12.2017
 * @version 1.0.0
 *
 */
function CardsPicker(options)
{
    Component.call(this, options);

    var default_options = {
        wrapper: $('.usb_cards_block'),
        pickerSelector: 'select',
        cards: [/*1234567890*/]
    };

    var userCards = [];

    this.prepareStates = function()
    {
        var proto = CardsPicker.prototype;

        if(proto.states && Object.keys(proto.states).length){
            for(var state in proto.states){
                var condition = this.settings.cards.filter(function(card){
                    return card.group === state;
                });
                var canRegister = condition.length  || ["default", "otp"].indexOf(state) === -1;

                if(canRegister){
                    this.state.register(state, proto.states[state]);
                }else{
                    this.log('state_registered', { message: 'State ' + state + ' is not registered' });
                }
            }
        }
    };

    this.prepareCards = function()
    {
        this.settings.cards.map(function(card){
            userCards.push(new UserCard(card));
        });

        return userCards;
    };

    var init = function()
    {
        this.settings = $.extend({}, default_options, options);
        this.length = 0;
        this.prepareStates();
        this.prepareCards();
    };

    this.clear = function()
    {
        this.getPickerContainer().html('');
        this.enable();
        this.refresh();
    };

    this.refresh = function()
    {
        var select = this.getPickerContainer();
        //select.prop('selectedIndex', 0);
        window.front_version === 'mobile' ? select.selectmenu("refresh", true) : select.trigger("chosen:updated");
        this.count();
    };

    this.findCardById = function(id)
    {
        var number = id.toString();
        var cards = this.getCards('number', number);

        return (cards && cards.length === 1) ? cards[0] : false;
    };

    this.setActiveCard = function(number)
    {
        var card  = (typeof number !== 'object') ? this.findCardById(number) : number;
        this.activeCard = card;
        Hub.publish('cards_picker_changed', { data: { card: card },  message: 'card number has been chosen: ' + card.number });
    };

    this.getActiveCard = function()
    {
        return this.activeCard;
    };

    this.prependOption = function(){
        var option = $('<option></option>', { text: '____ _RESET_ ____', 'data-action': 'reset' });
        this.getPickerContainer().append(option);
    };

    this.beforeSetup = function()
    {
        this.clear();
    };

    this.afterSetup = function()
    {
        this.prependOption();
        this.refresh();

        var envelope = {
            data: { cards: this.getCards() },
            message: 'CardsPicker has been prepared with ' + this.length + ' card number'
        };

        Hub.publish('cards_picker_prepared', envelope);
        this.log('prepared', { cards: this.getCards() });
    };

    this.setup = function(settings)
    {
        var filter = settings && settings.filter ? settings.filter : 'default';
        var self = this;

        this.beforeSetup();

        this.getCards('group', filter).map(function(card){
            var option = self.buildCardOption(card);
            self.getPickerContainer().append(option);
        });

        this.afterSetup();
    };

    this.toggle = function(status)
    {
        (status) ? this.enable() : this.disable();
    };

    this.enable = function()
    {
        this.getWrapper().show();

        Hub.publish('cards_picker_enabled', {
            data: {
                cards: this.getCards(),
                card: this.getFirstOption().val()
            },
            message: 'CardsPicker has been enabled'
        });
    };

    this.disable = function()
    {
        this.getWrapper().hide();

        Hub.publish('cards_picker_disabled', { data: {}, message: 'CardsPicker has been disabled' });
    };

    this.count = function()
    {
        this.length = this.getOptions().length;

        return this.length;
    };

    this.getWrapper = function()
    {
        return this.settings.wrapper;
    };

    this.getPickerContainer = function()
    {
        return this.getWrapper().find(this.settings.pickerSelector);
    };

    this.getCards = function(filter, data)
    {
        var proto = CardsPicker.prototype;
        var cards = userCards;
        var hasFilter = filter && proto.filters && Object.keys(proto.filters).length && proto.filters.hasOwnProperty(filter);

        return hasFilter ? proto.filters[filter].call(this, cards, data) : cards;
    };

    this.getOptions = function()
    {
        return this.getPickerContainer().find('option[data-group]');
    };

    this.getFirstOption = function(){
        var options = this.getOptions();

        return $(options[0]);
    };

    this.buildCardOption = function(card)
    {
        if(! this.isValidCardNumber(card.number)) throw new OtpCardsPickerCardNumberIsNotValidError(card);

        var text = card.get('sixteen'); // 1234 56XX XXXX 7890
        var value = card.get('eight'); // 12347890

        return $('<option></option>', { value: value, text: text, 'data-number': card.number, 'data-group': card.group });
    };

    /**
     *
     * @param cardNumber 4363231112
     * @returns {boolean}
     */
    this.isValidCardNumber = function(cardNumber)
    {
        return cardNumber.length === 10;
    };

    init.call(this);
};

function UserCard(settings)
{
    this.number = settings.number;
    this.group = settings.group;
};


UserCard.prototype.filters = {
    'ten': function(card){
        return card.number;
    },

    'first_token': function(card){
        return card.number.substr(0, 4);
    },

    'second_token': function(card){
        return card.number.substr(4, 2) + "XX";
    },

    'third_token': function(card){
        return "XXXX";
    },

    'last_token': function(card){
        return card.number.substr(6, 4);
    },

    'sixteen': function(card){
        return card.get('first_token') + " " + card.get('second_token') + " " + card.get('third_token') + " " + card.get('last_token');
    },

    'eight': function(card){
        return card.get('first_token') + card.get('last_token');
    }
};

UserCard.prototype.getGroup = function()
{
    return this.group;
};

UserCard.prototype.get = function(filter)
{
    if(UserCard.prototype.filters.hasOwnProperty(filter)){
        return UserCard.prototype.filters[filter].call(this, this);
    }else{
        return this.number;
    }
};

function OtpCardsPickerCardNumberIsNotValidError(cardNumber)
{
    this.number = cardNumber;
    this.message = 'Card number '+ cardNumber + ' is not valid!';
};

function OtpCardsPickerAddSameCardError(cardNumber)
{
    this.number = cardNumber;
    this.message = 'Card ' + cardNumber + 'has already added!';
};