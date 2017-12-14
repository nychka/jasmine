function BonusManager(settings)
{
    PriceAggregator.call(this, settings);
};

BonusManager.prototype = Object.create(PriceAggregator.prototype);
BonusManager.prototype.constructor = BonusManager;