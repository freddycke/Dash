var MovementState = {
    IDLE: 1,
    RUN: 2,
    JUMP: 3,
    FALL: 4,
    WALLSLIDE: 5
    };

var CollisionState = {
    NONE: 0,
    LEFT_TOP: 1,
    LEFT_MID: 2,
    LEFT_BOT: 4,
    RIGHT_TOP: 8,
    RIGHT_MID: 16,
    RIGHT_BOT: 32,
    LEFT_3: 7,
    RIGHT_3: 56,
    LEFT_L: 39,
    RIGHT_L: 60,
    LEFT_sL: 38,
    RIGHT_sL: 52,
    GROUND: 36
};


var Character = cc.Sprite.extend({

    sprite:null,
    level:null,

    //debug
    testColor:null,

    //collision
    collisionMask:0,

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
    
    //movement
    movementState:MovementState.RUN,
    runSpeed:-3,

    ctor:function (sprite, level) 
    {
        this._super(sprite);

        //debug
        this.testColor = new cc.Color(200,200,200);

        //set anchor point
        this.setAnchorPoint(0,0);
        
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
            this.exitRun(); // << exit current state instead of run state :( - add a real state machine
            this.exitFall();
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
        this.jumpDecayStrength = 0;
        this.jumpCharges = 0;
        this.jumpHold = false;
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
        this.jumpDecayStrength = 0;
        this.jumpCharges = 0;
        this.jumpHold = false;
    },

    updateRun:function()
    {
        this.updateHorizontalMovement();

        //collision
        this.updateCollision();

        // not catching ground and wall collision null!!! PROBLEM
        // change to get collision tile with collision mask "id"?

        switch(this.collisionMask) 
        {
            // no collision
            case CollisionState.NONE:
                this.exitRun();
                this.enterFall();
                break;
            // collision with left wall and ground
            case CollisionState.LEFT_L:
            case CollisionState.LEFT_sL:
                this.x = this.left_midTile.x + this.left_midTile.width;
                this.exitRun();
                this.enterIdle();
                break;
            // collision with right wall and ground
            case CollisionState.RIGHT_L:
            case CollisionState.RIGHT_sL:
                this.x = this.right_midTile.x - this.width;
                this.exitRun();
                this.enterIdle();
                break;
            default:
        }
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


        //switch position when colliding with a wall and not with the ground
        if (this.collisionMask & CollisionState.LEFT_MID
            && !(this.collisionMask & CollisionState.RIGHT_BOT)
            || this.collisionMask & CollisionState.RIGHT_MID
            && !(this.collisionMask & CollisionState.LEFT_BOT ))
        {
            this.runSpeed *= -1;
        }
    },

    updateJump:function()
    {
        this.updateHorizontalMovement();

        // update vertical movement
        this.y += (this.jumpInitialSpeed - this.jumpDecay*this.jumpDecayStrength);

        //stronger jump when holding and not falling
        if (!this.jumpHold)
            this.jumpDecayStrength++;
        else
            this.jumpDecayStrength += this.jumpHoldModifier;

        this.updateCollision();

        switch(this.collisionMask) 
        {
            // no collision
            case CollisionState.NONE:
                if ((this.jumpInitialSpeed - this.jumpDecay*this.jumpDecayStrength) < 0)
                {
                    this.exitJump();
                    this.enterFall();
                }
                break;
            // collision with left wall
            case CollisionState.LEFT_3:
            case CollisionState.LEFT_TOP:
            case CollisionState.LEFT_MID:
            case CollisionState.LEFT_BOT:
            case CollisionState.LEFT_BOT+CollisionState.LEFT_MID:
            case CollisionState.LEFT_MID+CollisionState.LEFT_TOP:
                this.x = this.getCollisionLeftX() + this.level.tileWidth;
                if ((this.jumpInitialSpeed - this.jumpDecay*this.jumpDecayStrength) < 0)
                {
                    this.exitJump();
                    this.enterFall();
                }
                break;
            // collision with right wall
            case CollisionState.RIGHT_3:
            case CollisionState.RIGHT_TOP:
            case CollisionState.RIGHT_MID:
            case CollisionState.RIGHT_BOT:
            case CollisionState.RIGHT_BOT+CollisionState.RIGHT_MID:
            case CollisionState.RIGHT_MID+CollisionState.RIGHT_TOP:
                this.x = this.getCollisionRightX() - this.width;
                if ((this.jumpInitialSpeed - this.jumpDecay*this.jumpDecayStrength) < 0)
                {
                    this.exitJump();
                    this.enterFall();
                }
                break;
            // collision with left wall and ground
            case CollisionState.LEFT_L:
            case CollisionState.LEFT_sL:
                this.x = this.left_midTile.x + this.left_midTile.width;
                this.y = this.left_botTile.y + this.left_botTile.height;
                this.exitJump();
                this.enterIdle();
                break;
            // collision with right wall and ground
            case CollisionState.RIGHT_L:
            case CollisionState.RIGHT_sL:
                this.x = this.right_midTile.x - this.width;
                this.y = this.right_botTile.y + this.right_botTile.height;
                this.exitJump();
                this.enterIdle();
                break;
            // colliding with ground

            default:
            
        }
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

        switch(this.collisionMask) 
        {
            // no collision
            case CollisionState.NONE:
                break;
            // collision with left wall
            case CollisionState.LEFT_3:
            case CollisionState.LEFT_TOP:
            case CollisionState.LEFT_MID:
            case CollisionState.LEFT_BOT+CollisionState.LEFT_MID:
            case CollisionState.LEFT_MID+CollisionState.LEFT_TOP:
                this.x = this.getCollisionLeftX() + this.level.tileWidth;
                break;
            // collision with right wall
            case CollisionState.RIGHT_3:
            case CollisionState.RIGHT_TOP:
            case CollisionState.RIGHT_MID:
            case CollisionState.RIGHT_BOT+CollisionState.RIGHT_MID:
            case CollisionState.RIGHT_MID+CollisionState.RIGHT_TOP:
                this.x = this.getCollisionRightX() - this.width;
                break;
            // collision with left wall and ground
            case CollisionState.LEFT_L:
            case CollisionState.LEFT_sL:
                this.x = this.left_midTile.x + this.left_midTile.width;
                this.y = this.left_botTile.y + this.left_botTile.height;
                this.exitFall();
                this.enterIdle();
                break;
            // collision with right wall and ground
            case CollisionState.RIGHT_L:
            case CollisionState.RIGHT_sL:
                this.x = this.right_midTile.x - this.width;
                this.y = this.right_botTile.y + this.right_botTile.height;
                this.exitFall();
                this.enterIdle();
                break;
            // colliding with ground
            case CollisionState.GROUND:
            case CollisionState.LEFT_BOT:
            case CollisionState.RIGHT_BOT:
                this.y = this.getCollisionGroundY() + this.level.tileHeight;
                this.exitFall();
                this.enterRun();
                break;

            default:
            
        }

    },

    exitFall:function()
    {

    },

    //------------------------------------------------ HORIZONTAL MOVEMENT -------------------------------------------------------
    updateHorizontalMovement:function()
    {
        this.x += this.runSpeed;
    },

    //------------------------------------------------ COLLISION -------------------------------------------------------
    updateCollision:function()
    {
        // clear collision mask
        this.collisionMask = 0;

        // get 6 points for the sprite (only works for character sprite - do it more dynamically!)
        var left_top = new cc.Point(this.x, this.y + this.height);
        var left_mid = new cc.Point(this.x, this.y + this.height/2);
        var left_bot = new cc.Point(this.x, this.y);
        var right_top = new cc.Point(this.x + this.width, this.y + this.height);
        var right_mid = new cc.Point(this.x + this.width, this.y + this.height/2);
        var right_bot = new cc.Point(this.x + this.width, this.y);

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

        // fill collision mask
        if (this.left_botTile)
            this.collisionMask += CollisionState.LEFT_BOT;
        if (this.left_midTile)
            this.collisionMask += CollisionState.LEFT_MID;
        if (this.left_topTile)
            this.collisionMask += CollisionState.LEFT_TOP;
        if (this.right_botTile)
            this.collisionMask += CollisionState.RIGHT_BOT;
        if (this.right_midTile)
            this.collisionMask += CollisionState.RIGHT_MID;
        if (this.right_topTile)
            this.collisionMask += CollisionState.RIGHT_TOP;
        
        console.log(this.collisionMask);
    },

    getCollisionLeftX:function()
    {
        if (this.left_botTile)
            return this.left_botTile.x;
        if (this.left_midTile)
            return this.left_midTile.x;
        if (this.left_topTile)
            return this.left_topTile.x;
        console.log("this should not happen! getCollisionLeftX has nothing to return")
        return 0; // <- this should not happen
    },

    getCollisionRightX:function()
    {
        if (this.right_botTile)
            return this.right_botTile.x;
        if (this.right_midTile)
            return this.right_midTile.x;
        if (this.right_topTile)
            return this.right_topTile.x;
        console.log("this should not happen! getCollisionRightX has nothing to return")
        return 0; // <- this should not happen
    },

    getCollisionGroundY:function()
    {
        if (this.right_botTile)
            return this.right_botTile.y;
        if (this.left_botTile)
            return this.left_botTile.y;
        console.log("this should not happen! getCollisionGroundY has nothing to return")
        return 0; // <- this should not happen
    }

    
});