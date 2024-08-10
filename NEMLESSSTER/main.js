phina.globalize();

//console.log = function () { }; // ログを出す時にはコメントアウトする

var SCREEN_WIDTH = 1136;       // スクリーン幅
var SCREEN_HEIGHT = 640;       // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH / 2;  // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2; // スクリーン高さの半分

var FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
var ASSETS = {
    image: {
        "player": "./resource/angus_128_anim.png",

        "barrel": "./resource/barrel.png?20200705",
        "udon": "./resource/udon.png",

        "bg_gra": "./resource/bg_gra.png",
        "bg_sky": "./resource/bg_sky.png",
        "bg_floor": "./resource/bg_floor.png",
    },
    spritesheet: {
        "player_ss":
        {
            // フレーム情報
            "frame": {
                "width": 128, // 1フレームの画像サイズ（横）
                "height": 128, // 1フレームの画像サイズ（縦）
                "cols": 4, // フレーム数（横）
                "rows": 1, // フレーム数（縦）
            },
            // アニメーション情報
            "animations": {
                "run": { // アニメーション名
                    "frames": [0, 1, 2], // フレーム番号範囲[0,1,2]の形式でもOK
                    "next": "run", // 次のアニメーション。空文字列なら終了。同じアニメーション名ならループ
                    "frequency": 10, // アニメーション間隔
                },
                "jump0": { // アニメーション名
                    "frames": [2, 3], // フレーム番号範囲[0,1,2]の形式でもOK
                    "next": "jump1", // 次のアニメーション。空文字列なら終了。同じアニメーション名ならループ
                    "frequency": 13, // アニメーション間隔
                },
                "jump1": { // アニメーション名
                    "frames": [0, 1], // フレーム番号範囲[0,1,2]の形式でもOK
                    "next": "run", // 次のアニメーション。空文字列なら終了。同じアニメーション名ならループ
                    "frequency": 1, // アニメーション間隔
                },
                "dead": { // アニメーション名
                    "frames": [0], // フレーム番号範囲[0,1,2]の形式でもOK
                    "next": "dead", // 次のアニメーション。空文字列なら終了。同じアニメーション名ならループ
                    "frequency": 1, // アニメーション間隔
                },
            }
        },
    },
    sound: {
        "fall_se": './resource/fall.mp3',
        "coin_se": './resource/coin05.mp3',
        "jump_se": './resource/jump.mp3',
    }
};

// 定義
var PL_STATUS = defineEnum({
    INIT: {
        value: 0,
        isStart: Boolean(0),
        isDead: Boolean(0),
        canAction: Boolean(0),
        string: 'init'
    },
    RUN: {
        value: 1,
        isStart: Boolean(1),
        isDead: Boolean(0),
        canAction: Boolean(1),
        string: 'stand'
    },
    JUMP: {
        value: 2,
        isStart: Boolean(1),
        isDead: Boolean(0),
        canAction: Boolean(0),
        string: 'up'
    },
    DEAD: {
        value: 3,
        isStart: Boolean(0),
        isDead: Boolean(1),
        canAction: Boolean(0),
        string: 'dead'
    },
});
var EN_STATUS = defineEnum({
    INIT: {
        value: 0,
        isStart: Boolean(0),
        isDead: Boolean(0),
        canAction: Boolean(0),
        string: 'init'
    },
    FORWARD: {
        value: 1,
        isStart: Boolean(1),
        isDead: Boolean(0),
        canAction: Boolean(1),
        string: 'forward'
    },
    DEAD: {
        value: 2,
        isStart: Boolean(0),
        isDead: Boolean(1),
        canAction: Boolean(0),
        string: 'dead'
    },
});

const jumpOffset = [
    0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
    -11, -22, -33,
    -44, -55, -66,
    -77, -88, -99,
    -110, -121, -132,
    -143, -154, -165,
    -176, -187, -198,
    -198, -187, -176,
    -165, -154, -143,
    -132, -121, -110,
    -99, -88, -77,
    -66, -55, -44,
    -33, -22, -11,
    0,
];
const floorYPos = SCREEN_CENTER_Y + 128;

var group0 = null;
var group1 = null;
var group2 = null;
var player = null;
var bgFloorX = 568;
var bgFloorY = 598;
var bgSkyX = 568;
var bgSkyY = 200;
var enemyArray = [];
var udonArray = [];
var nowScore = 0;
var nowDistance = 0;
var totalSec = 0;

var randomSeed = 3557;

phina.main(function () {
    var app = GameApp({
        startLabel: 'logo',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        fps: 60,
        backgroundColor: 'black',

        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'LogoScene',
                label: 'logo',
                nextLabel: 'title',
            },
            {
                className: 'TitleScene',
                label: 'title',
                nextLabel: 'game',
            },
            {
                className: 'GameScene',
                label: 'game',
                nextLabel: 'game',
            },
        ]
    });

    // iOSなどでユーザー操作がないと音がならない仕様対策
    // 起動後初めて画面をタッチした時に『無音』を鳴らす
    app.domElement.addEventListener('touchend', function dummy() {
        var s = phina.asset.Sound();
        s.loadFromBuffer();
        s.play().stop();
        app.domElement.removeEventListener('touchend', dummy);
    });

    // fps表示
    //app.enableStats();

    // 実行
    app.run();
});

/*
* ローディング画面をオーバーライド
*/
phina.define('LoadingScene', {
    superClass: 'DisplayScene',

    init: function (options) {
        this.superInit(options);

        var self = this;
        var loader = phina.asset.AssetLoader();

        // 明滅するラベル
        let label = phina.display.Label({
            text: "",
            fontSize: 64,
            fill: 'white',
        }).addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        // ロードが進行したときの処理
        loader.onprogress = function (e) {
            // 進捗具合を％で表示する
            label.text = "{0}%".format((e.progress * 100).toFixed(0));
        };

        // ローダーによるロード完了ハンドラ
        loader.onload = function () {
            // Appコアにロード完了を伝える（==次のSceneへ移行）
            self.flare('loaded');
        };

        // ロード開始
        loader.load(options.assets);
    },

});

/*
 * ロゴ
 */
phina.define("LogoScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);
        this.localTimer = 0;
    },

    update: function (app) {
        // フォント読み込み待ち
        var self = this;
        document.fonts.load('12px "Press Start 2P"').then(function () {
            self.exit();
        });
    }
});

/*
 * タイトル
 */
phina.define("TitleScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        this.titleLabel = Label({
            text: "NEMLESSSTER",
            fontSize: 64,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: 320,
        }).addChildTo(this);

        this.subTitleLabel = Label({
            text: "the Unlikely",
            fontSize: 48,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: 400,
        }).addChildTo(this);

        this.verLabel = Label({
            text: "1.2",
            fontSize: 16,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X + 324,
            y: 408,
        }).addChildTo(this);

        this.startButton = Button({
            text: "START",
            fontFamily: FONT_FAMILY,
            fontSize: 32,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: 580,
        }).addChildTo(this);
        var self = this;
        this.startButton.onpush = function () {
            self.exit();
        };

        this.localTimer = 0;
    },

    update: function (app) {
    }
});

/*
 * ゲーム
 */
phina.define("GameScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        group0 = DisplayElement().addChildTo(this);
        group1 = DisplayElement().addChildTo(this);
        group2 = DisplayElement().addChildTo(this);

        this.bgGradation = phina.display.Sprite("bg_gra").addChildTo(group0);
        this.bgGradation.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.bgGradation.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        this.bgFloor0 = phina.display.Sprite("bg_floor").addChildTo(group2);
        this.bgFloor0.setPosition(bgFloorX, bgFloorY);
        this.bgFloor1 = phina.display.Sprite("bg_floor").addChildTo(group2);
        this.bgFloor1.setPosition(bgFloorX + SCREEN_WIDTH, bgFloorY);

        this.bgSky0 = phina.display.Sprite("bg_sky").addChildTo(group0);
        this.bgSky0.setPosition(bgSkyX, bgSkyY);
        this.bgSky1 = phina.display.Sprite("bg_sky").addChildTo(group0);
        this.bgSky1.setPosition(bgSkyX + SCREEN_WIDTH, bgSkyY);

        clearArrays();
        player = new Player().addChildTo(group1);

        this.nowScoreLabel = Label({
            text: "0",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "right",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_WIDTH - 16,
            y: 32,
        }).addChildTo(this);
        this.gameOverLabel = Label({
            text: "GAME OVER",
            fontSize: 64,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: 280,
        }).addChildTo(this);
        this.gameOverScoreLabel = Label({
            text: "",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: 350,
        }).addChildTo(this);
        this.gameOverDistanceLabel = Label({
            text: "",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: 400,
        }).addChildTo(this);

        this.screenButton = Button({
            text: "",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#444",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        }).addChildTo(group2)

        this.tweetButton = Button({
            text: "POST",
            fontFamily: FONT_FAMILY,
            fontSize: 32,
            cornerRadius: 8,
            fill: "#7575EF", // ボタン色
            x: SCREEN_CENTER_X - 160,
            y: 580,
            width: 240,
            height: 60,
        }).addChildTo(this);
        this.restartButton = Button({
            text: "RESTART",
            fontFamily: FONT_FAMILY,
            fontSize: 32,
            cornerRadius: 8,
            fill: "#B2B2B2",
            x: SCREEN_CENTER_X + 160,
            y: 580,
            width: 240,
            height: 60,
        }).addChildTo(this);

        this.gameOverLabel.alpha = 0.0;
        this.gameOverScoreLabel.alpha = 0.0;
        this.gameOverDistanceLabel.alpha = 0.0;
        this.screenButton.alpha = 0.0;
        this.tweetButton.alpha = 0.0;
        this.tweetButton.sleep();
        this.restartButton.alpha = 0.0;
        this.restartButton.sleep();

        var self = this;

        this.screenButton.onpointstart = function () {
            if (player.status.isDead) return;

            if (!player.status.isStart) {
            } else if (player.status === PL_STATUS.RUN) {
                player.status = PL_STATUS.JUMP;
                player.moveCounter = 0;
                player.anim.gotoAndPlay("jump0");
                SoundManager.play("jump_se");
            }

        };

        this.restartButton.onpush = function () {
            self.exit();
        };

        this.buttonAlpha = 0.0;

        nowScore = 0;
        nowDistance = 0;
        randomSeed = 3557;

        this.frame = 0;
        this.stopBGM = false;

        player.status = PL_STATUS.RUN;
    },

    update: function (app) {
        if (!player.status.isDead) {
            // 床スクロール
            bgFloorX -= 6;
            if (bgFloorX < -SCREEN_WIDTH / 2) bgFloorX = SCREEN_WIDTH / 2;
            this.bgFloor0.setPosition(bgFloorX, bgFloorY);
            this.bgFloor1.setPosition(bgFloorX + SCREEN_WIDTH, bgFloorY);

            // 雲スクロール
            bgSkyX -= 1;
            if (bgSkyX < -SCREEN_WIDTH / 2) bgSkyX = SCREEN_WIDTH / 2;
            this.bgSky0.setPosition(bgSkyX, bgSkyY);
            this.bgSky1.setPosition(bgSkyX + SCREEN_WIDTH, bgSkyY);

            if (player.status.isStart) {
                this.frame++;
                this.tmpSec = Math.floor(this.frame / app.fps);
                nowDistance = Math.floor(this.frame / app.fps);

                if ((this.frame + 120) % 240 === 0) {
                    var enemy = Enemy(myRandom(7, 20)); // 最低速度は7が限界、最高速度は25を超えると目押しは厳しい、30をこえると多分無理
                    enemy.addChildTo(group1);
                    enemyArray.push(enemy);
                }

                // うどん
                if (this.frame % 240 === 0) {
                    var udon = Udon(myRandom(10, 20));
                    udon.addChildTo(group1);
                    udonArray.push(udon);
                }
            }

            this.nowScoreLabel.text = nowScore + nowDistance;

        } else {
            if (!this.stopBGM) {
                SoundManager.play("fall_se");
                this.stopBGM = true;

                var self = this;
                // tweet ボタン
                this.tweetButton.onclick = function () {
                    var twitterURL = phina.social.Twitter.createURL({
                        type: "tweet",
                        text: "NEMLESSSTER スコア: " + self.nowScoreLabel.text + " (距離: " + nowDistance + "m)\n",
                        hashtags: ["ネムレス", "NEMLESSS"],
                        url: "https://iwasaku.github.io/test7/NEMLESSSTER/",
                    });
                    window.open(twitterURL);
                };
            }

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.alpha = this.buttonAlpha;
            this.gameOverScoreLabel.text = "SCORE:" + this.nowScoreLabel.text;
            this.gameOverScoreLabel.alpha = this.buttonAlpha;
            this.gameOverDistanceLabel.text = "DISTANCE:" + nowDistance + "m";
            this.gameOverDistanceLabel.alpha = this.buttonAlpha;
            this.tweetButton.alpha = this.buttonAlpha;
            this.restartButton.alpha = this.buttonAlpha;
            if (this.buttonAlpha > 0.7) {
                this.tweetButton.wakeUp();
                this.restartButton.wakeUp();
            }
        }
    }
});

/*
 * Player
 */
phina.define("Player", {
    superClass: 'Sprite',

    init: function (option) {
        this.superInit("player", 256, 256);
        this.anim = FrameAnimation('player_ss').attachTo(this);
        // スプライトシートのサイズにフィットさせない
        this.anim.fit = false;
        //アニメーションを再生する
        this.anim.gotoAndPlay('run');

        this.direct = '';
        this.zRot = 0;
        this.setPosition(192, floorYPos).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 72;

        this.status = PL_STATUS.INIT;
        this.moveCounter = 0;
    },

    update: function (app) {
        if (this.status === PL_STATUS.INIT) return;

        if (this.status === PL_STATUS.JUMP) {
            var ofs = jumpOffset[this.moveCounter]
            this.y = floorYPos + ofs;
            if (ofs === 0) {
                this.zRot = 0;
            } else if (this.moveCounter < jumpOffset.length / 2) {
                this.zRot = -16;
            } else {
                this.zRot += 2;
                if (this.zRot > 0) this.zRot = 0;
            }
            if (++this.moveCounter >= jumpOffset.length) {
                this.status = PL_STATUS.RUN;
                this.y = floorYPos;
                this.zRot = 0;
            }
        }
        this.rotation = this.zRot;
    },
});

/*
 * Enemey
 */
const testTable = [
    240,
    250 + 10,
    260 + 10,
    270 + 10,
    300 + 10,
    320 + 10,
    340 + 10,
    360 + 10,
    380 + 10,
    400 + 10,
    420 + 10,
    440 + 10,
    460 + 10,
    480 + 10,
];
phina.define("Enemy", {
    superClass: "Sprite",

    init: function (spd) {
        this.spriteName = "barrel";
        this.xSpd = -spd;
        console.log(spd);
        this.zRotSpd = this.xSpd / 2;
        this.superInit(this.spriteName);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 32;

        this.vec = phina.geom.Vector2(0, 0);
        this.setPosition(SCREEN_WIDTH + 128, floorYPos + 64).setSize(128, 128);
        this.rotation = 0;
        this.testFlag = true;
    },

    update: function (app) {
        if (player.status.isDead) return;

        // 移動
        this.vec.x = this.xSpd;
        this.position.add(this.vec);
        this.rotation += this.zRotSpd;

        // 画面左端から出た?
        if (this.x < -128) {
            this.remove();
        }

        // 自機との衝突判定
        if (this.hitTestElement(player)) {
            player.status = PL_STATUS.DEAD;
            player.anim.gotoAndPlay("dead");
        }

        if (this.testFlag) {
            if (player.status === PL_STATUS.RUN) {
                if (false) {
                    var len = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
                    if (len < testTable[-this.xSpd - 7]) {
                        player.status = PL_STATUS.JUMP;
                        player.moveCounter = 0;
                        player.anim.gotoAndPlay("jump0");
                        this.testFlag = false;
                    }
                } else {
                    this.testFlag = false;
                }
            }
        }
    },
});

/*
 * Udon
 */
phina.define("Udon", {
    superClass: "Sprite",

    init: function (spd) {
        this.xSpd = -spd;
        this.superInit("udon");
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 64;

        this.vec = phina.geom.Vector2(0, 0);
        this.setPosition(SCREEN_WIDTH + 128, SCREEN_CENTER_Y - 192).setSize(80, 80);
    },

    update: function (app) {
        if (player.status.isDead) return;

        // 移動
        this.vec.x = this.xSpd;
        this.position.add(this.vec);

        // 画面左端から出た?
        if (this.x < -128) {
            this.remove();
        }

        // 自機との衝突判定
        if (this.hitTestElement(player)) {
            SoundManager.play("coin_se");
            nowScore += (parseInt(nowDistance / 10.0) + 1); // 走破距離の(1/10)+1が饂飩点
            this.remove();
        }
    },
});

function clearArrays() {
    var self = this;

    for (var ii = self.enemyArray.length - 1; ii >= 0; ii--) {
        var tmp = self.enemyArray[ii];
        if (tmp.parent == null) console.log("NULL!!");
        else tmp.remove();
        self.enemyArray.erase(tmp);
    }

    for (var ii = self.udonArray.length - 1; ii >= 0; ii--) {
        var tmp = self.udonArray[ii];
        if (tmp.parent == null) console.log("NULL!!");
        else tmp.remove();
        self.udonArray.erase(tmp);
    }
}

// 絶対値を返す関数
// https://iwb.jp/javascript-math-abs-deprecated/
function abs(val) {
    return val < 0 ? -val : val;
}

function myRandom(start, end) {
    var mod = (end - start) + 1;
    randomSeed = (randomSeed * 5) + 1;
    for (; ;) {
        if (randomSeed < 2147483647) break;
        randomSeed -= 2147483647;
    }
    return (randomSeed % mod) + start;
}

