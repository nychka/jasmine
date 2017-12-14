function Component(settings)
{
    this.id = 0;
    this.extensions = {};

    var init = function(settings)
    {
        this.prepareExtensions();

        for(var option in settings){
            if(this.hasOwnProperty(option) && typeof this[option] !== 'function'){
                this[option] = settings[option];
            }
        }

        this.log('initialized', settings);
    };

    this.prepareExtensions = function()
    {
        if(! (Component.prototype.hasOwnProperty('extensions') && Object.keys(Component.prototype.extensions).length)) return false;

        for(var extension in Component.prototype.extensions) this.extend(extension, Component.prototype.extensions[extension]);
    };

    this.getId = function(){
        return this.id;
    };

    this.setId = function(id)
    {
        this.log('property_changed', { prop: 'id', previous: this.id, current: id });
        this.id = id;
    };

    this.log = function(event, record){
        if(this.history) this.history.save(event, record);
    };

    this.extend = function(id, fn)
    {
        if(this.extensions.hasOwnProperty(id)) return false;
        if(typeof fn !== 'function') throw new Error('Extension must be Function!');

        var extension = new fn(this);
        this.extensions[id] = extension;

        this[id] = extension;
    };

    init.call(this, settings);
};

function State(component)
{
    var states = {};
    var current = 'default';
    var previous;

    var init = function(){
      // this.register('default', function(){
      //     this.handle = function(){
      //         console.warn('overload me please');
      //     }
      // });
    };

    this.getCurrent = function()
    {
      return states[current];
    };

    this.transitTo = function(state)
    {
        if(this.canTransitTo(state)){
            this.get(state).handle.call(this, component);
            previous = current;
            current = state;
            component.log('state_changed', { current: current, previous: previous });
        }else{
            component.log('state_not_changed', { current: state });
        }
    };

    this.canTransitTo = function(state)
    {
        return states.hasOwnProperty(state);
    };

    this.get = function(state)
    {
        if(! states.hasOwnProperty(state)) throw State.prototype.errors.state_not_found(state);

        return states[state];
    };

    this.register = function(id, fn)
    {
        fn.prototype.handle = function(){ throw State.prototype.errors.method_not_overloaded('handle'); };
        fn.prototype.getId = function(){ return this.id; };
        fn.prototype.setId = function(id){ this.id = id; };

        var state = new fn();
        state.setId(id);
        states[id] = state;

        component.log('state_registered', { state: id });
    };
    init.call(this);
};

function History()
{
    var history = {};

    this.find = function(tag)
    {
      return (tag && history.hasOwnProperty(tag)) ? history[tag] : history;
    };

    this.save = function(tag, data)
    {
        var record = History.prototype.tags.hasOwnProperty(tag) ? History.prototype.tags[tag].call(this, data) : { message: tag };

        this.add(tag, record);
    };

    this.add = function(tag, record)
    {
        if(! history.hasOwnProperty(tag)) history[tag] = [];
        history[tag].push(record);
    };
};

function PriceComponent(settings)
{
    this.price = 0;

    Component.call(this, settings);

    this.getPrice = function()
    {
        return this.price;
    };

    this.setPrice = function(price)
    {
        this.log('property_changed', { prop: 'price', previous: this.price, current: price });
        this.price = price;
    };
};

function PriceAggregator(settings)
{
    var components = {};
    var filters = {};

    PriceComponent.call(this, settings);

    var init = function()
    {
        var proto = PriceAggregator.prototype;

        for(var filter in proto.filters) this.registerFilter(filter, proto.filters[filter]);
    };

    /**
     * @override
     * @param filterId
     * @returns {number}
     */
    this.getPrice = function(filterId, params)
    {
        var filter = filterId ? this.getFilterById(filterId) : this.getDefaultFilter();
        if(typeof filter !== 'function') console.warn('filter not prepared');

        return filter.call(this, this, params);
    };
    /**
     * @override
     */
    this.setPrice = function(){ console.warn('This operation is useless. What have you been expected?')};

    this.getComponents = function(fn)
    {
        if(typeof fn === 'function'){ for(var i in components){ fn.call(this, components[i]); } }

        return components;
    };

    this.registerComponent = function(component)
    {
        if(! (component instanceof PriceComponent)) throw new Error('Must be instance of PriceComponent!');

        var id = component.getId();

        components[id] = component;
    };

    this.registerFilter = function(id, fn)
    {
        filters[id] = fn;
    };

    this.findComponentById = function(id)
    {
        return components[id];
    };

    this.getFilterById = function(id)
    {
        return filters[id];
    };

    this.getDefaultFilter = function()
    {
        return this.getFilterById('total');
    };

    init.call(this);
};

PriceComponent.prototype = Object.create(Component.prototype);
PriceComponent.prototype.constructor = PriceComponent;

PriceAggregator.prototype = Object.create(PriceComponent.prototype);
PriceAggregator.prototype.constructor = PriceAggregator;