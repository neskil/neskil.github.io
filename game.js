//Random function 
function randX(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
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
        this.load.image('maja', 'img/maja.png');
        this.load.image('carl', 'img/carl.png');
        this.load.image('red', 'img/red.png');
        this.load.image('purp', 'img/purp.png');
        this.load.image('green', 'img/green.png');
        this.load.image('daniel', 'img/daniel.png');

    }

        
        
    var cursors;
    var carl;
    var maja;
    var daniel;
    var showDebug= true;

        
    function create ()
    {
        this.add.image((xWidth/2)-20, 640, 'sky');

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

        carl = this.physics.add.image(0, 0, 'carl');
        carl.displayOriginX = -20;
        carl.displayOriginY = 20;
        carl.displayWidth = 100;
        carl.displayHeight = 100;
        carl.setBounce(0.95).setCollideWorldBounds(true);
        carl.body.ignoreGravity = true;;
        carl.setVelocity(-300, 400);
        
        maja = this.physics.add.image(300, 000, 'maja');
        daniel = this.physics.add.image(700, 500, 'daniel');


        
        
        maja.setVelocity(700, 100);
        maja.setBounce(0.5, 0.9);
        maja.setCollideWorldBounds(true);
        maja.displayOriginX = 0;
        maja.displayOriginY = 0;
        maja.displayWidth = 100;
        maja.displayHeight = 100;
        
        
        daniel.setVelocity(-700, -400);
        daniel.setBounce(0.5, 0.9);
        daniel.setCollideWorldBounds(true);
        daniel.displayOriginX = 0;
        daniel.displayOriginY = 0;
        daniel.displayWidth = 100;
        daniel.displayHeight = 100;

        
        emitter.startFollow(carl);
        emitter2.startFollow(maja);
        emitter3.startFollow(daniel);
        
        
        cursors = this.input.keyboard.createCursorKeys();
        
        this.input.on('pointerdown', function (pointer) {
            maja.setVelocity(randX(-500,500),randX(-500,500));

            daniel.setVelocity(randX(-500,500),-randX(-500,500));

            carl.setVelocity(randX(-800,800),randX(-800,800));
            
            ;}, this);
        
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