var DashGameLayer = cc.Layer.extend({
    character:null,
    level:null,
    collisionHandler:null,

    ctor:function () {
       
        this._super();
        var size = cc.winSize;

        //map
        this.level = new Level(res.tilemap_tmx);
        this.addChild(this.level);

        // character
        this.character = new Character(res.character_png, this.level);
        this.character.attr({
            x: size.width / 2,
            y: size.height / 2
        });
        this.addChild(this.character,0);

        return true;
    }
});

var DashScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new DashGameLayer();
        this.addChild(layer);
    }
});