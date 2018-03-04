var Level = cc.TMXTiledMap.extend({
    collisionLayer:null,

    ctor:function (t) 
    {
        this._super(t);

        this.collisionLayer = this.getLayer("collision");
    }
});