// PaymentSystem.prototype = Object.create(PriceComponent.prototype);
// PaymentSystem.prototype.constructor = PaymentSystem;

CardsPicker.prototype = Object.create(Component.prototype);
CardsPicker.prototype.constructor = CardsPicker;

CardsPicker.prototype.states = {
    'disabled': function(){
        this.handle = function(component){
            var paymentCard = Hub.dispatcher.getController('payment').getPaymentCard();

            paymentCard.reset();
            component.disable();
        }
    },

    'default': function() {
        this.handle = function(component)
        {
            var paymentCard, number, card;

            paymentCard = Hub.dispatcher.getController('payment').getPaymentCard();
            component.setup({ filter: 'default' });
            number = component.getFirstOption().data('number');
            card = component.findCardById(number);
            paymentCard.states['cards_picker_default'] = new CardsPickerDefault(paymentCard);
            paymentCard.states['cards_picker_default'].setOption('card', card, UserCard);
            paymentCard.transitToState('default');
            paymentCard.transitToState('cards_picker_default');
        };
    },
    'otp': function(){
        this.handle = function(component)
        {
            var paymentCard, number, card;

            paymentCard = Hub.dispatcher.getController('payment').getPaymentCard();
            paymentCard.states['cards_picker_otp'] = new CardsPickerOtp(paymentCard);
            component.setup({ filter: 'otp' });
            number = component.getFirstOption().data('number');
            card = component.findCardById(number);
            paymentCard.states['cards_picker_otp'].setOption('card', card, UserCard);
            paymentCard.transitToState('default');
            paymentCard.transitToState('cards_picker_otp');
        }
    }
};

CardsPicker.prototype.filters = {
    'number': function(cards, number){
        return cards.filter(function(card){
            return card.number === number;
        });
    },
    'group': function(cards, group){
        return cards.filter(function(card){
            return card.group === group;
        });
    },
};

State.prototype.errors = {
    'state_not_found': function(data){
        function NoStateFoundError(state){
            this.name = 'NoStateFoundError';
            this.message = 'No state found by id: ' + state;
        };
        NoStateFoundError.prototype = Object.create(Error.prototype);
        NoStateFoundError.prototype.constructor = NoStateFoundError;

        return new NoStateFoundError(data);
    },
    'method_not_overloaded': function(method)
    {
        function MethodNotOverloadedError(method){
            this.name = 'MethodNotOverloadedError';
            this.message = 'Method ' + method + ' must be overloaded!';
        };
        MethodNotOverloadedError.prototype = Object.create(Error.prototype);
        MethodNotOverloadedError.prototype.constructor = MethodNotOverloadedError;

        return new MethodNotOverloadedError(method);
    }
};

Component.prototype.extensions = {
    'history': History,
    'state'  : State
};

History.prototype.tags = {
    'initialized': function(data){
        var record = { message: 'Component has been initialized ' };

        if(data && Object.keys(data).length){
            record.message += 'with settings';
        }else{
            record.message += 'without settings';
        }

        return record;
    },

    'property_changed': function(data){
        var record = { message: 'Component has changed property '};

        record.message += '[' + data.prop + '] ';
        record.message += 'from ' + data.previous + ' to ' + data.current;

        return record;
    },

    'prepared': function(data)
    {
        var record = { message: 'Component has been prepared', data: data };

        return record;
    },

    'state_changed': function(data)
    {
        var record = { message: 'Component transits ' };
        record.message += (data.previous && data.previous !== data.current) ? 'from ' + data.previous + ' ' : '';
        record.message += 'to state ' + data.current;

        return record;
    }
};

PriceAggregator.prototype.filters = {
    'total': function(aggregator){
        var price = 0;

        aggregator.getComponents(function(component){
            price += component.getPrice();
        });

        return price;
    },
    'sum': function(aggregator, component_ids){
        var sum = 0;

        for(var i in component_ids){
            var component = aggregator.findComponentById(component_ids[i]);

            if(component){
                sum += component.getPrice();
            }
        }

        return sum;
    }
};