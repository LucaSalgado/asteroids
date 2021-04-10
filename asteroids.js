"use strict";

//função auxiliar

function Remap(x, in_min, in_max, out_min, out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
                      
//------------------------------------------------

let minO = 0;
let maxO = 5;
let passO = 0.005;
let gOri = 4;
let gainP = 1.5;


const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 480;
canvas.height = 640;

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

        if(this.ori >= 0 && this.ori <= 90)
        {
            
            this.x += Remap(this.ori, 0, 90, passO, maxO-passO-gainP);
            this.y += Remap(this.ori, 0, 90, passO-maxO+gainP, -passO);

        }else if(this.ori > 90 && this.ori <= 180)
        {
    
            this.x += Remap(this.ori, 90, 180, maxO-gainP, minO);
            this.y += Remap(this.ori, 90, 180, minO, maxO-gainP);

        }else if(this.ori > 180 && this.ori <= 270)
        {

            this.x += Remap(this.ori, 180, 270, -passO, -maxO+gainP);
            this.y += Remap(this.ori, 180, 270, maxO-passO-gainP, minO);

        }else if(this.ori > 270 && this.ori < 360)
        {
            
            this.x += Remap(this.ori, 270, 360, passO-maxO+gainP, minO);
            this.y += Remap(this.ori, 270, 360, -passO, -maxO+gainP);

        }
        else // angulo igual a 360
        {

            this.y -= maxO-gainP;

        }

    }
}

class Projetil {
    constructor(x, y, velocidade){
        this.x = x;
        this.y = y;
        this.velocidade = velocidade;
    }

    draw(){
        c.rect(this.x, this.y, 1, 1);
        c.strokeStyle = 'white';
        c.stroke();
    }
}

function mudaDirecao() {

    if (controller.ArrowLeft) {
        player.moveAntHorario();
    } else if (controller.ArrowRight) {
        player.moveHorario();
    }
    if (controller.ArrowUp) {
        player.moveFrente();
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
        mudaDirecao();
        clearBoard();
        player.draw();
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
        console.log(e.key);
        if(controller[e.key])
        {
            controller[e.key] = false  
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