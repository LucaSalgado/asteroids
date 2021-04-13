"use strict";

/* contornos dos shapes (retangulos)
    shape 1
    coordenadas para o centro x -> dx-35, y -> dy+17.5
    dx = 200;
    dy = 200;
    c.moveTo(dx,dy-15);
    c.lineTo(dx,dy+50);
    c.lineTo(dx-80,dy+50);
    c.lineTo(dx-80,dy-15);
    c.lineTo(dx,dy-15);
    c.strokeStyle = 'white';
    c.stroke();

    shape 2
    coordenadas para o centro x -> dx-35, y -> dy+12.5
    dx = 100
    dy = 100
    c.moveTo(dx,dy-15);
    c.lineTo(dx,dy+40);
    c.lineTo(dx-70,dy+40);
    c.lineTo(dx-70,dy-15);
    c.lineTo(dx,dy-15);
    c.strokeStyle = 'white';
    c.stroke();

    shape 3
    //coordenadas para o centro x -> dx-35, y -> dy+7.5
    dx = 300
    dy = 300
    c.moveTo(dx,dy-20);
    c.lineTo(dx,dy+35);
    c.lineTo(dx-40,dy+35);
    c.lineTo(dx-40,dy-20);
    c.lineTo(dx,dy-20);
    c.strokeStyle = 'white';
    c.stroke();
*/
//função auxiliar

function Remap(x, in_min, in_max, out_min, out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
                      
//------------------------------------------------
// variaveis globais
const gOri = 4; // ganho no ângulo de orientação
const gainP = 5; // ganho na velocidade
const bMin = -120; // offset da borda minima do canvas
const bMax = -80; // offset da borda maxima do canvas


const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 480; // tamanho horizintal do canvas
canvas.height = 640; // tamanho vertical do canvas

let projeteis = []; // array de armazenamento dos projeteis
const lmt = 4; // limite de "tempo de vida" de um projetil

let asteroids = []; // array de armazenamento dos asteroids

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
        ];
    }

    gira(teta){
        this.nave.forEach((ponto) => {// rotaciona os pontos em relação a origem
            let xt = ponto.x;
            let yt = ponto.y
            ponto.x = ((Math.sin(teta*Math.PI / 180))*yt)+((Math.cos(teta*Math.PI / 180))*xt);
            ponto.y = ((-Math.sin(teta*Math.PI / 180))*xt)+((Math.cos(teta*Math.PI / 180))*yt);
          
        });
    }

    draw(){

        c.beginPath();
        c.lineTo(this.nave[0].x+this.x,this.nave[0].y+this.y);
        c.lineTo(this.nave[1].x+this.x,this.nave[1].y+this.y);
        c.lineTo(this.nave[2].x+this.x,this.nave[2].y+this.y);
        c.lineTo(this.nave[3].x+this.x,this.nave[3].y+this.y);
       // c.closePath();
        c.strokeStyle = 'white';
        c.stroke();

    }

    moveHorario(){
        this.ori -= gOri;
        if(this.ori <= 0)
        {
            this.ori += 360;
        }
        this.gira(-gOri);
    }
    moveAntHorario(){
        this.ori += gOri;
        if(this.ori >= 360)
        {
            this.ori -= 360;
        }
        this.gira(gOri);
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
    constructor(x, y, ori){
        this.x = x;
        this.y = y;
        this.ori = ori;
    }

    update(){
        this.draw();
       // this.x += (Math.cos((this.ori+270)*Math.PI / 180)*(gainP-1.5));
      //  this.y += (Math.sin((this.ori+270)*Math.PI / 180)*(gainP-1.5));

        // faz o asteroid atravessar a tela
        if(this.x < bMin){
            this.x = canvas.width+30;
        }else if(this.x > canvas.width+30){
            this.x = bMin;
        }
        if(this.y < bMin){
            this.y = canvas.height+30;
        }else if(this.y > canvas.height+30){
            this.y = bMin;
        }
    }
}

//-----------------------------------------------------------
// Funções do jogo

function criaAsteroids() {
    let aX;
    let aY;
    do{
        aX = Math.floor(Math.random() * canvas.width);
        aY = Math.floor(Math.random() * canvas.height);
    }while(Math.hypot(aX - player.x, aY - player.y) < 300)
    asteroids.push(
       // new Asteroids(aX, aY, Math.floor(Math.random() * 360))
       new Asteroids(aX, aY, 0)
    );
    switch(Math.floor(Math.random() * 3)){ // seleciona qual dos três tipos de asteroids será desenhado
        case 0:
            asteroids[asteroids.length-1].draw = function() {
                c.save();
                c.translate(this.x, this.y);// move o centro da matriz para as coordenadas
                c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
                c.translate(-(this.x), -(this.y));// retorna o centro da matriz para a posição original*/

                c.beginPath();
                c.moveTo(this.x,this.y);
                c.lineTo(this.x, this.y+25);
                c.lineTo(this.x-20, this.y+30);
                c.lineTo(this.x-40, this.y+55);
                c.lineTo(this.x-70, this.y+30);
                c.lineTo(this.x-65, this.y);
                c.lineTo(this.x-30, this.y-10);
                c.closePath();
                c.strokeStyle = 'white';
                c.stroke();

                c.restore();

               /* c.save();
                c.translate(this.x, this.y);// move o centro da matriz para as coordenadas
                c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
                c.translate(-(this.x), -(this.y));// retorna o centro da matriz para a posição original*/

                c.rect(this.x-35,this.y+17.5,1,1); //coordenadas para o centro x -> dx-35, y -> dy+17.5
                c.strokeStyle = 'white';
                c.stroke();

               //c.restore();
            }
            asteroids[asteroids.length-1].cx = -35;// referência para o centro do retângulo de colisão
            asteroids[asteroids.length-1].cy = 17.5;
            break;
        case 1:
            asteroids[asteroids.length-1].draw = function() {
                c.save();
                c.translate(this.x, this.y);// move o centro da matriz para as coordenadas
                c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
                c.translate(-(this.x), -(this.y));// retorna o centro da matriz para a posição original

                c.beginPath();
                c.moveTo(this.x,this.y);
                c.lineTo(this.x-20, this.y+35);
                c.lineTo(this.x-60, this.y+40);
                c.lineTo(this.x-70, this.y+5);
                c.lineTo(this.x-40, this.y-15);
                c.lineTo(this.x-35, this.y+10);
                c.closePath();
                c.strokeStyle = 'white';
                c.stroke();

                c.restore();

               /* c.save();
                c.translate(this.x, this.y);// move o centro da matriz para as coordenadas
                c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
                c.translate(-(this.x), -(this.y));// retorna o centro da matriz para a posição original*/

                c.rect(this.x-35,this.y+12.5,1,1); //coordenadas para o centro x -> dx-35, y -> dy+12.5
                c.strokeStyle = 'white';
                c.stroke();

                //c.restore();
            }
            asteroids[asteroids.length-1].cx = -35;// referência para o centro do retângulo de colisão
            asteroids[asteroids.length-1].cy = 12.5;
            break;
        default:
            asteroids[asteroids.length-1].draw = function(){
                c.save();
                c.translate(this.x, this.y);// move o centro da matriz para as coordenadas
                c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
                c.translate(-(this.x), -(this.y));// retorna o centro da matriz para a posição original

                c.beginPath();
                c.moveTo(this.x,this.y);
                c.lineTo(this.x-20, this.y+35);
                c.lineTo(this.x-55, this.y+27);
                c.lineTo(this.x-70, this.y);
                c.lineTo(this.x-65, this.y-20);
                c.lineTo(this.x-30, this.y-18);
                c.closePath();
                c.strokeStyle = 'white';
                c.stroke();

                c.restore();

                /*c.save();
                c.translate(this.x, this.y);// move o centro da matriz para as coordenadas
                c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
                c.translate(-(this.x), -(this.y));// retorna o centro da matriz para a posição original*/

                c.rect(this.x-35,this.y+7.5,1,1); //coordenadas para o centro x -> dx-35, y -> dy+7.5
                c.strokeStyle = 'white';
                c.stroke();

               // c.restore();
            }
            asteroids[asteroids.length-1].cx = -35;// referência para o centro do retângulo de colisão
            asteroids[asteroids.length-1].cy = 7.5;
            break;
    }
}

function animate() {
    projeteis.forEach((projetil, index) => {
        projetil.update();
        if(projetil.limite >= lmt)
        {
            projeteis.splice(index, 1); // remove os projeteis
        }
    });
    asteroids.forEach((aster, index) => {
        aster.update();
        projeteis.forEach((projetil, pIndex) =>{
            const dist = Math.hypot((projetil.x) - (aster.x+aster.cx), (projetil.y) - (aster.y+aster.cy+50));
            if(dist < 3)
            {
                console.log(dist);
                console.log(`projetil x-> ${projetil.x+101} y-> ${projetil.y+105}`);
                console.log(`asteroid x-> ${aster.x+aster.cx} y-> ${aster.y+aster.cy+50}`);
                setTimeout(() => {
                    asteroids.splice(index,1);
                    projeteis.splice(pIndex,1);
                }, 0);
            }
        });
    });
}

function acoes() {

    if (controller.ArrowLeft) {
        player.moveHorario();
       // controller.ArrowLeft = false;
    } else if (controller.ArrowRight) {
        player.moveAntHorario();
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
}

// Draw a border around the canvas
function clearBoard() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    //  Select the color to fill the drawing
    c.fillStyle = 'black';
    //  Select the color for the border of the canvas
    c.strokeStyle = 'white';
    // Draw a "filled" rectangle to cover the entire canvas
    c.fillRect(0, 0, canvas.width, canvas.height);
    // Draw a "border" around the entire canvas
    c.strokeRect(0, 0, canvas.width, canvas.height);
}

function loopPrincipal() {
   // if (gameOver()) return;
    setTimeout (function onTick() {
        acoes();
        clearBoard();
        player.draw();
        animate();
        loopPrincipal(); // repeat
    }, (1000/60));
    
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
    for(let i=0; i<4; i++){
        criaAsteroids();
    }
    loopPrincipal();
}

let player = new Player(130, 300, 0);

const controller = {    ArrowLeft: false,
                        ArrowUp: false,
                        ArrowRight: false,
                        c: false
}

run();