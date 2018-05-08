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
            speed: 50,
            scale: { start: 1, end: -0.5 },
            blendMode: 'ADD'
        });
        var emitter2 = particles2.createEmitter({
            speed: 50,
            scale: { start: 0, end: 0.5 },
            blendMode: 'ADD'
        });
        var emitter3 = particles3.createEmitter({
            speed: 50,
            scale: { start: 0, end: 0.5 },
            blendMode: 'ADD'
        });

        var logo = this.physics.add.image(400, 100, 'carl');
        var logo2 = this.physics.add.image(300, 000, 'maja');
        var logo3 = this.physics.add.image(700, 500, 'daniel');

        logo.setVelocity(-300, 400);
        logo.setBounce(0.6, 0.95);
        logo.setCollideWorldBounds(true);
        
        
        logo2.setVelocity(700, 100);
        logo2.setBounce(0.7, 0.9);
        logo2.setCollideWorldBounds(true);

        
        logo3.setVelocity(-700, -400);
        logo3.setBounce(0.7, 0.9);
        logo3.setCollideWorldBounds(true);

        
        emitter.startFollow(logo);
        emitter2.startFollow(logo2);
        emitter3.startFollow(logo3);
        }