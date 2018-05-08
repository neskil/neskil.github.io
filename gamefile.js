  var config = {
        type: Phaser.AUTO,
        width: 1000,
        height: 400,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 }
            }
        },
        scene: {
            preload: preload,
            create: create
        }
    };

    var game = new Phaser.Game(config);

    function preload ()
    {
       
        this.load.setBaseURL('http://neskilsson.se');
        this.load.image('sky', 'images/designer-photo.jpg');
        this.load.image('test', 'images/sm-twitter-icon.png');
        this.load.image('maja', 'img/maja.png');
        this.load.image('carl', 'img/carl.png');
        this.load.image('red', 'img/red.png');
        this.load.image('daniel', 'img/daniel.png');

    }

        
                
    function create ()
    {
        this.add.image(500, 600, 'sky');

        var particles = this.add.particles('red');
        var particles2 = this.add.particles('red');

        var emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 1, end: -1 },
            blendMode: 'ADD'
        });
        var emitter2 = particles.createEmitter({
            speed: 500,
            scale: { start: 0, end: 2 },
            blendMode: 'ADD'
        });
        var emitter3 = particles.createEmitter({
            speed: 500,
            scale: { start: 0, end: 2 },
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
    
        