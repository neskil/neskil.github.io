 var config =   {
        type: Phaser.AUTO,
        width: 400,
        height: 400,
        physics:    {
            default: 'arcade',
            arcade: {gravity: { y: 200 }}
                    },
        scene:      {
            preload: preload,
            create: create
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

        
        
    var bmpText;
    
        
    function create ()
    {
        this.add.image(200, 600, 'sky');

        var particles = this.add.particles('red');
        var particles2 = this.add.particles('purp');
        var particles3 = this.add.particles('green');

        var emitter = particles.createEmitter({
            speed: 0,
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD'
        });
        var emitter2 = particles2.createEmitter({
            speed: 500,
            scale: { start: 0.1, end: 0.2 },
            blendMode: 'ADD'
        });
        var emitter3 = particles3.createEmitter({
            speed: 50,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD'
        });

        var carl = this.physics.add.image(400, 100, 'carl').setScale(0.5);
        var maja = this.physics.add.image(300, 000, 'maja').setScale(0.5);
        var daniel = this.physics.add.image(700, 500, 'daniel').setScale(0.5);

        carl.setVelocity(-300, 400);
        carl.setBounce(0.6, 0.95);
        carl.setCollideWorldBounds(true);
        
        
        maja.setVelocity(700, 100);
        maja.setBounce(0.7, 0.9);
        maja.setCollideWorldBounds(true);

        
        daniel.setVelocity(-700, -400);
        daniel.setBounce(0.7, 0.9);
        daniel.setCollideWorldBounds(true);

        
        emitter.startFollow(carl);
        emitter2.startFollow(maja);
        emitter3.startFollow(daniel);
        }