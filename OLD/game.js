//Random function 
function randX(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function randY(min, max) {
    return Math.random() * (max - min) + min;
}

//Screen width
var xWidth = 500

var xWidth = screen.width - 100;

//document.write(xWidth + "   ")

if (xWidth > 800){xWidth=800}
    
//var xWidth = screen.width;
//var yWidth = screen.width;
//document.write(xWidth)

var config =   {
        type: Phaser.AUTO,
        width: xWidth,
        height: 450,
        physics:    {
            default: 'arcade',
            arcade: {gravity: { y: 300 },
                    debug:false}
                    },
        scene:      {
            preload: preload,
            create: create,
            update: update,
            render: render
                    },
        parent:'GAMEWID'
                };

    var game = new Phaser.Game(config);

    function preload ()
    {
       
        this.load.setBaseURL('http://neskilsson.se');
        this.load.image('sky', 'img/designer-photo.jpg');
        this.load.image('maja', 'img/bild1.png');
        this.load.image('carl', 'img/bild2.png');
        this.load.image('red', 'img/red.png');
        this.load.image('purp', 'img/purp.png');
        this.load.image('green', 'img/green.png');
        this.load.image('daniel', 'img/bild3.png');
        
        this.load.atlas('flares', 'phaser/src/particles/flares.png', 'phaser/src/particles/flares.json');
        this.load.atlas('explosion', 'phaser/src/particles/explosion.png', 'phaser/src/particles/explosion.json');


    }

        
        
    var cursors;
    var carl;
    var maja;
    var daniel;
    var showDebug= true;

        
    function create ()
    {
        this.add.image((xWidth/2)-20, 640, 'sky');
        
        //Emitters i hörnen


var particles4 = this.add.particles('flares');

var emitter4 = particles4.createEmitter({
        frame: 'blue',
        x: 10,
        y: 440,
        lifespan: 2000,
        speed: { min: 200, max: 600 },
        angle: 270+5,
        gravityY: 400,
        scale: { start: 0.3, end: 0.1 },
        quantity: 1,
        collideWorldBounds:true,
        bounce: 0.9,
        collideBottom: false,
        blendMode: 'ADD'
});

var emitter4 = particles4.createEmitter({
        frame: 'blue',
        x: xWidth-20,
        y: 440,
        lifespan: 2000,
        speed: { min: 200, max: 600 },
        angle: 270-5,
        gravityY: 400,
        scale: { start: 0.3, end: 0.1 },
        quantity: 1,
        blendMode: 'ADD'
});
        
        

        var particles = this.add.particles('red');
        var particles2 = this.add.particles('purp');
        var particles3 = this.add.particles('green');

        var emitter = particles.createEmitter({
            speed: 0,
            scale: { start: 0.3, end: 0 },
            x: 50,
            y: 50,
            blendMode: 'ADD'
        });
        var emitter2 = particles2.createEmitter({
            speed: 500,
            scale: { start: 0.2, end: 0.0 },
            x: 50,
            y: 50,
            blendMode: 'ADD'
        });
        var emitter3 = particles3.createEmitter({
            speed: 50,
            scale: { start: 0.5, end: 0 },
            x: 50,
            y: 50,
            blendMode: 'ADD'
        });

        carl = this.physics.add.sprite(0, 0, 'carl');
        carl.setBounce(1)
        carl.setCollideWorldBounds(true);
        carl.body.ignoreGravity = true;
        carl.setVelocity(-300, 400);
        carl.displayOriginX = 0.5;
        carl.displayOriginY = 0.5;
        carl.setScale(.5);
        //carl.displayWidth = 100;
        //carl.displayHeight = 100;
        
        maja = this.physics.add.sprite(0, 30, 'maja');
        maja.setVelocity(randX(-500,500), randX(-500,500));
        maja.setBounce(1, 1);
        maja.setCollideWorldBounds(true);
        maja.displayOriginX = 0.5;
        maja.displayOriginY = 0.5;
        maja.setScale(.5);
        //maja.displayWidth = 100;
        //maja.displayHeight = 100;
        
        daniel = this.physics.add.sprite(xWidth, 30, 'daniel');
        daniel.setVelocity(randX(-500,500), randX(-500,500));
        daniel.setBounce(1, 1);
        daniel.setCollideWorldBounds(true);
        daniel.displayOriginX = 0.5;
        daniel.displayOriginY = 0.5;
        daniel.setScale(.5);
        //daniel.displayWidth = 100;
        //daniel.displayHeight = 130;

        
        emitter.startFollow(carl);
        emitter2.startFollow(maja);
        emitter3.startFollow(daniel);
        
        
        cursors = this.input.keyboard.createCursorKeys();
        
        this.input.on('pointerdown', function (pointer) {
            maja.setVelocity(randX(-500,500),randX(-500,500));

            daniel.setVelocity(randX(-500,500),-randX(-500,500));

            carl.setVelocity(randX(-800,800),randX(-800,800));
            
            maja.setScale(randY(0.2,0.7));
            daniel.setScale(randY(0.2,0.7));
            carl.setScale(randY(0.2,0.7));
            
            ;}, this);
        
        

    var emitter10 = this.add.particles('flares').createEmitter({
        frame:'red',
        x: -1000,
        y: -1000,
        speed: { min: -400, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'BLEND',
        //active: false,
        lifespan: 900,
        gravityY: 1200,
        quantity: 30,
    });

    var emitter11 = this.add.particles('flares').createEmitter({
        frame:'yellow',
        x: -1000,
        y: -1000,
        speed: { min: -400, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        blendMode: 'ADD',
        //active: false,
        lifespan: 600,
        gravityY: 1200,
        quantity: 30
    });

    this.input.on('pointerdown', function (pointer) {
        emitter10.setPosition(pointer.x, pointer.y);
        emitter11.setPosition(pointer.x, pointer.y);
        emitter10.explode();
        emitter11.explode();
    });
this.physics.add.collider(daniel, maja);
this.physics.add.collider(maja, carl);              
this.physics.add.collider(carl, daniel);              
        
//this.physics.add.collider(daniel,maja,carl);

//Slut av Funciton Create
}

function update (){
    
//if (cursors.up.isDown)
//{
//maja.setVelocityY(-200);
//daniel.setVelocityY(500);
//carl.setVelocityY(-500);
//}

    
    
}

function render (){
    game.debug.bodyInfo(maja, 32, 32);
    game.debug.body(maja);
    
}