var MovementState = {
    IDLE: 1,
    RUN: 2,
    JUMP: 3,
    FALL: 4,
    WALLSLIDE: 5,
    };


var Character = cc.Sprite.extend({

    sprite:null,
    level:null,

    //debug
    testColor:null,

    //collision
    left_botTile:null, 
    left_midTile:null, 
    left_topTile:null, 

    right_botTile:null, 
    right_midTile:null,  
    right_topTile:null,  

    //jump & fall
    jumpInitialSpeed:10,
    jumpDecay:0.5,
    jumpDecayStrength:0,
    jumpChargesMax:2,
    jumpCharges:0,
    jumpHoldModifier:0.5,
    jumpHold:false,
    runSpeed:3,

    movementState:MovementState.RUN,


    ctor:function (sprite, level) 
    {
        this._super(sprite);

        //debug
        this.testColor = new cc.Color(200,200,200);

        //set anchor point
        //this.setAnchorPoint(0.5,0);
        
        //set level (used for collision)
        this.level = level;

        //schedule
        this.scheduleUpdate();

        //set touch listeners
        var listener = cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
        
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var target = event.getCurrentTarget();               
                target.onTouchBegan(touch, event);
                return true;
            },
            onTouchMoved: function (touch, event) {
                var target = event.getCurrentTarget();               
                target.onTouchMoved(touch, event);
                return true;
            },
            onTouchEnded: function (touch, event) { 
                var target = event.getCurrentTarget();               
                target.onTouchEnded(touch, event);
                return true;
            }
        });
        cc.eventManager.addListener(listener, this);

        //initial collision
        //this.updateCollision();
    },

    //------------------------------------------------ UPDATE -------------------------------------------------------
    update:function(dt)
    {
        switch(this.movementState) 
        {
            case MovementState.STOP:
                break;
            case MovementState.RUN:
                this.updateRun();
                break;
            case MovementState.JUMP:
                this.updateJump();
                break;
            case MovementState.FALL:
                this.updateFall();
                break;
            case MovementState.WALLSLIDE:
                break;
            default:
        }
    
    },

    //------------------------------------------------ TOUCH INPUT -------------------------------------------------------
    onTouchBegan:function(touch, event)
    {
        //console.log("on touch began");
        if (this.jumpCharges < this.jumpChargesMax)
        {
            this.exitRun();
            this.enterJump();
        }
    },

    onTouchMoved:function(touch, event)
    {
        //console.log("on touch moved");
    },

    onTouchEnded:function(touch, event)
    {
        //console.log("on touch ended");
        this.jumpHold = false;
    },

    //------------------------------------------------ IDLE -------------------------------------------------------
    enterIdle:function()
    {
        this.movementState = MovementState.IDLE;
    },

    updateIdle:function()
    {

    },

    exitIdle:function()
    {

    },

    //------------------------------------------------ RUN -------------------------------------------------------
    enterRun:function()
    {
        this.movementState = MovementState.RUN;
    },

    updateRun:function()
    {
        this.updateHorizontalMovement();

        //collision
        this.updateCollision();

        var groundCollision = this.groundCollision();
        var wallCollision = this.wallCollision();

        // not colliding
        // -> Fall
        if (!groundCollision && !wallCollision)
        {
            this.exitRun();
            this.enterFall();
        }
        //colliding with wall
        // -> Slide

        //colliding with wall and ground
        // -> Idle
        else if (groundCollision && wallCollision)
        {
            //adjust position

            this.exitRun();
            this.enterIdle();
        }

        //colliding with ground
        // -> that's fine, keep running


    },

    exitRun:function()
    {

    },

    //------------------------------------------------ JUMP -------------------------------------------------------
    enterJump:function()
    {
        this.movementState = MovementState.JUMP;
        this.jumpHold = true;
        this.jumpDecayStrength = 0;
        this.jumpCharges++;
    },

    updateJump:function()
    {
        this.updateHorizontalMovement();

        this.y += (this.jumpInitialSpeed - this.jumpDecay*this.jumpDecayStrength);

        //stronger jump when holding and not falling
        if (!this.jumpHold)
            this.jumpDecayStrength++;
        else
            this.jumpDecayStrength += this.jumpHoldModifier;

        //Enter fall state
        if ((this.jumpInitialSpeed - this.jumpDecay*this.jumpDecayStrength) < 0)
        {
            this.exitJump();
            this.enterFall();
        }
            

        //right place to do the check? I don't think so.
        
    },

    exitJump:function()
    {

    },

    //------------------------------------------------ FALL -------------------------------------------------------
    enterFall:function()
    {
        this.movementState = MovementState.FALL;
        this.jumpDecayStrength = 0;
    },

    updateFall:function()
    {
        this.updateHorizontalMovement();

        this.y -= this.jumpDecay*this.jumpDecayStrength;

        //stronger jump when holding and not falling
        if (!this.jumpHold)
            this.jumpDecayStrength++;
        else
            this.jumpDecayStrength += this.jumpHoldModifier;

        //collision
        this.updateCollision();

        var groundTile = this.groundCollision();
        if (groundTile)
        {
            this.y = groundTile.y + groundTile.height;
            this.exitFall();
            this.enterRun();
        }
    },

    exitFall:function()
    {
        this.jumpDecayStrength = 0;
        this.jumpCharges = 0;
        this.jumpHold = false;
    },

    //------------------------------------------------ HORIZONTAL MOVEMENT -------------------------------------------------------
    updateHorizontalMovement:function()
    {
        this.x += this.runSpeed;
    },

    //------------------------------------------------ COLLISION -------------------------------------------------------
    updateCollision:function()
    {
        // get 6 points for the sprite (only works for character sprite - do it more dynamically!)
        var left_top = new cc.Point(this.x - this.width/2, this.y + this.height/2);
        var left_mid = new cc.Point(this.x - this.width/2, this.y);
        var left_bot = new cc.Point(this.x - this.width/2, this.y - this.height/2);
        var right_top = new cc.Point(this.x + this.width/2, this.y + this.height/2);
        var right_mid = new cc.Point(this.x + this.width/2, this.y);
        var right_bot = new cc.Point(this.x + this.width/2, this.y - this.height/2);

        //position to tile coordinates
        // y coordinates are switched
        left_top.x = Math.floor(left_top.x / this.level.tileWidth);
        left_top.y = this.level.collisionLayer.layerHeight - Math.ceil(left_top.y / this.level.tileHeight);

        left_bot.x = Math.floor(left_bot.x / this.level.tileWidth);
        left_bot.y = this.level.collisionLayer.layerHeight - Math.ceil(left_bot.y / this.level.tileHeight);

        left_mid.x = Math.floor(left_mid.x / this.level.tileWidth);
        left_mid.y = (left_top.y +  left_bot.y)/2;

        right_top.x = Math.floor(right_top.x / this.level.tileWidth);
        right_top.y = this.level.collisionLayer.layerHeight - Math.ceil(right_top.y / this.level.tileHeight);

        right_bot.x = Math.floor(right_bot.x / this.level.tileWidth);
        right_bot.y = this.level.collisionLayer.layerHeight - Math.ceil(right_bot.y / this.level.tileHeight);

        right_mid.x = Math.floor(right_mid.x / this.level.tileWidth);
        right_mid.y = (right_top.y +  right_bot.y)/2;

        //get the tile for each tile position
        this.left_botTile = this.level.collisionLayer.getTileAt(left_bot.x,left_bot.y);
        this.left_midTile = this.level.collisionLayer.getTileAt(left_mid.x,left_mid.y);
        this.left_topTile = this.level.collisionLayer.getTileAt(left_top.x,left_top.y);

        this.right_botTile = this.level.collisionLayer.getTileAt(right_bot.x,right_bot.y);
        this.right_midTile = this.level.collisionLayer.getTileAt(right_mid.x,right_mid.y);
        this.right_topTile = this.level.collisionLayer.getTileAt(right_top.x,right_top.y);

        
        //console.log(this.collisionLayer.getProperty("isCollider"));
    },

    groundCollision:function()
    {
        // return null when both are null
        if (!this.left_botTile && !this.right_botTile)
            return null;

        // return right when left is null
        if (!this.left_botTile)
            return this.right_botTile;

        //return left when right is null
        if (!this.right_botTile)
            return this.left_botTile;

        // both not null, return tile closer to character's center
        if (Math.abs(this.left_botTile.x - this.x) < Math.abs(this.right_botTile.x - this.x))
            return this.left_botTile;
        else
            return this.right_botTile;

        //should not occur
        console.log("groundCollision failed");
        return null;
    },

    wallCollision:function()
    {
        // return wall colliding tile with the highest y value
        // this way we can do the auto climb?


        //collidiing left
        if (this.left_topTile)
            return this.left_topTile;
        else if (this.left_midTile) 
            return this.left_midTile;
        else if (this.left_botTile)
        {
            //exclude ground collision
            if (this.y > this.left_botTile.y + this.left_botTile.height)
                return this.left_botTile;
        }

        //colliding right
        if (this.right_topTile)
            return this.right_topTile;
        else if (this.right_midTile) 
            return this.right_midTile;
        else if (this.right_botTile)
        {
            //exclude ground collision
            if (this.y > this.right_botTile.y + this.right_botTile.height)
                return this.right_botTile;
        }

        // not colliding
        return null;
    }
});