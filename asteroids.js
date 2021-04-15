"use strict";

//função auxiliar

function Remap(x, in_min, in_max, out_min, out_max)// função que remapea um valor em uma escala, em outra escala
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
             
function gira(poligono, teta, escala){
    poligono.forEach((ponto) => {// rotaciona os pontos em relação a origem
        let xt = ponto.x;
        let yt = ponto.y;
        ponto.x = (((Math.sin(teta*Math.PI / 180))*yt)+((Math.cos(teta*Math.PI / 180))*xt))*escala;
        ponto.y = (((-Math.sin(teta*Math.PI / 180))*xt)+((Math.cos(teta*Math.PI / 180))*yt))*escala;
      
    });
}
//------------------------------------------------
// variaveis globais
let fps = 60; // velocidade de execução padrão
if(window.navigator.userAgent.indexOf('Firefox') > -1){
    fps = 120;
}// por algum motivo no meu "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0"
// o jogo estava rodando lento, então dobrando a velocidade de execução ele roda bem

const gOri = 4; // ganho no ângulo de orientação
const gainP = 4; // ganho na velocidade
const bMin = -30; // offset da borda minima do canvas
const bMax = 30; // offset da borda maxima do canvas

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth-10; // tamanho horizintal do canvas ||eu tive que colocar esse '-10' como um offset, pois aqui estava
canvas.height = window.innerHeight-10; // tamanho vertical do canvas ||craindo um canvas maior que a janela do navegador

let projeteis = []; // array de armazenamento dos projeteis
const lmt = 4; // limite de "tempo de vida" de um projetil

let asteroids = []; // array de armazenamento dos asteroids
let naves = []; // array de armazenamento dos players

let score = 0;
let vidas = 3; // número de vidas do player
let nA = 4; // número de asteroids a serem criados a cada rodada
let z = false; // variável auxiliar para criar os asteroids a cada rodada
let ss = true; // variável auxiliar para chamar só uma vez o setTimeout de inicialização do saucer

//-------------------------------------------------
//classes 

class Player {
    constructor (x, y, ori) {
        this.x = x; // coordenada x do player
        this.y = y; // coordenada y do player
        
        this.ori = ori; // angulo em graus° de orientação do player
        this.nave = [ // pontos para desenhar a nave
            {x:0,y:0},
            {x:-19,y:-20},
            {x:1,y:45},
            {x:21,y:-20}
        ]  // a detecção de colisão da nave é feita a partir de três circulos, um no topo, um no centro e um na base
        this.box =[ // centro e raio dos circulos de colisão da nave
            {x:1.21,y:32.56,raio:3.81}, // top
            {x:1.16,y:20.63,raio:7.58}, // middle
            {x:0.93,y:-0.29,raio:13.38} // bottom
        ]
        gira(this.nave,this.ori,1);
        gira(this.box,this.ori,1);  
    }

    draw(){
        c.beginPath();
        c.lineTo(this.nave[0].x+this.x,this.nave[0].y+this.y);
        c.lineTo(this.nave[1].x+this.x,this.nave[1].y+this.y);
        c.lineTo(this.nave[2].x+this.x,this.nave[2].y+this.y);
        c.lineTo(this.nave[3].x+this.x,this.nave[3].y+this.y);
        c.strokeStyle = 'white';
        c.stroke();
    }

    moveHorario(){
        this.ori -= gOri;
        if(this.ori <= 0)
        {
            this.ori += 360;
        }
        gira(this.nave,-gOri,1);
        gira(this.box,-gOri,1);
    }
    moveAntHorario(){
        this.ori += gOri;
        if(this.ori >= 360)
        {
            this.ori -= 360;
        }
        gira(this.nave,gOri,1);
        gira(this.box,gOri,1);
    }
    moveFrente(){ // o desenho está em 90° em relação com a origem, então tive que adaptar a relação de navegação pelos quadrantes
        this.x -= (Math.cos((this.ori+90)*Math.PI / 180)*gainP);
        this.y += (Math.sin((this.ori+90)*Math.PI / 180)*gainP);
        // faz o player atravessar a tela
        if(this.x < bMin){
            this.x = canvas.width+bMax;
        }else if(this.x > canvas.width+bMax){
            this.x = bMin;
        }
        if(this.y < bMin){
            this.y = canvas.height+bMax;
        }else if(this.y > canvas.height+bMax){
            this.y = bMin;
        }
    }
}

class Projetil {
    constructor(x, y, ori){
        this.x = x;
        this.y = y;
        this.ori = ori;
        this.limite = 0;
    }

    draw(){

        c.rect(this.x, this.y, 1, 1);
        c.strokeStyle = 'white';
        c.stroke();

    }

    update(){
        this.draw();
        this.x += (Math.cos((this.ori+270)*Math.PI / 180)*(gainP+2));
        this.y -= (Math.sin((this.ori+270)*Math.PI / 180)*(gainP+2));

        // faz o projetil atravessar a tela
        if(this.x < bMin){
            this.x = canvas.width+bMax;
        }else if(this.x > canvas.width+bMax){
            this.x = bMin;
        }
        if(this.y < bMin){
            this.y = canvas.height+bMax;
        }else if(this.y > canvas.height+bMax){
            this.y = bMin;
        }

        this.limite += 0.05;
    }
}

class Asteroids{
    constructor(x, y, ori, escala){
        this.x = x;
        this.y = y;
        this.ori = ori;
        this.escala = escala; // escala com tamanho igual a 1, são asteroids normais, escala com tamanho igual a 0.65 são as teroids de impacto
        this.raio = 30;
        this.left = {x:-12.77,y:0,raio:4.43} // centro e raio dos circulos de colisão da nave
        this.middle = {x:0,y:-2.35,raio:10.23}
        this.right = {x:13.49,y:30,raio:3.94}
    }

    update(){
        this.draw();
        this.x -= (Math.cos((this.ori+90)*Math.PI / 180)*(gainP-1.5));
        this.y += (Math.sin((this.ori+90)*Math.PI / 180)*(gainP-1.5));

        // faz o asteroid atravessar a tela
        if(this.x < bMin){
            this.x = canvas.width+bMax;
        }else if(this.x > canvas.width+bMax){
            this.x = bMin;
        }
        if(this.y < bMin){
            this.y = canvas.height+bMax;
        }else if(this.y > canvas.height+bMax){
            this.y = bMin;
        }
    }
}

class Saucer{
    constructor(x,y,escala){
        this.x = x;
        this.y = y;
        this.escala = escala;
        this.emTela = false;
        this.desce = -99; // valor de x onde o saucer deverá começar a descer
        this.bottom = -99; // valor de y até a onde o saucer deve descer
        this.saucer = [
            {x:5,y:-10},
            {x:10,y:-5},
            {x:-10,y:-5},
            {x:-5,y:-10},
            {x:20,y:0},
            {x:-20,y:0},
            {x:10,y:5},
            {x:-10,y:5}
        ]
        this.box = [ // contém as informações dos circulos de colisão
            {x:-12.77,y:0,raio:4.43},
            {x:0,y:-2.35,raio:10.23},
            {x:13.49,y:0,raio:3.49}
        ]
        this.disparos = []; // o mesmo que projeteis, porém, para não dar conflito de nomes
    }
    draw(){
        c.beginPath();
        c.lineTo(this.saucer[0].x+this.x,this.saucer[0].y+this.y);
        c.lineTo(this.saucer[1].x+this.x,this.saucer[1].y+this.y);
        c.lineTo(this.saucer[2].x+this.x,this.saucer[2].y+this.y);
        c.lineTo(this.saucer[3].x+this.x,this.saucer[3].y+this.y);
        c.closePath();
        c.strokeStyle = 'white';
        c.stroke();

        c.beginPath();
        c.lineTo(this.saucer[1].x+this.x,this.saucer[1].y+this.y);
        c.lineTo(this.saucer[4].x+this.x,this.saucer[4].y+this.y);
        c.lineTo(this.saucer[5].x+this.x,this.saucer[5].y+this.y);
        c.lineTo(this.saucer[2].x+this.x,this.saucer[2].y+this.y);
        c.strokeStyle = 'white';
        c.stroke();

        c.beginPath();
        c.lineTo(this.saucer[4].x+this.x,this.saucer[4].y+this.y);
        c.lineTo(this.saucer[6].x+this.x,this.saucer[6].y+this.y);
        c.lineTo(this.saucer[7].x+this.x,this.saucer[7].y+this.y);
        c.lineTo(this.saucer[5].x+this.x,this.saucer[5].y+this.y);
        c.strokeStyle = 'white';
        c.stroke();
    }
    update()
    {
        this.draw();
        if(this.x <= canvas.width+bMax){
        this.x += gainP-2;
        }else{
            this.emTela = false;
        }
        if(this.desce <= this.x && this.y < this.bottom){
            this.y += gainP-2;
        }
    }
    iniciaMovimento(){ // posiciona e faz o sauce fazer seu caminho
        if(this.emTela) return;
        this.x = bMin;
        this.y = Math.floor(Math.random() * (canvas.height/3))+70;
        this.desce = Math.floor(Math.random() * (canvas.width/2));
        this.bottom = this.y+canvas.height*0.3;
        this.emTela = true;
        ss = true;
    }
    disparar(){
        this.disparos.push(new Projetil(this.x,this.y+5,Math.floor(Math.random() * 360)))
    }
}

//-----------------------------------------------------------
// Funções do jogo

function criaAsteroids(aX,aY,escala) {
    z = false;
    if(escala == 1){
        do{
            aX = Math.floor(Math.random() * canvas.width);
            aY = Math.floor(Math.random() * canvas.height);
        }while(Math.hypot(aX - player.x, aY - player.y) < 300)
    }
    asteroids.push(
        new Asteroids(aX, aY, Math.floor(Math.random() * 360), escala)
    );
    switch(Math.floor(Math.random() * 3)){ // seleciona qual dos três tipos de asteroids será desenhado
        case 0:
            asteroids[asteroids.length-1].asteroid = [// coordenadas dos pontos que determinam a figura
                {x:35,y:-17},
                {x:35,y:7.5},
                {x:15,y:12.5},
                {x:-5,y:27.5},
                {x:-35,y:12.5},
                {x:-30,y:-17.5},
                {x:5,y:-27.5}
              ]
            asteroids[asteroids.length-1].draw = function() { // função de desenho do asteroid em questão
                c.beginPath();
                c.lineTo(this.asteroid[0].x+this.x,this.asteroid[0].y+this.y);
                c.lineTo(this.asteroid[1].x+this.x,this.asteroid[1].y+this.y);
                c.lineTo(this.asteroid[2].x+this.x,this.asteroid[2].y+this.y);
                c.lineTo(this.asteroid[3].x+this.x,this.asteroid[3].y+this.y);
                c.lineTo(this.asteroid[4].x+this.x,this.asteroid[4].y+this.y);
                c.lineTo(this.asteroid[5].x+this.x,this.asteroid[5].y+this.y);
                c.lineTo(this.asteroid[6].x+this.x,this.asteroid[6].y+this.y);
                c.closePath();
                c.strokeStyle = 'white';
                c.stroke();
            }
            gira(asteroids[asteroids.length-1].asteroid, asteroids[asteroids.length-1].ori, asteroids[asteroids.length-1].escala);
            break;
        case 1:
            asteroids[asteroids.length-1].asteroid = [// coordenadas dos pontos que determinam a figura
                {x:35,y:-12.5},
                {x:15,y:22.5},
                {x:-25,y:27.5},
                {x:-35,y:-7.5},
                {x:-5,y:-27.5},
                {x:0,y:-2.5}
            ]
            asteroids[asteroids.length-1].draw = function() {// função de desenho do asteroid em questão
                c.beginPath();
                c.lineTo(this.asteroid[0].x+this.x,this.asteroid[0].y+this.y);
                c.lineTo(this.asteroid[1].x+this.x,this.asteroid[1].y+this.y);
                c.lineTo(this.asteroid[2].x+this.x,this.asteroid[2].y+this.y);
                c.lineTo(this.asteroid[3].x+this.x,this.asteroid[3].y+this.y);
                c.lineTo(this.asteroid[4].x+this.x,this.asteroid[4].y+this.y);
                c.lineTo(this.asteroid[5].x+this.x,this.asteroid[5].y+this.y);
                c.closePath();
                c.strokeStyle = 'white';
                c.stroke();
            }
            gira(asteroids[asteroids.length-1].asteroid, asteroids[asteroids.length-1].ori, asteroids[asteroids.length-1].escala);
            break;
        default:
            asteroids[asteroids.length-1].asteroid = [// coordenadas dos pontos que determinam a figura
                {x:35,y:-7.5},
                {x:15,y:27.5},
                {x:-20,y:19.5},
                {x:-35,y:-7.5},
                {x:-30,y:-27.5},
                {x:5,y:-25.5}
              ]
            asteroids[asteroids.length-1].draw = function(){// função de desenho do asteroid em questão
                c.beginPath();
                c.lineTo(this.asteroid[0].x+this.x,this.asteroid[0].y+this.y);
                c.lineTo(this.asteroid[1].x+this.x,this.asteroid[1].y+this.y);
                c.lineTo(this.asteroid[2].x+this.x,this.asteroid[2].y+this.y);
                c.lineTo(this.asteroid[3].x+this.x,this.asteroid[3].y+this.y);
                c.lineTo(this.asteroid[4].x+this.x,this.asteroid[4].y+this.y);
                c.lineTo(this.asteroid[5].x+this.x,this.asteroid[5].y+this.y);
                c.closePath();
                c.strokeStyle = 'white';
                c.stroke();
            }
            gira(asteroids[asteroids.length-1].asteroid, asteroids[asteroids.length-1].ori, asteroids[asteroids.length-1].escala);
            break;
    }
}

function animate() {
    projeteis.forEach((projetil, index) => {
        projetil.update();
        if(projetil.limite >= lmt)
        {
            projeteis.splice(index, 1); // remove os projeteis após tempo limite
        }
        
    });
    asteroids.forEach((aster, index) => {
        aster.update();
        projeteis.forEach((projetil, pIndex) =>{ // colisão entre projeteis do player e os asteroids
            let dx = projetil.x - aster.x;
            let dy = projetil.y - aster.y;
            let distancia = Math.sqrt(dx * dx + dy * dy);
            if(distancia < (aster.raio*aster.escala))
            {
                score +=10;
                setTimeout(() => {
                    asteroids.splice(index,1);
                    projeteis.splice(pIndex,1);
                }, 0);
                if(aster.escala == 1){
                    setTimeout(() => {
                        criaAsteroids(aster.x,aster.y,0.65);
                        criaAsteroids(aster.x,aster.y,0.65);
                    }, 10);
                }
            }
        });
        // detectar colisão dos asteroids com o player
        let tdx = player.x+player.box[0].x - aster.x;
        let tdy = player.y+player.box[0].y - aster.y;
        let tdistancia = Math.sqrt(tdx * tdx + tdy * tdy);
        let mdx = player.x+player.box[1].x - aster.x;
        let mdy = player.y+player.box[1].y - aster.y;
        let mdistancia = Math.sqrt(mdx * mdx + mdy * mdy);
        let bdx = player.x+player.box[2].x - aster.x;
        let bdy = player.y+player.box[2].y - aster.y;
        let bdistancia = Math.sqrt(bdx * bdx + bdy * bdy);
        if(tdistancia < player.box[0].raio+(aster.raio*aster.escala) || mdistancia < player.box[1].raio+(aster.raio*aster.escala) || bdistancia < player.box[2].raio+(aster.raio*aster.escala))
        {
           vidas -= 1;
           player = new Player(canvas.width/2, canvas.height-(canvas.height*0.3), 180);
            setTimeout(() => {
                asteroids.splice(index,1);
            }, 0);
            if(aster.escala == 1){
                setTimeout(() => {
                    criaAsteroids(aster.x,aster.y,0.65);
                    criaAsteroids(aster.x,aster.y,0.65);
                }, 10);
            }
        }
    });
    saucer.disparos.forEach((projetil, pIndex) => { // exibe os projeteis do saucer
        projetil.update();
        if(projetil.limite >= lmt)
        {
            saucer.disparos.splice(pIndex, 1); // remove os projeteis após tempo limite
        }
        asteroids.forEach((aster, index) => {// colisão entre projeteis do saucer e os asteroids
            let dx = projetil.x - aster.x;
            let dy = projetil.y - aster.y;
            let distancia = Math.sqrt(dx * dx + dy * dy);
            if(distancia < (aster.raio*aster.escala))
            {
                setTimeout(() => {
                    asteroids.splice(index,1);
                    saucer.disparos.splice(pIndex,1);
                }, 0);
                if(aster.escala == 1){
                    setTimeout(() => {
                        criaAsteroids(aster.x,aster.y,0.65);
                        criaAsteroids(aster.x,aster.y,0.65);
                    }, 10);
                }
            }
        });
        player.box.forEach((box) =>{ // colisão do saucer com o player
            for(let i=0;i<3;i++)
            {
                let dx = box.x+player.x - projetil.x;
                let dy = box.y+player.y - projetil.y;
                let distancia = Math.sqrt(dx * dx + dy * dy);
                if(distancia < box.raio)
                {
                    saucer.emTela = false;
                    vidas -= 1;
                    player = new Player(canvas.width/2, canvas.height-(canvas.height*0.3), 180);
                }
            }
        });
    });
    if(saucer.emTela){
        saucer.update();
        asteroids.forEach((aster, index) => { //colisão do saucer com asteroids
        let ldx = saucer.x+saucer.box[0].x - aster.x;
        let ldy = saucer.y+saucer.box[0].y - aster.y;
        let ldistancia = Math.sqrt(ldx * ldx + ldy * ldy);
        let mdx = saucer.x+saucer.box[1].x - aster.x;
        let mdy = saucer.y+saucer.box[1].y - aster.y;
        let mdistancia = Math.sqrt(mdx * mdx + mdy * mdy);
        let rdx = saucer.x+saucer.box[2].x - aster.x;
        let rdy = saucer.y+saucer.box[2].y - aster.y;
        let rdistancia = Math.sqrt(rdx * rdx + rdy * rdy);
        if(ldistancia < saucer.box[0].raio+(aster.raio*aster.escala) || mdistancia < saucer.box[1].raio+(aster.raio*aster.escala) || rdistancia < saucer.box[2].raio+(aster.raio*aster.escala))
        {
            setTimeout(() => {
                asteroids.splice(index,1);
            }, 0);
            if(aster.escala == 1){
                setTimeout(() => {
                    criaAsteroids(aster.x,aster.y,0.65);
                    criaAsteroids(aster.x,aster.y,0.65);
                }, 10);
            }
            saucer.emTela = false;
        }
        });
        player.box.forEach((box) =>{ // colisão do saucer com o player
            for(let i=0;i<3;i++)
            {
                let dx = box.x+player.x - (saucer.x+saucer.box[i].x);
                let dy = box.y+player.y - (saucer.y+saucer.box[i].y);
                let distancia = Math.sqrt(dx * dx + dy * dy);
                if(distancia < saucer.box[i].raio+box.raio)
                {
                    saucer.emTela = false;
                    vidas -= 1;
                    player = new Player(canvas.width/2, canvas.height-(canvas.height*0.3), 180);
                }
            }
        });
        
        projeteis.forEach((projetil, index) => { // colisão entre os projeteis do player e o saucer
            let ldx = saucer.x+saucer.box[0].x - projetil.x;
            let ldy = saucer.y+saucer.box[0].y - projetil.y;
            let ldistancia = Math.sqrt(ldx * ldx + ldy * ldy);
            let mdx = saucer.x+saucer.box[1].x - projetil.x;
            let mdy = saucer.y+saucer.box[1].y - projetil.y;
            let mdistancia = Math.sqrt(mdx * mdx + mdy * mdy);
            let rdx = saucer.x+saucer.box[2].x - projetil.x;
            let rdy = saucer.y+saucer.box[2].y - projetil.y;
            let rdistancia = Math.sqrt(rdx * rdx + rdy * rdy);
            if(ldistancia < saucer.box[0].raio || mdistancia < saucer.box[1].raio || rdistancia < saucer.box[2].raio)
            {      
                score += 15;
                saucer.emTela = false;
                setTimeout(() => {
                    projeteis.splice(index,1);
                }, 0);
            }      
        });
    }else{
        if(ss){
            setTimeout(() => {
            
                console.log("oi");
                saucer.iniciaMovimento();
            
            }, (Math.random()*3000)+10000);
            ss = false;
        }
    }
}

function acoes() {

    if (controller.ArrowLeft) {
        player.moveAntHorario();
       // controller.ArrowLeft = false;
    } else if (controller.ArrowRight) {
        player.moveHorario();
        //controller.ArrowRight = false;
    }
    if (controller.ArrowUp) {
        player.moveFrente();
        //controller.ArrowUp = false;
    }
    if (controller.c){

        if(projeteis.length < 5){
            projeteis.push(
                new Projetil(player.nave[2].x+player.x, player.nave[2].y+player.y, player.ori)
            );
            controller.c = false;
        }
    }
    if (controller.v){ // faz o hyperspace que teleporta a nave para uma posição aleatória
        player.x = Math.floor(Math.random() * canvas.width);
        player.y = Math.floor(Math.random() * canvas.height);
        controller.v = false;
    }
}

// Draw a border around the canvas
function clearBoard() {
    //  Select the color to fill the drawing
    c.fillStyle = 'rgba(0, 0, 0, 1)';
    // Draw a "filled" rectangle to cover the entire canvas
    c.fillRect(0, 0, canvas.width, canvas.height);

    c.font = "20px Arial";
    c.fillStyle = "#FFFFFF";
    c.fillText(score, 8, 20);

    let x = 10;
    let y = 50;
    for(let i=0;i<vidas;i++){
        let temp = new Player(x,y,180);
        gira(temp.nave,0,0.5);
        temp.draw();
        x += 15;
    }
}

function gameOver() {
    if(vidas <= 0){
        alert(`Fim do jogo\n\n seu score final é: ${score} pontos`);
        return true;
    }

    if(asteroids.length == 0 && z === false)
    {
        nA += 1;
        setTimeout(() => {
            for(let i=0; i<nA; i++)
            {
                criaAsteroids(0,0,1);
            }
        }, 1000);
        z = true;
    }
    return false;
    
}

function loopPrincipal() {
    if (gameOver()) return;
    setTimeout (function onTick() {
        acoes();
        clearBoard();
        player.draw();
        animate();
        loopPrincipal(); // repeat
    }, (1000/fps));
    
}

// Começa o jogo
function run() {
    // Registra o monitoramento pelo pressionamento de tecla
    document.addEventListener("keydown", (e) => {
        if(!controller[e.key])
        {    
            controller[e.key] = true  
        }
    });
    document.addEventListener("keyup", (e) => {
        if(controller[e.key])
        {
            controller[e.key] = false;  
        }
    });
    for(let i=0; i<nA; i++){
        criaAsteroids(0,0,1);
    }
    setInterval(() => {
        if(saucer.emTela){
            saucer.disparar();
        }
    }, 1000);
    loopPrincipal();
}

let saucer = new Saucer(-200, -200, 1); 
let player = new Player(canvas.width/2, canvas.height-(canvas.height*0.3), 180);

const controller = {    ArrowLeft: false,
                        ArrowUp: false,
                        ArrowRight: false,
                        c: false,
                        v:false
}

run();