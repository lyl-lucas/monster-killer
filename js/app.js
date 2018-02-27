var container = document.getElementById('game');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
window.requestAnimFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function(callback) {
  window.setTimeout(callback, 1000 / 30);
};
var plane;
var enemy;
var bullets = [];
/**
* 游戏相关配置
* @type {Object}
*/
var CONFIG = {
  status: 'start', // 游戏开始默认为开始中
  level: 2, // 游戏默认等级
  totalLevel: 6, // 总共6关
  numPerLine: 6, // 游戏默认每行多少个怪兽
  canvasPadding: 30, // 默认画布的间隔
  bulletSize: 10, // 默认子弹长度
  bulletSpeed: 10, // 默认子弹的移动速度
  enemySpeed: 2, // 默认敌人移动距离
  enemySize: 50, // 默认敌人的尺寸
  enemyGap: 10,  // 默认敌人之间的间距
  enemyIcon: './img/enemy.png', // 怪兽的图像
  enemyBoomIcon: './img/boom.png', // 怪兽死亡的图像
  enemyDirection: 'left', // 默认敌人一开始往右或向左移动
  planeSpeed: 5, // 默认飞机每一步移动的距离
  planeSize: {
    width: 60,
    height: 90
  }, // 默认飞机的尺寸,
  planeIcon: './img/plane.png',
};

// 图片预加载相关参数
var images ={};
var sources = {
  enemyIcon: CONFIG.enemyIcon,
  enemyBoomIcon: CONFIG.enemyBoomIcon,
  planeIcon: CONFIG.planeIcon
}

/**
 * 整个游戏对象
 */
var GAME = {
  /**
   * 初始化函数,这个函数只执行一次
   * @param  {object} opts 
   * @return {[type]}      [description]
   */
  init: function(opts) {
    this.status = 'start';
    this.totalLevel = CONFIG.totalLevel;
    this.level = CONFIG.level;
    this.currentLevel = this.level;
    this.score = 0;
    this.goal = this.level * CONFIG.numPerLine;
    this.currentGoal = this.goal;
    this.setStartLevelText();
    this.bindEvent();
    this.initItems();
  },
  setStartLevelText: function () {
    var gameLevelTxt = document.querySelector('.game-level');
    gameLevelTxt.innerHTML = '当前Level: ' + this.level;
  },
  bindEvent: function() {
    var self = this;
    var playBtn = document.querySelector('.js-play');
    var replayBtns = document.querySelectorAll('.js-replay');
    var nextBtn = document.querySelector('.js-next');
    var continueBtn = document.querySelector('.js-continue');
    var stopBtn = document.querySelector('.js-stop');
    stopBtn.onclick = function() {
      self.stop();
    }
    // 开始游戏和继续游戏按钮绑定
    continueBtn.onclick = 
    playBtn.onclick =
    nextBtn.onclick = function() {
      self.play();
    }
    replayBtns.forEach(function(replayBtn) {
      replayBtn.onclick = function() {
        self.play();
      }
    })
  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * all-success 游戏通过
   * stop 游戏暂停（可选）
   */
  setStatus: function(status) {
    this.status = status;
    container.setAttribute("data-status", status);
  },
  play: function() {
    this.setStatus('playing');
    animate();
  },
  stop: function() {
    clear();
    this.setStatus('stop');
  },
  fail: function() {
    var scoreTxt = document.querySelector('.score');
    scoreTxt.innerHTML = this.score;
    clear();
    this.setStatus('failed');
    this.reset();
    this.initItems();
  },
  succeed: function() {
    var nextLevelTxt = document.querySelector('.game-next-level');
    clear();
    if (this.currentLevel === this.totalLevel) {
      this.setStatus('all-success');
      this.reset();
    } else {
      this.setStatus('success');
      this.currentLevel++;
      this.currentGoal += this.currentLevel * enemy.numPerLine;
      nextLevelTxt.innerHTML = '下一个Level： ' + this.currentLevel;
    }
    this.initItems();
  },
  reset: function() {
    this.currentLevel = this.level;
    this.currentGoal = this.goal;
    this.score = 0;
  },
  initItems: function() {
    enemy.init(this.currentLevel);
    plane.init();
    bullets.splice(0, bullets.length);
  }
};

/**
 * 飞机
 */
plane = {
  init: function() {
    this.width = CONFIG.planeSize.width;
    this.height = CONFIG.planeSize.height;
    this.x = canvas.width/2 - this.width/2 - CONFIG.canvasPadding;
    this.y = canvas.height -CONFIG.canvasPadding - this.height;
    this.step = CONFIG.planeSpeed;
    this.leftLimit = CONFIG.canvasPadding;
    this.rightLimit = canvas.width - CONFIG.canvasPadding - this.width;
  },
  draw: function(context) {
    var plane = this;
    context.drawImage(images['planeIcon'], plane.x, plane.y, plane.width, plane.height);
  },
  move: function(direction) {
    var x;
    if (direction === 'right') {
      x = this.x + this.step;
      if (x > this.rightLimit) return;
      this.x = x;
    } else {
      x = this.x - this.step;
      if (x < this.leftLimit) return;
      this.x = x;
    }
  }
}

// 飞机移动 发射子弹 keydown 事件
var pressKeys = {};
var planeMoveAnimateId;
onkeydown = function(e){
  if (GAME.status !== 'playing') return;
  var key = e.keyCode;
  if (key !== 37 && key !== 32 && key !== 39) return;
  pressKeys[key] = true;
  if (!planeMoveAnimateId && (key === 37 || key === 39)) {
    planeMoveAnimateId = requestAnimationFrame(planeMoveAnimate);
  }
  if (pressKeys[32]) {
    var bullet = new Bullet({x: plane.x + (plane.width / 2), y: plane.y});
    bullets.push(bullet);
  }
}
function planeMoveAnimate() {
  if (pressKeys[37]) {
    plane.move('left');
  }
  if (pressKeys[39]) {
    plane.move('right');
  }
  planeMoveAnimateId = requestAnimationFrame(planeMoveAnimate);
}

onkeyup = function(e) {
  var key = e.keyCode;
  if (key !== 37 && key !== 32 && key !== 39) return;
  pressKeys[key] = false;
  if (planeMoveAnimateId && !pressKeys[37] && !pressKeys[39]) {
    cancelAnimationFrame(planeMoveAnimateId);
    planeMoveAnimateId = null;
  }
}

/**
 * 怪兽对象
 */
function Monster(options) {
  this.x = options.x;
  this.y = options.y;
  this.size = options.size;
  this.speed = options.speed;
  this.alive = true;
  this.boomTimes = 0;
}

Monster.prototype.draw = function(context) {
  var monster = this;
  if (this.alive) {
    context.drawImage(images['enemyIcon'], monster.x, monster.y, monster.size, monster.size);
  } else {
    this.boomTimes++;
    context.drawImage(images['enemyBoomIcon'], monster.x, monster.y, monster.size, monster.size);
  }
}

Monster.prototype.move = function(direction) {
  if (direction === 'right') {
    this.x += this.speed;
  } else {
    this.x -= this.speed;
  }
  if (this.x + this.speed > enemy.enemyRightLimit) {
    enemy.needDown = true;
    enemy.enemyDirection = 'left';
  }
  if (this.x - this.speed < enemy.enemyLeftLimit) {
    enemy.needDown = true;
    enemy.enemyDirection = 'right';
  }
}

Monster.prototype.down = function(context) {
  this.y += this.size;
}

Monster.prototype.crash = function() {
  this.alive = false;
}

/**
 * 怪兽军团
 */
enemy = {
  init: function(level) {
    this.numPerLine = CONFIG.numPerLine;
    this.enemyGap = CONFIG.enemyGap;
    this.enemySize = CONFIG.enemySize;
    this.enemyDirection = CONFIG.enemyDirection;
    this.enemySpeed = CONFIG.enemySpeed;
    this.needDown = false;
    this.enemyBottomLimit = canvas.height - CONFIG.canvasPadding - CONFIG.planeSize.height - CONFIG.enemySize;
    this.enemyRightLimit = canvas.width - CONFIG.canvasPadding - this.enemySize;
    this.enemyLeftLimit = CONFIG.canvasPadding;
    this.monsters = [];
    this.createMonsters(level);
  },
  createMonsters: function(level) {
    var pd = CONFIG.canvasPadding;
    for(var i=0; i<level; i++) {
      for(var j=0; j<this.numPerLine; j++) {
        var x = pd + j * (this.enemySize + this.enemyGap);
        if (this.enemyDirection === 'left') x = canvas.width - this.enemySize - x;
        this.monsters.push(new Monster({
          x: x,
          y: pd + i * this.enemySize,
          size: this.enemySize,
          speed: this.enemySpeed
        }));
      }
    }
  },
  updateMonsters: function() {
    var len = this.monsters.length;
    for(var i=len-1; i>=0; i--) {
      if (!this.monsters[i].alive && this.monsters[i].boomTimes >=3) {
        this.monsters.splice(i, 1);
        GAME.score++;
        if (GAME.score >= GAME.currentGoal) {
          GAME.succeed();
        }
      }
    }
  },
  draw: function(context) {
    var len = this.monsters.length;
    for (var i = 0; i < len; i++) {
      this.monsters[i].draw(context);
    }
  },
  move: function() {
    var direction = this.enemyDirection;
    var needDown = this.needDown;
    var monsters = this.monsters;
    var len = monsters.length;
    for (var i = 0; i < len; i++) {
      monsters[i].move(direction);
      if (needDown) {
        monsters[i].down();
      }
    }
    if (needDown) {
      this.needDown = false;
    }
    if (monsters[len-1].y > this.enemyBottomLimit) {
      GAME.fail();
    }
  }
}

/**
 * 子弹
 */
function Bullet(options) {
  this.x = options.x;
  this.y = options.y;
  this.bulletSize = CONFIG.bulletSize;
  this.bulletSpeed = CONFIG.bulletSpeed;
  this.canDelete = false;
}

Bullet.prototype.draw = function(context) {
  context.strokeStyle = 'white';
  context.beginPath();
  context.moveTo(this.x, this.y);
  context.lineTo(this.x, this.y - this.bulletSize);
  context.stroke();
}

Bullet.prototype.move = function() {
  this.y -= this.bulletSpeed;
}

Bullet.prototype.crash = function() {
  this.canDelete = true;
}

// 为bullets添加方法
bullets.draw = function(context) {
  this.forEach(function(bullet) {
    bullet.draw(context);
  })
}

bullets.update = function() {
  var self = this;
  for (var i = self.length-1; i>=0; i--) {
    if (self[i].y < 0 || self[i].canDelete) {
      self.splice(i, 1);
    }
  }
}

bullets.move = function() {
  this.forEach(function(bullet) {
    bullet.move();
  })
}

// 擦除画布函数
function clear() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

// 全局 draw 函数，调用所有画布实例的 draw 方法
function draw() {
  plane.draw(context);
  enemy.draw(context);
  bullets.draw(context);
  context.fillStyle = 'white';
  context.font = '18px arial';
  context.fillText('分数：' + GAME.score, 20, 38);
}

// 碰撞检测
function checkCrash() {
  var monsters = enemy.monsters;
  for (var i=0; i < monsters.length; i++) {
    var monster = monsters[i];
    for (var j=bullets.length-1; j>=0; j--) {
      var bullet = bullets[j];
      if (!(monster.x + monster.size < bullet.x) &&
          !(bullet.x < monster.x) &&
          !(monster.y + monster.size < (bullet.y - bullet.bulletSize)) &&
          !(bullet.y < monster.y)) {
        if (monster.alive) monster.crash();
        bullet.crash();
      }
    }
  }
}

// 全局 animate 动画函数
function animate() {
  if (GAME.status !== 'playing') return;
  clear();
  draw();
  enemy.updateMonsters();
  checkCrash();
  bullets.update();
  enemy.move();
  bullets.move();
  requestAnimationFrame(animate);
}

// 图片预加载函数
function loadImages(sources, callback){  
  var count = 0,    
      imgNum = 0;  
  for(src in sources){  
      imgNum++;  
  }  
  for(src in sources){  
      images[src] = new Image();  
      images[src].onload = function(){  
          if(++count >= imgNum){  
              callback(images);  
          }  
      }  
      images[src].src = sources[src];  
  }  
}

// 初始化
loadImages(sources, GAME.init.bind(GAME));