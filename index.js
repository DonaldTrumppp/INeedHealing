var bgmVolume = 5;


var isPaused = false;

var frameCount = 0;
var fps = 5;
var fpsInterval, startTime, now, then, elapsed;

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = 1024
canvas.height = 576
c.fillStyle = 'white'
c.fillRect(0, 0, canvas.width, canvas.height)

const bgImage = new Image()
bgImage.src = './img/MainFarm.png'

const playerImage = new Image()
playerImage.src = './img/RabbitFarming.png'

const bgSprite = new Sprite({
    position: {
        x: canvas.width / 2,
        y: canvas.height / 2,
    },
    image: bgImage,
    scale: 1,
})

var playerSprite = new PlayerClass({
    position: {
        x: canvas.width / 2,
        y: canvas.height / 2
    },
    image: playerImage,
    frames: {
        max: 2,
        hold: 1
    },
    animate: true,
    scale: 3,
})

let enemies = []

// initialize the timer variables and start the animation
function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    update();
}

function update() {
    window.requestAnimationFrame(update)

    now = Date.now();
    elapsed = now - then;

    // if enough time has elapsed, draw the next frame

    if (elapsed > fpsInterval) {
        // Get ready for next frame by setting then=now, but also adjust for your
        // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
        then = now - (elapsed % fpsInterval);

        // update the game
        if (isPaused) {
            console.log("paused")
            return;
        }

        playerSprite.weaponArr.forEach((weapon) => {
            weapon.attack(farmGridArr)
        })

        plantSeedFromDrawPile()

        // draw the BG before drawing others
        bgSprite.draw()

        playerSprite.draw()
    }
}

function plantSeedFromDrawPile(){
    if ((Date.now() - lastPlantSeed) / 1000 < plantSeedCoolDown){
        return
    }
    const tempArr = seedsArr.filter(seed => seed.isPlayed == false)
    if (tempArr.length == 0){
        seedsArr.forEach((seed)=>{
            seed.isPlayed = false
        })
        lastPlantSeed += 1 * 1000
        return
    }
    let seed;
    seedsArr.forEach((tempSeed)=>{
        if(tempSeed.isPlayed == false){
            seed = tempSeed
        }
    })

    plant = PlantSet1[seed.name]
    farmGridArr.every((farmGrid)=>{
        if (farmGrid.content != null) return true;

        plantImg = new Image()
        plantImg.src = plant[1].imgSrc,
        farmGrid.content = new Plant({
            position:{
                x: farmGrid.position.x,
                y: farmGrid.position.y - 12,
            },
            image: plantImg,
            json : plant,
            parentFarmGrid: farmGrid,
            scale: 3,
        })
        
        seed.isPlayed = true
        lastPlantSeed = Date.now()
        return false
    })
}

function addSeedToDeck(seedName){
    seed = new Seed({
        name : seedName,
        imgSrc : SeedSet1[seedName].imgSrc,
        description : SeedSet1[seedName].description,
    })
    seedsArr.push(seed)
}

function updateSeedDrawPileDisplay(){
    pauseTheGame()
    seedGrid = document.querySelector('#seedGrid')
    seedGrid.style.display = "grid"


    while (seedGrid.firstChild) {
        seedGrid.removeChild(seedGrid.firstChild);
    }

    tempArr = seedsArr.sort((a,b) => (a.name < b.name) ? 1 : ((b.name < a.name) ? -1 : 0))

    for (let i = 0; i < tempArr.length; i++) {
        const seed = tempArr[tempArr.length - i - 1 ];
        const seedDiv = document.createElement('div')
        const seedIcon = document.createElement('img')
        const seedInfoDiv = document.createElement('div')
        const seedInfoBG = document.createElement('img')
        const seedInfoText = document.createElement('div')

        seedDiv.style = "display: grid; width: 64px; position: relative "
        seedDiv.className += "myDIV"

        seedName = seed.name
        seedIcon.src = seed.imgSrc
        seedIcon.style.width = "64px"
        seedIcon.style.height = "64px"
        seedIcon.style.margin = "0px"

        seedInfoDiv.style = "text-align: center; width: 256px; position:relative; z-index:1000;"
        seedInfoDiv.className += 'hide'

        seedInfoBG.src = "./img/seedsAndPlants/EmptySeed.png"
        seedInfoBG.style = "width: 256px; height: 256px; position: absolute; top: -64px; left: -64px"

        
        seedInfoText.innerHTML = seed.imgSrc
        if (seed.description) seedInfoText.innerHTML = seed.description
        seedInfoText.style = "position: absolute; word-wrap: break-word; top: 0px; width: 150px; left: -10px;"

        seedInfoDiv.append(seedInfoBG)
        seedInfoDiv.append(seedInfoText)

        seedDiv.append(seedIcon)
        seedDiv.append(seedInfoDiv)
        seedGrid.append(seedDiv)
    }

    closeButton = document.createElement('button')
    closeButton.style = "    position: absolute;    top: -32px;    right: -32px;    "
    closeButton.onclick = closeSeedDrawPileDisplay
    closeButtonImg = document.createElement('img')
    closeButtonImg.src = " ./img/seedsAndPlants/EmptySeed.png"
    closeButtonImg.style = "width: 64px; height: 64px; margin: 0"
    closeButton.append(closeButtonImg)

    seedGrid.append(closeButton)

}

function closeSeedDrawPileDisplay(){

    if (!isPaused) { return }

    seedDrawPileBackground = document.querySelector('#seedGrid')
    while (seedDrawPileBackground.firstChild) {
        seedDrawPileBackground.removeChild(seedDrawPileBackground.firstChild);
    }
    seedDrawPileBackground.style.display = "None"
    unPauseTheGame()

}

function initGame() {

    startAnimating(fps)
    document.querySelector('#userInterface').style.display = 'block'

    currentWeaponSet = WeaponSet1
    lastPlantSeed = Date.now()

    clearSave()
    if (playerSprite.defaultWeapon) {
        playerSprite.defaultWeapon.forEach((weapon) =>{
            addWeapon(weapon.name)
        })
    }

    loadSave()

    const contentDataArr = Object.keys(SeedSet1)
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * contentDataArr.length);
        // get random item
        const contentData = SeedSet1[contentDataArr[randomIndex]];
        addSeedToDeck(contentData.name)
    }
    
   
}

function generateWeaponSelection() {
    // TODO: randomize the weapon selection
    weaponNames = Object.keys(currentWeaponSet)
    return [currentWeaponSet.Glass]
}

function generateButtons() {
    // TODO: generate weapon selection for the level up
    // design the layout in Figma first?
    // TODO: add more weapon types

    workersNames = Object.keys(currentWeaponSet)
    levelUpBackground = document.querySelector('#levelUpBackground')
    for (let i = 0; i < workersNames.length; ++i) {
        const buttonDiv = document.createElement('div')
        const button = document.createElement('button')
        const buttonImg = document.createElement('img')
        const buttonImgDiv = document.createElement('div')

        weaponName = workersNames[i]
        weaponData = currentWeaponSet[weaponName]

        button.innerHTML = weaponData.name + "<br> damage = " +
            weaponData.damage + "<br> coolDown = " + weaponData.coolDown
        button.id = weaponName

        let owned = false
        playerSprite.weaponArr.forEach((weapon) => {
            if (weapon.name == weaponName) {
                owned = true
            }
        })
        if (owned) {
            button.innerHTML = weaponData.name + "<br> Weapon Damage *= " + weaponData.levelUpEffect.damage +
                "<br> Weapon Projectile += " + weaponData.levelUpEffect.projectile
            button.addEventListener('click', () => {
                levelUpWeapon(button.id)
            })
        }
        else {
            button.addEventListener('click', () => {
                addWeapon(button.id)
            })
        }

        buttonImgDiv.className = "grid-cols-1"
        buttonImgDiv.append(buttonImg)

        buttonImg.className = "block m-auto"
        buttonImg.src = weaponData.imgSrc
        buttonImg.style.width = "50px"
        buttonImg.style.height = "50px"

        button.className = "product"
        buttonDiv.className = "buttonDiv"

        buttonDiv.append(buttonImgDiv)
        buttonDiv.append(button)
        levelUpBackground.append(buttonDiv)
    }
    levelUpBackground.style.display = "block"
    pauseTheGame()
}

function pauseTheGame(){
    isPaused = true
    projectileArr.forEach((projectile)=>{
        projectile.projectileAnim.pause()
    })
    writeSave()
}

function unPauseTheGame(){
    isPaused = false
    projectileArr.forEach((projectile)=>{
        projectile.projectileAnim.resume()
    })
}

function addWeapon(weaponName) {
    audio.click.play()

    weaponData = currentWeaponSet[weaponName]
    const weaponImg = new Image();
    weaponImg.src = weaponData.imgSrc
    weapon = new Weapon({
        position: {
            x: playerSprite.position.x,
            y: playerSprite.position.y
        },
        image: weaponImg,
        frames: {
            max: 1,
            hold: 1
        },
        animate: true,
        scale: 5,
        damage: weaponData.damage,
        coolDown: weaponData.coolDown,
        name: weaponData.name,
        levelUpEffect: weaponData.levelUpEffect,
    })

    playerSprite.weaponArr.push(weapon)

    closeLevelUpMenu()
}

function levelUpWeapon(weaponName) {
    let weapon
    playerSprite.weaponArr.forEach((el) => {
        if (el.name == weaponName) {
            weapon = el
        }
    })
    weapon.level += 1
    weapon.damage *= weapon.levelUpEffect.damage
    weapon.numOfProjectile += weapon.levelUpEffect.projectile
    closeLevelUpMenu()
}

function closeLevelUpMenu() {
    updateWeaponDisplay()
    const expCountUI = document.querySelector("#expText")
    expCountUI.innerHTML = Math.round(playerSprite.currentExp).toString() + " / " +
        Math.round(playerSprite.requiredExp) + "      level: " + playerSprite.level

    if (!isPaused) { return }
    

    levelUpBackground = document.querySelector('#levelUpBackground')
    while (levelUpBackground.firstChild) {
        levelUpBackground.removeChild(levelUpBackground.firstChild);
    }

    if (playerSprite.currentExp > playerSprite.requiredExp){
        playerSprite.levelUP()
        return
    }
    unPauseTheGame()
    playerSprite.levelingUp = false
    levelUpBackground.style.display = "None"
}

function updateWeaponDisplay() {
    weaponGrid = document.querySelector('#weaponGrid')

    while (weaponGrid.firstChild) {
        weaponGrid.removeChild(weaponGrid.firstChild);
    }

    playerSprite.weaponArr.forEach((weapon) => {
        const weaponDiv = document.createElement('div')
        const weaponIcon = document.createElement('img')
        const weaponInfoDiv = document.createElement('div')

        weaponDiv.style = "display: grid; width: 32px"

        weaponName = weapon.name
        weaponIcon.src = currentWeaponSet[weaponName].imgSrc
        weaponIcon.style.width = "32px"
        weaponIcon.style.height = "32px"
        weaponIcon.style.margin = "0px"

        weaponInfoDiv.innerHTML = weapon.level
        weaponInfoDiv.style.textAlign = "center"

        weaponDiv.append(weaponIcon)
        weaponDiv.append(weaponInfoDiv)
        weaponGrid.append(weaponDiv)
    })
}

function writeSave() {
    // TODO: write save file with current weapon, relics and levels
    if (!storageAvailable('localStorage')) {
        console.log("LocalStorage unavailable!")
        return
    }
    localStorage["weaponArr"] = JSON.stringify(playerSprite.weaponArr);

    playerExp = [playerSprite.level, playerSprite.currentExp, playerSprite.requiredExp,]
    localStorage["playerCurrentExp"] = JSON.stringify(playerExp);

}

function loadSave() {
    bgmVolume = localStorage.getItem("bgmVolume")

    if (!localStorage.weaponArr) { return }

    while (playerSprite.weaponArr.length > 0) {
        playerSprite.weaponArr.pop()
    }


    storedJson = JSON.parse(localStorage.weaponArr)

    storedJson.forEach((weapon) => {
        const weaponImg = new Image();
        weaponImg.src = currentWeaponSet[weapon.name].imgSrc
        weapon = new Weapon({
            position: {
                x: playerSprite.position.x,
                y: playerSprite.position.y
            },
            image: weaponImg,
            frames: {
                max: 1,
                hold: 1
            },
            animate: true,
            scale: 5,
            damage: weapon.damage,
            coolDown: weapon.coolDown,
            name: weapon.name,
            levelUpEffect: weapon.levelUpEffect,
            level: weapon.level,
            numOfProjectile: weapon.numOfProjectile,
        })
        playerSprite.weaponArr.push(weapon)
    })
    const playerExp = JSON.parse(localStorage.playerCurrentExp)
    playerSprite.level = playerExp[0]
    playerSprite.currentExp = playerExp[1]
    playerSprite.requiredExp = playerExp[2]

    updateWeaponDisplay()
}

function clearSave() {
    localStorage.clear()
}

function spawnOneEnemy({ enemy, position }) {
    img = new Image()
    img.src = enemy.imgSrc
    const newEnemy = new Enemy({
        position: {
            x: position.x,
            y: position.y
        },
        image: img,
        frames: {
            max: 1,
            hold: 1
        },
        animate: true,
        scale: 5,
        ms: 5,
        maxHP: enemy.maxHP,
        expDrop: enemy.expDrop,
    })
    enemies.push(newEnemy)
    moveables = [
        bgSprite,
        ...enemies,
    ]
}

function changeToSettingsPage() {
    writeSave()
    location.href = './settingsPage.html';
}

// start playing BGM once the user clicked
let clicked = false
addEventListener('click', () => {
    if (!clicked) {
        bgm = audio.letterIris

        if (bgmVolume == undefined) {
            bgmVolume = 5
        }
        bgm.volume(bgmVolume / 100)

        // TODO: fix the audio stopping issue when switching between pages
        // bgm.play()

        clicked = true
    }
})

let lastKey = ''
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = true
            lastKey = 'w'
            break
        case 'a':
            keys.a.pressed = true
            lastKey = 'a'
            break

        case 's':
            keys.s.pressed = true
            lastKey = 's'
            break

        case 'd':
            keys.d.pressed = true
            lastKey = 'd'
            break
    }
})

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
        case 'd':
            keys.d.pressed = false
            break
    }
})


initGame()