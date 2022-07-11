class Sprite {
    constructor({
      position,
      image,
      frames = { max: 1, hold: 10 },
      sprites,
      animate = false,
      rotation = 0,
      scale = 1
    }) {
      this.position = position
      this.image = new Image()
      this.frames = { ...frames, val: 0, elapsed: 0 }
      this.image.onload = () => {
        this.width = (this.image.width / this.frames.max) * scale
        this.height = this.image.height * scale
      }
      this.image.src = image.src
  
      this.animate = animate
      this.sprites = sprites
      this.opacity = 1
  
      this.rotation = rotation
      this.scale = scale
      this.projectileAnim = null
    }
  
    draw() {
      c.save()
      c.translate(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2
      )
      c.rotate(this.rotation)
      c.translate(
        -this.position.x - this.width / 2,
        -this.position.y - this.height / 2
      )
      c.globalAlpha = this.opacity
  
      const crop = {
        position: {
          x: this.frames.val * (this.width / this.scale),
          y: 0
        },
        width: this.image.width / this.frames.max,
        height: this.image.height
      }
  
      const image = {
        position: {
          x: this.position.x,
          y: this.position.y
        },
        width: this.image.width / this.frames.max,
        height: this.image.height
      }
  
      c.drawImage(
        this.image,
        crop.position.x,
        crop.position.y,
        crop.width,
        crop.height,
        image.position.x - image.width / 2 * this.scale,
        image.position.y - image.height / 2 * this.scale,
        image.width * this.scale,
        image.height * this.scale
      )
  
      c.restore()
        
      if (!this.animate) return
  
      if (this.frames.max > 1) {
        this.frames.elapsed++
      }
  
      if (this.frames.elapsed % this.frames.hold === 0) {
        if (this.frames.val < this.frames.max - 1) this.frames.val++
        else this.frames.val = 0
      }
    }
  }

class Enemy extends Sprite{
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    name,
    scale,
    ms,
    maxHP = 100,
    expDrop = 15,
  })
  {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale,
    })
    this.health = 100
    this.name = name
    this.ms = ms
    this.maxHP = maxHP
    this.currentHP = maxHP
    this.expDrop = expDrop
    this.pendingDamage = 0
    this.willBeDead = false
  }

  takeDamage(dmg){
    if (this.currentHP <= 0){
      return
    }
    this.currentHP -= dmg
    if (this.currentHP <= 0){
      this.die()
    }
    //TODO: updateGraphic, hit soundtrack and VFX 
  
  }

  die(){
    playerSprite.gainExp(this.expDrop)
    //TODO: updateGraphic
  }
}

class Weapon extends Sprite{
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    name,
    scale,
    ms,
    coolDown = 1,
    damage = 50,
    level = 0,
    numOfProjectile = 1,
    levelUpEffect,
  })
  {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale,
    })
    this.health = 100
    this.name = name
    this.ms = ms
    this.coolDown = coolDown
    this.lastHarvest = Date.now();
    this.damage = damage
    this.level = level
    this.levelUpEffect = levelUpEffect
    this.numOfProjectile = numOfProjectile
  }

  // TODO: add attack animation and SFX
  attack(farmGridArr){
    if ((Date.now() - this.lastHarvest) / 1000 < this.coolDown){
      return
    }
    
    let tempEnemiesArr = [] // [[enemy, dist] [enemy, dist]]

    for (let i = 0; i < farmGridArr.length; i++){
      if (!farmGridArr[i].content){ continue}
      let enemy = farmGridArr[i].content

      if (enemy.willBeDead)
      {
        continue
      }

      let dist = (enemy.position.x - this.position.x) ** 2 + (enemy.position.y - this.position.y) ** 2
      if (enemy.json.targetType == this.name){
        tempEnemiesArr.push([enemy, dist])
      }

    }

    tempEnemiesArr.sort((function (index) {
      return function (a, b) {
        return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
      };
    })(1)); // 1 is the index
    
    // sortedArray: start with the closet enemy
    const targetEnemiesArray = tempEnemiesArr.slice(0, this.numOfProjectile);

    // create projectile, deal damage when arrived, increase eneny.pendingDmg to avoid overkill
    for(let i = 0; i < targetEnemiesArray.length; i++){
      let targetEnemy = targetEnemiesArray[i][0]
      const projectileImg = new Image()
      projectileImg.src = this.image.src
      const projectile = new Sprite({
        position: {
          x: this.position.x,
          y: this.position.y,
        },
        image: projectileImg,
        scale : 2,
      })

      projectile.projectileAnim = gsap.to(projectile.position, {
        x: targetEnemy.position.x,
        y: targetEnemy.position.y,
        duration: 1,
        onComplete: () => {
          projectile.position.x = -1000
          targetEnemy.takeDamage(this.damage)
        }
      })
      projectileArr.push(projectile)

      targetEnemy.pendingDamage += this.damage

      if(parseInt(targetEnemy.pendingDamage) >= parseInt(targetEnemy.currentHP)){
        targetEnemy.willBeDead = true
      }

      
      // farmGridArr.splice(i, 1)
      this.lastHarvest = Date.now()
    }

  }
}

class PlayerClass extends Sprite{
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    name,
    scale,
    ms,

    weaponArr = []
  })
  {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale,
    })
    this.health = 100
    this.name = name
    this.ms = ms
    this.level = 0
    this.levelingUp = false
    this.currentExp = 0
    this.requiredExp = 50,

    this.weaponArr = weaponArr
    this.defaultWeapon = [WeaponSet1.WateringCan, WeaponSet1.Axe]

  }

  gainExp (expAmount){
    this.currentExp += expAmount
    if (this.currentExp > this.requiredExp)
    {
      if (!this.levelingUp) this.levelUP();
    }
    gsap.to('#playerHealth', {
      width: Math.min(playerSprite.currentExp / playerSprite.requiredExp * 100, 100) + '%'
    })
    const expCountUI = document.querySelector("#expText")
    expCountUI.innerHTML = Math.round(playerSprite.currentExp).toString() + " / " +
        Math.round(playerSprite.requiredExp) + "      level: " + playerSprite.level
  }

  levelUP(){
    this.levelingUp = true
    this.level ++
    this.currentExp -= this.requiredExp
    this.requiredExp *= 1.2
    generateButtons()
  }
}

class FarmGrid extends Sprite{
  constructor({
    position,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    name,
    scale,
    content = null,
  })
  {
    super({
      position,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale,
    })
    this.name = name
    this.content = content
  }
}

class Plant extends Sprite{
  constructor({
    position,
    image,
    frames = { max: 1, hold: 10 },
    scale,
    json,
    parentFarmGrid,
  })
  {
    super({
      position,
      image,
      frames,
      scale,
    })
    this.json = json
    this.name = json.name
    this.level = 1
    this.maxLevel = json.maxLevel
    this.parentFarmGrid = parentFarmGrid

    this.maxHp = json.maxHP
    this.currentHP = this.maxHp
    this.expDrop = json.expDrop
    this.pendingDamage = 0
    this.willBeDead = false
  }
  takeDamage(dmg){
    if (this.currentHP <= 0){
      return
    }
    this.currentHP -= dmg
    this.pendingDamage -= dmg
    if (this.currentHP <= 0){
      this.die()
    }

    //TODO: updateGraphic, hit soundtrack and VFX 
  
  }

  die(){
    if (this.level < this.maxLevel)
    {
      this.level += 1
      
      this.image.src = this.json[this.level]["imgSrc"]
      this.currentHP = this.maxHp
      this.pendingDamage = 0
      this.willBeDead = false
    }
    else{
      
      const projectileImg = new Image()
      projectileImg.src =  this.json["itemDrop"]["imgSrc"]
      const projectile = new Sprite({
        position: {
          x: this.position.x,
          y: this.position.y,
        },
        image: projectileImg,
        scale : 2,
      })

      projectile.projectileAnim = gsap.to(projectile.position, {
        x: playerSprite.position.x,
        y: playerSprite.position.y,
        duration: 3,
        onComplete: () => {
          this.position.x = -1000
          playerSprite.gainExp(this.expDrop)
        }
      })

      projectileArr.push(projectile)

      
      this.parentFarmGrid.content = null
    }
    
    
    //TODO: updateGraphic
  }
}

class Seed{
  constructor({
    name,
    imgSrc,
    description,
  })
  {
    this.name = name
    this.imgSrc = imgSrc
    this.isPlayed = false
    this.description = description
  }
}