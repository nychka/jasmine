function PaymentManager(settings)
{
    PriceAggregator.call(this, settings);
};

PaymentManager.prototype = Object.create(PriceAggregator.prototype);
PaymentManager.prototype.constructor = PaymentManager;