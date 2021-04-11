"use strict";

//função auxiliar

function Remap(x, in_min, in_max, out_min, out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
                      
//------------------------------------------------
// variaveis globais
const gOri = 4; // ganho no ângulo de orientação
const gainP = 3; // ganho na velocidade
const bMin = -120; // offset da borda minima do canvas
const bMax = -80; // offset da borda maxima do canvas


const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 480; // tamanho horizintal do canvas
canvas.height = 640; // tamanho vertical do canvas

let projeteis = []; // array de armazenamento dos projeteis
const lmt = 5; // limite de "tempo de vida" de um projetil

//-------------------------------------------------
//classes 

class Player {
    constructor (x, y, ori) {
        this.x = x; // coordenada x do player
        this.y = y; // coordenada y do player
        
        this.ori = ori; // angulo em graus° de orientação do player
    }

    draw(){

        const cx = 101;// coordenada do centro da nave
        const cy = 105;// coordenada do centro da nave

        c.save();

        c.translate(cx+this.x, cy+this.y);// move o centro da matriz para as coordenadas
        c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
        c.translate(-(cx+this.x), -(cy+this.y));// retorna o centro da matriz para a posição original

        c.beginPath();
        c.moveTo(125+this.x,125+this.y);
        c.lineTo(100+this.x,60+this.y);
        c.lineTo(80+this.x,125+this.y);
        c.lineTo(101+this.x,105+this.y);
        //c.closePath(); //descomentar caso queira que a nave fique completa, eu deixei comentado pq achei mais estiloso assim
        c.strokeStyle = 'white';
        c.stroke();

        c.restore();
    }

    moveHorario(){
        this.ori += gOri;
        if(this.ori >= 360)
        {
            this.ori -= 360;
        }
    }
    moveAntHorario(){
        this.ori -= gOri;
        if(this.ori <= 0)
        {
            this.ori += 360;
        }
    }
    moveFrente(){ // o desenho está em 90° em relação com a origem, então tive que adaptar a relação de navegação pelos quadrantes
        this.x += (Math.cos((this.ori+270)*Math.PI / 180)*gainP);
        this.y += (Math.sin((this.ori+270)*Math.PI / 180)*gainP);
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

        const cx = 101;// coordenada do centro da nave
        const cy = 105;// coordenada do centro da nave

        c.save();

        c.translate(cx+this.x, cy+this.y);// move o centro da matriz para as coordenadas
        c.rotate(this.ori*Math.PI / 180);// rotaciona a matriz de acordo com com o angulo
        c.translate(-(cx+this.x), -(cy+this.y));// retorna o centro da matriz para a posição original

        c.rect(this.x+100, this.y+60, 1, 1);
        c.strokeStyle = 'white';
        c.stroke();

        c.restore();

    }

    update(){
        this.draw();
        this.x += (Math.cos((this.ori+270)*Math.PI / 180)*(gainP+2));
        this.y += (Math.sin((this.ori+270)*Math.PI / 180)*(gainP+2));

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

function animate() {
    //requestAnimationFrame(animate);
    projeteis.forEach((projetil, index) => {
        projetil.update();
        if(projetil.limite >= lmt)
        {
            projeteis.splice(index, 1); // remove os projeteis
        }
    });
}

function acoes() {

    if (controller.ArrowLeft) {
        player.moveAntHorario();
    } else if (controller.ArrowRight) {
        player.moveHorario();
    }
    if (controller.ArrowUp) {
        player.moveFrente();
    }
    if (controller.c){

       // if(projeteis.length < 5){
            const px = player.x;
            const py = player.y;
            projeteis.push(
                new Projetil(px, py, player.ori)
            );
            controller.c = false;
       // }
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
    //if (gameOver()) return;
    setTimeout (function onTick() {
        acoes();
        clearBoard();
        player.draw();
        animate();
        loopPrincipal(); // repeat
    }, (1/60));
    
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
    loopPrincipal();
}

let player = new Player(250, 250, 0);

const controller = {    ArrowLeft: false,
                        ArrowUp: false,
                        ArrowRight: false
}

run();