// --- Elementos do DOM ---
const gameContainer = document.getElementById('game-container');
const difficultySelection = document.getElementById('difficulty-selection');
const gameArea = document.getElementById('game-area');
const endGameArea = document.getElementById('end-game');
const allSections = [difficultySelection, gameArea, endGameArea];

const levelDisplay = document.getElementById('level-display');
const chancesDisplay = document.getElementById('chances-display');
const timerDisplay = document.getElementById('timer-display');
const problemDisplay = document.getElementById('problem');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackDisplay = document.getElementById('feedback');
const endMessage = document.getElementById('end-message');
const playAgainBtn = document.getElementById('play-again-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// Novos Elementos
const mascotDisplay = document.getElementById('mascot');
const scoreDisplay = document.getElementById('score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const progressBar = document.getElementById('progress-bar');
const finalScoreDisplay = document.getElementById('final-score-display');
const muteBtn = document.getElementById('mute-btn');
const muteIcon = muteBtn.querySelector('i');

// Elementos de Áudio
const audioCorrect = document.getElementById('audio-correct');
const audioIncorrect = document.getElementById('audio-incorrect');
const audioClick = document.getElementById('audio-click');
const audioWin = document.getElementById('audio-win');
const audioLose = document.getElementById('audio-lose');
const audioBgm = document.getElementById('audio-bgm');

// --- Configurações e Variáveis do Jogo ---
const NUM_NIVEIS = 10;
const OPERADORES = ['+', '-', '*', '/'];
const DIFICULDADES = {
    facil: { chances: 3, tempo_limite: null, nome: "Fácil" },
    medio: { chances: 2, tempo_limite: null, nome: "Médio" },
    dificil: { chances: 1, tempo_limite: null, nome: "Difícil" },
    lendario: { chances: 1, tempo_limite: 15, nome: "Lendário" }
};
const MASCOTE = {
    feliz: '😊',
    triste: '😥',
    pensando: '🤔',
    vitoria: '🥳',
    derrota: '😵'
};

let nivelAtual;
let chancesRestantes;
let configAtual;
let respostaCorreta;
let timerInterval;
let tempoRestante;
let score;
let highScore;
let isMuted = true; // Começa mudo por padrão


function showSection(sectionToShow) {
    console.log(`Tentando mostrar a seção: ${sectionToShow.id}`); // Para debug
    allSections.forEach(section => {
        // Verifica se 'section' é um elemento válido antes de acessar classList
        if (section && section.classList) {
             if (section.id === sectionToShow.id) {
                 // Mostra a seção desejada
                 section.classList.remove('hidden');
                 console.log(` - Mostrando ${section.id}`);
             } else {
                 // Esconde todas as outras seções
                 if (!section.classList.contains('hidden')) { // Adiciona só se não estiver escondido
                     section.classList.add('hidden');
                     console.log(` - Escondendo ${section.id}`);
                 }
             }
        } else {
            console.warn("Elemento de seção inválido encontrado:", section);
        }
    });
}

// --- Funções de Som ---
function playSound(audioElement) {
    if (!isMuted && audioElement) {
        audioElement.currentTime = 0; // Reinicia se já estiver tocando
        audioElement.play().catch(e => console.log("Erro ao tocar som:", e)); // Adiciona catch para erros
    }
}

function toggleMute() {
    isMuted = !isMuted;
    audioBgm.muted = isMuted; // Silencia/Dessilencia a música de fundo
    // Todos os outros sons são verificados em playSound()

    // Atualiza ícone do botão
    if (isMuted) {
        muteIcon.classList.remove('fa-volume-high');
        muteIcon.classList.add('fa-volume-xmark');
        audioBgm.pause(); // Pausa BGM quando mutado
    } else {
        muteIcon.classList.remove('fa-volume-xmark');
        muteIcon.classList.add('fa-volume-high');
        // Tenta tocar BGM (pode falhar se não houver interação prévia)
        audioBgm.play().catch(e => console.log("BGM não pode iniciar automaticamente."));
    }
}

// --- Funções de Animação ---
function triggerAnimation(element, animationClass, duration = 500) {
    if (element) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') { // Verifica se a lib carregou
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// --- Funções do Jogo ---
function loadHighScore() {
    highScore = localStorage.getItem('mathGameHighScore') || 0;
    highScoreDisplay.textContent = `Recorde: ${highScore}`;
}

function saveHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('mathGameHighScore', highScore);
        highScoreDisplay.textContent = `Recorde: ${highScore}`;
    }
}

function updateScore(points) {
    score += points;
    scoreDisplay.textContent = `Pontos: ${score}`;
}

function updateProgressBar() {
    const progressPercentage = (Math.max(0, nivelAtual - 1) / NUM_NIVEIS) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}

function updateMascot(estado) {
    mascotDisplay.textContent = MASCOTE[estado] || MASCOTE.pensando;
    triggerAnimation(mascotDisplay, 'pulse-simple', 300); // Animação simples na mudança
}

// Adiciona keyframe simples para o mascote (adicione ao CSS se preferir)
const styleSheet = document.styleSheets[0];
try {
    styleSheet.insertRule(`
        @keyframes pulse-simple {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`.pulse-simple { animation: pulse-simple 0.3s ease-in-out; }`, styleSheet.cssRules.length);
} catch (e) {
    console.warn("Não foi possível inserir keyframes dinamicamente:", e);
}


function gerarNumero(max) {
    return Math.floor(Math.random() * max) + 1;
}

// Gerar problema (lógica mantida, ajustes menores)
function gerarProblema(nivel) {
    const maxNumBase = 5;
    const maxNum = nivel * 3 + maxNumBase;

    let operador = OPERADORES[Math.floor(Math.random() * OPERADORES.length)];
    let num1 = gerarNumero(maxNum);
    let num2 = gerarNumero(maxNum);
    let resposta;

    switch (operador) {
        case '+':
            resposta = num1 + num2;
            break;
        case '-':
            if (num1 < num2) [num1, num2] = [num2, num1];
             // Permite resultado 0, mas evita negativo simples
            if (num1 === num2) num1 += gerarNumero(3); // Evita muitos "X - X = 0"
            resposta = num1 - num2;
            break;
        case '*':
             // Limita um pouco mais para não ficar impossível
             num1 = gerarNumero(Math.max(3, Math.floor(maxNum / (nivel < 5 ? 2 : 1.5) )));
             num2 = gerarNumero(Math.max(2, Math.floor(maxNum / (nivel < 5 ? 3 : 2) )));
             resposta = num1 * num2;
            break;
        case '/':
             num2 = gerarNumero(Math.max(2, Math.floor(maxNum / 2))); // Divisor > 1
             resposta = gerarNumero(Math.max(2, Math.floor(maxNum / 3)));
             num1 = num2 * resposta;
             if(num1 > maxNum*2) { // Recalcula se ficou grande demais
                return gerarProblema(nivel);
             }
            break;
        default:
            operador = '+';
            resposta = num1 + num2;
    }

    const pergunta = `${num1} ${operador} ${num2} = ?`;
    return { pergunta, resposta };
}

function atualizarTimer() {
    tempoRestante--;
    timerDisplay.textContent = `Tempo: ${tempoRestante}s`;
    timerDisplay.classList.toggle('low-time', tempoRestante <= 5); // Adiciona/remove classe

    if (tempoRestante <= 0) {
        clearInterval(timerInterval);
        feedbackDisplay.textContent = "Tempo esgotado! ⌛";
        feedbackDisplay.className = 'incorrect';
        updateMascot('triste');
        processarRespostaIncorreta(true);
    }
}

function iniciarTimer() {
    timerDisplay.classList.remove('low-time'); // Reseta classe de tempo baixo
    if (configAtual.tempo_limite) {
        tempoRestante = configAtual.tempo_limite;
        timerDisplay.textContent = `Tempo: ${tempoRestante}s`;
        timerDisplay.classList.remove('hidden');
        clearInterval(timerInterval);
        timerInterval = setInterval(atualizarTimer, 1000);
    } else {
        timerDisplay.classList.add('hidden');
        clearInterval(timerInterval);
    }
}

// Função para trocar a visibilidade das seções com animação
function switchSection(hideSection, showSection) {
     if (hideSection) {
          //hideSection.classList.add('hidden');
          hideSection.classList.remove('visible'); // Começa a transição de saída
     }
     if (showSection) {
         // Para garantir que estava oculto antes de animar a entrada
         showSection.classList.add('hidden');
         showSection.classList.remove('hidden'); // Remove display:none se existir
         // Força reflow para garantir que a transição ocorra
         void showSection.offsetWidth;
         showSection.classList.add('visible');
     }
}

// Iniciar Nível Atualizado
function iniciarNivel() {
    feedbackDisplay.textContent = '';
    feedbackDisplay.className = '';
    levelDisplay.textContent = `Nível: ${nivelAtual}`;
    chancesDisplay.textContent = `Chances: ${chancesRestantes}`;
    answerInput.value = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    answerInput.classList.remove('shake-error'); // Garante que não tenha a classe de erro

    updateMascot('pensando'); // Mascote pensando
    updateProgressBar(); // Atualiza barra de progresso

    // Fundo Dinâmico (muda Hue do HSL)
    const baseHue = 195; // Azul claro base
    const hueShift = (nivelAtual - 1) * 5; // Muda 5 graus por nível
    gameContainer.style.backgroundColor = `hsl(${baseHue + hueShift}, 70%, 96%)`;


    // Fade out problema antigo (se houver) e gera novo
    problemDisplay.classList.add('fade-out');

    setTimeout(() => { // Espera o fade out
        const problema = gerarProblema(nivelAtual);
        problemDisplay.textContent = problema.pergunta;
        respostaCorreta = problema.resposta;
        problemDisplay.classList.remove('fade-out'); // Fade in novo problema
        iniciarTimer();
        answerInput.focus();
    }, 300); // Tempo igual à transição de opacidade do problema
}

// Processar Resposta Incorreta Atualizado
function processarRespostaIncorreta(tempoEsgotado = false) {
    chancesRestantes--;
    chancesDisplay.textContent = `Chances: ${chancesRestantes}`;
    playSound(audioIncorrect); // Toca som de erro
    triggerAnimation(answerInput, 'shake-error', 300); // Tremer input

    if (!tempoEsgotado) {
        feedbackDisplay.textContent = "Incorreta... 🙁";
        feedbackDisplay.className = 'incorrect';
        updateMascot('triste'); // Mascote triste
    }

    if (chancesRestantes <= 0) {
        clearInterval(timerInterval);
        feedbackDisplay.textContent += ` A resposta era ${respostaCorreta}.`;
        updateMascot('derrota'); // Mascote derrotado
        playSound(audioLose);
        gameOver(`Você não passou do nível ${nivelAtual}.`);
    } else {
        answerInput.value = '';
        answerInput.focus();
        // Não limpa feedback imediatamente para o usuário ver
    }
}

// Verificar Resposta Atualizado
function verificarResposta() {
    // Se o botão estiver desabilitado, não faz nada (evita cliques múltiplos)
    if (submitBtn.disabled) return;

    const respostaUsuarioStr = answerInput.value.trim();

    if (respostaUsuarioStr === '') {
        feedbackDisplay.textContent = "Digite uma resposta!";
        feedbackDisplay.className = 'incorrect';
        triggerAnimation(answerInput, 'shake-error', 300);
        return;
    }

    const respostaUsuario = parseInt(respostaUsuarioStr);

    if (isNaN(respostaUsuario)) {
         feedbackDisplay.textContent = "Isso não parece um número!";
         feedbackDisplay.className = 'incorrect';
         triggerAnimation(answerInput, 'shake-error', 300);
         answerInput.value = '';
         return;
    }

    clearInterval(timerInterval);
    answerInput.disabled = true;
    submitBtn.disabled = true;

    if (respostaUsuario === respostaCorreta) {
        feedbackDisplay.textContent = "🎉 Correto! 🎉";
        feedbackDisplay.className = 'correct';
        updateMascot('feliz'); // Mascote feliz
        playSound(audioCorrect); // Toca som de acerto
        triggerAnimation(submitBtn, 'pulse-green', 600); // Anima botão
        triggerConfetti(); // Solta confetes!

        // Calcula pontos (ex: 10 base + tempo restante se houver timer)
        let pontosGanhos = 10;
        if(configAtual.tempo_limite && tempoRestante > 0) {
            pontosGanhos += Math.max(1, Math.floor(tempoRestante / 2)); // Bônus por tempo
        }
        updateScore(pontosGanhos); // Atualiza pontuação

        nivelAtual++;

        setTimeout(() => {
            if (nivelAtual > NUM_NIVEIS) {
                saveHighScore(); // Salva recorde ao vencer
                updateMascot('vitoria'); // Mascote vitorioso
                playSound(audioWin);
                jogoVencido();
            } else {
                iniciarNivel(); // Prepara próximo nível
            }
        }, 1200); // Espera um pouco mais para ver confete/animação

    } else {
        processarRespostaIncorreta();
         // Re-habilita se ainda tem chance E não está no meio da animação de erro
        if (chancesRestantes > 0) {
            setTimeout(() => { // Espera animação de erro terminar
                answerInput.disabled = false;
                submitBtn.disabled = false;
                answerInput.focus();
            }, 400);
        }
    }
}

// Selecionar Dificuldade Atualizado
function selecionarDificuldade(dificuldade) {
    playSound(audioClick);
    configAtual = DIFICULDADES[dificuldade];
    nivelAtual = 1;
    chancesRestantes = configAtual.chances;
    score = 0;
    scoreDisplay.textContent = `Pontos: ${score}`;
    updateProgressBar();

    // **Usa a nova função showSection**
    showSection(gameArea); // Mostra a área do jogo (garante que as outras somem)

    if (!isMuted) {
         audioBgm.play().catch(e => console.log("BGM precisa de interação do usuário para iniciar."));
    }
    // Chama iniciarNível DEPOIS que a seção já está visível
    // Pequeno delay para garantir que a seção esteja visível antes de focar no input
    setTimeout(() => {
        iniciarNivel();
    }, 50); // 50ms é geralmente suficiente
}

// Game Over Atualizado
function gameOver(mensagem) {
    saveHighScore();
    // **Usa a nova função showSection**
    showSection(endGameArea); // Mostra a tela de fim de jogo
    endMessage.textContent = `😥 ${mensagem}`;
    finalScoreDisplay.textContent = `Sua pontuação final: ${score}`;
}

// Jogo Vencido Atualizado
function jogoVencido() {
    // **Usa a nova função showSection**
    showSection(endGameArea); // Mostra a tela de fim de jogo (vitória)
    endMessage.textContent = `🏆 Incrível! Você venceu todos os ${NUM_NIVEIS} níveis! 🥳`;
    finalScoreDisplay.textContent = `Sua pontuação final: ${score}`;
}

// Reiniciar Jogo Atualizado
function reiniciarJogo() {
    playSound(audioClick);
    // **Usa a nova função showSection**
    showSection(difficultySelection); // Mostra a seleção de dificuldade

    // Resetar outras coisas visuais
    feedbackDisplay.textContent = '';
    feedbackDisplay.className = '';
    clearInterval(timerInterval);
    loadHighScore();
    gameContainer.style.backgroundColor = '#ffffff';
    progressBar.style.width = '0%';
    updateMascot('pensando');
}

// --- Event Listeners ---
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        selecionarDificuldade(button.dataset.difficulty);
    });
});

submitBtn.addEventListener('click', verificarResposta);

answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !submitBtn.disabled) { // Verifica se botão não está desabilitado
        verificarResposta();
    }
});

playAgainBtn.addEventListener('click', reiniciarJogo);

muteBtn.addEventListener('click', toggleMute);

// --- Inicialização ---
loadHighScore(); // Carrega o high score ao iniciar
// Configura estado inicial mudo
audioBgm.muted = isMuted;
if (isMuted) {
    muteIcon.classList.add('fa-volume-xmark');
} else {
    muteIcon.classList.add('fa-volume-high');
}
// Garante que a seção inicial está visível (caso o CSS padrão mude)
difficultySelection.classList.add('visible');
gameArea.classList.add('hidden');
gameArea.classList.remove('visible');
endGameArea.classList.add('hidden');
endGameArea.classList.remove('visible');