console.log = function () { };  // ログを出す時にはコメントアウトする

var SCREEN_WIDTH = 1136;              // スクリーン幅
var SCREEN_HEIGHT = 640;              // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

var FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
var ASSETS = {
    "player": "./resource/angus_128_anim.png",

    "barrel": "./resource/barrel.png?20200705",
    "udon": "./resource/udon.png",

    "bg_gra": "./resource/bg_gra.png",
    "bg_sky": "./resource/bg_sky.png",
    "bg_floor": "./resource/bg_floor.png",
};
const fallSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/fall.mp3?20200708'
});
const coinSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/coin05.mp3'
});
const jumpSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/jump.mp3'
});

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
var fitWindowTimer = 0;

var randomSeed = 3557;

tm.main(function () {
    // アプリケーションクラスを生成
    var app = tm.display.CanvasApp("#world");
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);    // サイズ(解像度)設定
    app.fitWindow(false);                       // 手動フィッティング
    app.background = "rgba(77, 136, 255, 1.0)"; // 背景色
    app.fps = 60;                               // フレーム数

    var loading = tm.ui.LoadingScene({
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });

    // 読み込み完了後に呼ばれるメソッドを登録
    loading.onload = function () {
        app.replaceScene(LogoScene());
    };

    // ローディングシーンに入れ替える
    app.replaceScene(loading);

    // 実行
    app.run();
});

/*
 * ロゴ
 */
tm.define("LogoScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "logoLabel",
                    x: SCREEN_CENTER_X,
                    y: 320,
                    fillStyle: "#888",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "UNOFFICIAL GAME",
                    align: "center",
                },
            ]
        });
        this.localTimer = 0;
    },

    update: function (app) {
        // 時間が来たらタイトルへ
        //        if(++this.localTimer >= 5*app.fps)
        this.app.replaceScene(TitleScene());
        app.fitWindow(false);                       // 手動フィッティング
    }
});

/*
 * タイトル
 */
tm.define("TitleScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "titleLabel",
                    x: SCREEN_CENTER_X,
                    y: 320,
                    fillStyle: "#fff",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "NEMLESSSTER",
                    align: "center",
                },
                {
                    type: "Label", name: "subTitleLabel",
                    x: SCREEN_CENTER_X,
                    y: 400,
                    fillStyle: "#fff",
                    fontSize: 48,
                    fontFamily: FONT_FAMILY,
                    text: "the Unlikely",
                    align: "center",
                },
                {
                    type: "Label", name: "subTitleLabel",
                    x: SCREEN_CENTER_X + 324,
                    y: 408,
                    fillStyle: "#fff",
                    fontSize: 16,
                    fontFamily: FONT_FAMILY,
                    text: "1.1",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "startButton",
                    init: [
                        {
                            text: "START",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X,
                    y: 580,
                },
            ]
        });
        this.localTimer = 0;

        var self = this;
        this.startButton.onpointingstart = function () {
            self.app.replaceScene(GameScene());
        };
    },

    update: function (app) {
        app.background = "rgba(0, 0, 0, 1.0)"; // 背景色
        app.fitWindow(false);                       // 手動フィッティング
    }
});

/*
 * ゲーム
 */
tm.define("GameScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();

        group0 = tm.display.CanvasElement().addChildTo(this);
        group1 = tm.display.CanvasElement().addChildTo(this);
        group2 = tm.display.CanvasElement().addChildTo(this);

        this.bgGradation = tm.display.Sprite("bg_gra", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgGradation.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        this.bgFloor0 = tm.display.Sprite("bg_floor").addChildTo(group2);
        this.bgFloor0.setPosition(bgFloorX, bgFloorY);
        this.bgFloor1 = tm.display.Sprite("bg_floor").addChildTo(group2);
        this.bgFloor1.setPosition(bgFloorX + SCREEN_WIDTH, bgFloorY);

        this.bgSky0 = tm.display.Sprite("bg_sky").addChildTo(group0);
        this.bgSky0.setPosition(bgSkyX, bgSkyY);
        this.bgSky1 = tm.display.Sprite("bg_sky").addChildTo(group0);
        this.bgSky1.setPosition(bgSkyX + SCREEN_WIDTH, bgSkyY);

        clearArrays();
        player = new Player().addChildTo(group1);

        this.fromJSON({
            children: [
                {
                    type: "Label", name: "nowScoreLabel",
                    x: SCREEN_WIDTH - 16,
                    y: 32,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "0",
                    align: "right",
                },
                {
                    type: "Label", name: "gameOverLabel",
                    x: SCREEN_CENTER_X,
                    y: 280,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "GAME OVER",
                    align: "center",
                },
                {
                    type: "Label", name: "gameOverScoreLabel",
                    x: SCREEN_CENTER_X,
                    y: 350,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "",
                    align: "center",
                },
                {
                    type: "Label", name: "gameOverDistanceLabel",
                    x: SCREEN_CENTER_X,
                    y: 400,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "tweetButton",
                    init: [
                        {
                            text: "TWEET",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            bgColor: "hsl(240, 80%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X - 160,
                    y: 580,
                    alpha: 0.0,
                },
                {
                    type: "FlatButton", name: "restartButton",
                    init: [
                        {
                            text: "RESTART",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            cornerRadius: 8,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X + 160,
                    y: 580,
                    alpha: 0.0,
                },
            ]
        });

        this.gameOverLabel.setAlpha(0.0);
        this.gameOverScoreLabel.setAlpha(0.0);
        this.gameOverDistanceLabel.setAlpha(0.0);
        this.tweetButton.sleep();
        this.restartButton.sleep();

        var self = this;
        this.restartButton.onpointingstart = function () {
            self.app.replaceScene(GameScene());
        };

        this.buttonAlpha = 0.0;

        nowScore = 0;
        nowDistance = 0;
        randomSeed = 3557;
        fitWindowTimer = 0;

        this.frame = 0;
        this.stopBGM = false;

        player.status = PL_STATUS.RUN;
    },

    onpointingstart: function () {
        if (player.status.isDead) return;

        if (!player.status.isStart) {
        } else if (player.status === PL_STATUS.RUN) {
            player.status = PL_STATUS.JUMP;
            player.moveCounter = 0;
            player.gotoAndPlay("jump0");
            jumpSE.play();
        }

    },

    update: function (app) {
        if (++fitWindowTimer % 15 === 0) app.fitWindow(false);    // 手動フィッティング
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
                    var enemy = Enemy(myRandom(7, 12)); // 最低速度は7が限界、最高速度は25を超えると目押しは厳しい、30をこえると多分無理
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
                fallSE.play();
                //tm.asset.AssetManager.get("fallSE").clone().play();
                this.stopBGM = true;

                var self = this;
                // tweet ボタン
                this.tweetButton.onclick = function () {
                    var twitterURL = tm.social.Twitter.createURL({
                        type: "tweet",
                        text: "NEMLESSSTER スコア: " + self.nowScoreLabel.text + " (距離: " + nowDistance + "m)",
                        hashtags: ["ネムレス", "NEMLESSS"],
                        url: "https://iwasaku.github.io/test7/NEMLESSSTER/index.html",
                    });
                    window.open(twitterURL);
                };
            }

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.setAlpha(this.buttonAlpha);
            this.gameOverScoreLabel.text = "SCORE:" + this.nowScoreLabel.text;
            this.gameOverScoreLabel.setAlpha(this.buttonAlpha);
            this.gameOverDistanceLabel.text = "DISTANCE:" + nowDistance + "m";
            this.gameOverDistanceLabel.setAlpha(this.buttonAlpha);
            this.tweetButton.setAlpha(this.buttonAlpha);
            this.restartButton.setAlpha(this.buttonAlpha);
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
tm.define("Player", {
    superClass: "tm.app.AnimationSprite",

    init: function () {
        var ss = tm.asset.SpriteSheet({
            // 画像
            image: "player",
            // １コマのサイズ指定および全コマ数
            frame: {
                width: 128,
                height: 128,
                count: 4
            },
            // アニメーションの定義（開始コマ、終了コマ、次のアニメーション）
            animations: {
                "run": [0, 2, "run", 10],
                "jump0": [2, 3, "jump1", 13],
                "jump1": [0, 1, "run", 1],
                "dead": [0, 1, "dead", 1],
            }
        });

        this.superInit(ss, 256, 256);
        this.direct = '';
        this.zRot = 0;
        this.setPosition(192, floorYPos).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 72;

        this.status = PL_STATUS.INIT;
        this.moveCounter = 0;
        this.gotoAndPlay("run");
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
    250,
    260,
    270,
    300,
    320,
];
tm.define("Enemy", {
    superClass: "tm.app.Sprite",

    init: function (spd) {
        this.spriteName = "barrel";
        this.xSpd = -spd;
        this.zRotSpd = this.xSpd / 2;
        this.superInit(this.spriteName, 128, 128);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 64;

        this.vec = tm.geom.Vector2(0, 0);
        this.position.set(SCREEN_WIDTH + 128, floorYPos + 64);
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
        if (this.isHitElement(player)) {
            player.status = PL_STATUS.DEAD;
            player.gotoAndPlay("dead");
        }

        if (this.testFlag) {
            if (player.status === PL_STATUS.RUN) {
                if (false) {
                    var len = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));
                    if (len < testTable[-this.xSpd - 7]) {
                        player.status = PL_STATUS.JUMP;
                        player.moveCounter = 0;
                        player.gotoAndPlay("jump0");
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
tm.define("Udon", {
    superClass: "tm.app.Sprite",

    init: function (spd) {
        this.spriteName = "udon";
        this.xSpd = -spd;
        this.superInit(this.spriteName, 80, 80);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 64;

        this.vec = tm.geom.Vector2(0, 0);
        this.position.set(SCREEN_WIDTH + 128, SCREEN_CENTER_Y - 192);
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
        if (this.isHitElement(player)) {
            //tm.asset.AssetManager.get("coinSE").clone().play();
            coinSE.play();
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
    return (randomSeed % mod) + start;
}

