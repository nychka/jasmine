/**
 * Manifesto to any additional service, who wants to cooperate with payment block
 *
 * @author Nychka Yaroslav
 * @email y.nychka@tickets.com.ua
 * @date 21 September 2017
 * @version 1.0.5
 *
 * 1. MUST implement all functionality defined in this interface
 *
 * 2. MUST notify about any cost changes using notify()
 *
 * 3. MUST put initialization logic into init() - it will be called as needed
 *
 * 4. MUST work through ServiceManager only
 *
 */
function ServiceInterface() {/*_*/};

ServiceInterface.prototype.cost = 0;
ServiceInterface.prototype.onPage = true;

ServiceInterface.prototype.enabledPriceInCabinet = false;

ServiceInterface.prototype.getId = function()
{
  return this.id;
};

ServiceInterface.prototype.isEnabledPriceInCabinet = function()
{
  return this.enabledPriceInCabinet;
};

ServiceInterface.prototype.getCost = function()
{
  if(isNaN(this.cost) || this.cost === undefined){
    if(console && console.warn) console.warn('service manager got wrong cost ' + this.cost + ' from service ' + this.getId());
    this.cost = 0;
  }

  return this.cost;
};

ServiceInterface.prototype.setCost = function(cost)
{
  this.cost = cost;
  this.notify();
};

ServiceInterface.prototype.allowNotify = function(allow)
{
  this.allowNotifications = allow;
};

ServiceInterface.prototype.canNotify = function()
{
  return this.allowNotifications;
};

ServiceInterface.prototype.notify = function()
{
  if(! this.canNotify()) return false;

  this.allowNotify(false);
  this.getManager().update(this);
};

ServiceInterface.prototype.getManager = function()
{
  return this.manager;
};

ServiceInterface.prototype.setManager = function(manager)
{
  this.manager = manager;
};

ServiceInterface.prototype.init = function()
{
  throw new ServiceInterfaceMethodNotImplementedException(this, 'init');
};

ServiceInterface.prototype.changeCurrency = function(currency)
{
  throw new ServiceInterfaceMethodNotImplementedException(this, 'changeCurrency');
};

ServiceInterface.prototype.toggleService = function(bool)
{
  throw new ServiceInterfaceMethodNotImplementedException(this, 'toggleService');
};
ServiceInterface.prototype.isIgnored = function()
{
  return Hub.dispatcher.getController('separate') && Hub.dispatcher.getController('separate').getIgnoredAdditionalServices().indexOf(this.getId()) >= 0;
};
ServiceInterface.prototype.isOnPage = function()
{
  return this.onPage;
};
ServiceInterface.prototype.setOnPage = function(bool)
{
  if(bool === this.onPage) return;
  var change = 'from '+this.onPage+' to ' + bool;
  this.onPage = bool;
  Hub.publish('service_on_page_status_changed', {
    data: { service: this },
    message: 'service ' + this.getId() + ' change onPage status ' + change
  });
};

function ServiceInterfaceMethodNotImplementedException(service, method)
{
  this.service = (typeof service.getId === 'function') ? service.getId() : 'nameless';
  this.message = 'service MUST implement method: ' + method + ' according to manifesto';
};

function ServiceInterfaceCostIsNotNumberException(service)
{
  this.service = (typeof service.getId === 'function') ? service.getId() : 'nameless';
  this.message = 'service\'s cost is not a number';
};


function ServiceInterfaceNotImplementedException(service)
{
  this.service = (typeof service.getId === 'function') ? service.getId() : 'nameless';
  this.message = 'service MUST implement ServiceInterface according to manifesto';
};

function ServiceInterfaceDeactivatedException(service, message)
{
  this.service = (typeof service.getId === 'function') ? service.getId() : 'nameless';
  this.message = message;
};

function ServiceManager()
{
  this.services = {};
  this.length = 0;

  this.deactivate = function(service)
  {
    if(service.mainWrapp && service.mainWrapp.length && typeof service.mainWrapp.hide == 'function'){
      service.mainWrapp.hide();
      throw new ServiceInterfaceDeactivatedException(service, 'service was successfully deactivated');
    }else{
      throw new ServiceInterfaceDeactivatedException(service, 'service was not deactivated!');
    }
  };

  this.add = function(service)
  {
    if(! this.canAdd(service)) return false;

    var id = service.getId();
    this.services[id] = service;
    service.setManager(this);

    Hub.publish('service_added', {
      data: { service: service },
      message: 'service ' + id + ' was added to manager'
    });

    return this.count();
  };

  this.check = function(service)
  {
    if (!(service instanceof ServiceInterface)) throw new ServiceInterfaceNotImplementedException(service);
    if (isNaN(service.cost) || service.cost == undefined) throw new ServiceInterfaceCostIsNotNumberException(service);
  };

  this.canAdd  = function(service)
  {
    try {
      this.check(service);
    }catch(e){
      console.error(e);
      // try{ this.deactivate(service);}catch(e){ console.error(e); };

      return false;
    }

    return true;
  };

  this.update = function(service)
  {
    var cost = service.getCost();

    Hub.publish('service_price_changed', {
      data:  { service: service, cost: cost },
      message: 'service '+ service.getId() + ' changed price to ' + cost
    });
  };

  this.reload = function()
  {
    this.getServices(function(service){
      service.reloadCost();
    });
  };

  this.isCabinet = function()
  {
    return window.cur_domain == 'my';
  };

  this.getServices = function(fn, options)
  {
    if(! (fn && typeof fn === 'function')) return this.services;

    for(var i in this.services){
      var service = this.services[i];

      if(options && this.isCabinet() && ! service.isEnabledPriceInCabinet()) continue;

      if(options && options.onlyVisibleOnPage){
        if(service.isIgnored()) continue;
      }

      if(options && options.onlyIncludedInTotalPrice){
        if(! this.canServiceBeIncludedInTotalPrice(service.getId())) continue;
      }

      fn.call(this, service);
    }
  };

  this.canServiceBeIncludedInTotalPrice = function(id)
  {
    var list = this.getListIncludedInTotalPrice();

    return list.indexOf(id) >= 0;
  };

  this.run = function()
  {
    this.getServices(function(service){
      service.init();
    });

    Hub.publish('service_manager_ran', {data:  {}, message: 'manager initialized '+ this.count() +' services'});

    Hub.subscribe('currency_changed', function(envelope){
      Hub.dispatcher.getManager('service').getServices(function(service){
        service.changeCurrency(envelope.data.currency);
      });
    });
  };

  this.getCost = function(onlyIncludedInTotalPrice)
  {
    var cost = 0;

    this.getServices(function(service){
      cost += service.getCost();
    }, {
      onlyIncludedInTotalPrice: onlyIncludedInTotalPrice,
      onlyVisibleOnPage: true
    });

    return cost;
  };

  /**
   * список додаткових сервісів, які входять в обрахунок загальної ціни квитка
   */
  this.getListIncludedInTotalPrice = function()
  {
    var el = $('#additional_services_in_main_price');

    return el.length && el.val().length ? JSON.parse(el.val()) : [];
  };

  this.findById = function(id)
  {
    return this.services.hasOwnProperty(id) ? this.services[id] : false;
  };

  this.count = function()
  {
    this.length = Object.keys(this.services).length;

    return this.length;
  };
};

(function($){
  if(! Hub){ throw new Error('Hub must be loaded first!'); }

  Hub.dispatcher.addManager('service', new ServiceManager());

})(jQuery);

