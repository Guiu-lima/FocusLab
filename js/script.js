// ==========================================
// 1. CONTROLE DE TEMA (DARK / LIGHT MODE)
// ==========================================
function inicializarTema() {
    const temaSalvo = localStorage.getItem('mathPassoTema') || 'light';
    document.documentElement.setAttribute('data-theme', temaSalvo);
    atualizarBotoesTema(temaSalvo);
}

function alternarTema() {
    let temaAtual = document.documentElement.getAttribute('data-theme');
    let novoTema = temaAtual === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', novoTema);
    localStorage.setItem('mathPassoTema', novoTema);
    atualizarBotoesTema(novoTema);
}

function atualizarBotoesTema(tema) {
    const textoBotao = tema === 'dark' ? '☀️ Tema Claro' : '🌙 Tema Escuro';
    const btnIndex = document.getElementById('btn-theme');
    const btnAula = document.getElementById('btn-theme-aula');
    
    if (btnIndex) btnIndex.innerText = textoBotao;
    if (btnAula) btnAula.innerText = textoBotao;
}

// Inicializa o tema imediatamente ao ler o script
inicializarTema();

// ==========================================
// 2. INICIALIZAÇÃO GERAL (DOM LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-cursos')) {
        carregarListaHome();
    }
    
    if (document.getElementById('grid-cards')) {
        carregarDoLocalStorage();
    }

    const inputIA = document.getElementById('ia-input');
    if (inputIA) {
        inputIA.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                enviarMensagemIA();
            }
        });
    }
});

// ==========================================
// 3. BANCO DE DADOS SIMULADO (Cursos)
// ==========================================
const conteudoCursos = {
    "mintermos": {
        titulo: "Mintermos (Soma de Produtos)",
        descricao: "Aprenda a extrair expressões booleanas focando nos resultados '1' da tabela verdade. Essencial para construir circuitos a partir de requisitos exatos."
    },
    "maxtermos": {
        titulo: "Maxtermos (Produto de Somas)",
        descricao: "Aprenda a extrair expressões booleanas focando nos resultados '0' da tabela verdade. Útil para quando há menos zeros do que uns na saída."
    },
    "karnaugh": {
        titulo: "Mapa de Karnaugh",
        descricao: "A técnica visual para simplificar circuitos lógicos de forma rápida e intuitiva, agrupando bits adjacentes."
    }
    

};

function carregarListaHome() {
    const container = document.getElementById('lista-cursos');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(conteudoCursos).forEach(key => {
        const curso = conteudoCursos[key];
        container.innerHTML += `
            <div class="topic-card" onclick="window.location.href='aula.html?id=${key}'">
                <h3>${curso.titulo}</h3>
                <p>${curso.descricao}</p>
            </div>
        `;
    });
}

// ==========================================
// 4. LÓGICA DO VÍDEO DO YOUTUBE
// ==========================================
function carregarVideo() {
    const inputUrl = document.getElementById('video-url').value.trim();
    const container = document.getElementById('video-container');
    
    if (!inputUrl) {
        alert("Por favor, cole um link do YouTube.");
        return;
    }

    let videoId = "";
    
    if (inputUrl.includes("youtube.com/watch?v=")) {
        videoId = inputUrl.split("v=")[1].split("&")[0];
    } else if (inputUrl.includes("youtu.be/")) {
        videoId = inputUrl.split("youtu.be/")[1].split("?")[0];
    } else if (inputUrl.includes("youtube.com/shorts/")) {
        videoId = inputUrl.split("shorts/")[1].split("?")[0];
    } else if (inputUrl.length === 11) {
        videoId = inputUrl;
    } else {
        alert("Link não reconhecido.");
        return;
    }

    videoId = videoId.split("/")[0];

    container.innerHTML = `
        <iframe 
            src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    
    container.style.display = "block";
}

// ==========================================
// 5. LÓGICA DOS CARDS DE ANOTAÇÃO
// ==========================================
let listaDeCards = [];
const LIMITE_CARDS = 100;

function carregarDoLocalStorage() {
    const cardsSalvos = localStorage.getItem('mathPassoCards');
    if (cardsSalvos) {
        listaDeCards = JSON.parse(cardsSalvos);
        renderizarCards();
    }
}

function salvarNoLocalStorage() {
    localStorage.setItem('mathPassoCards', JSON.stringify(listaDeCards));
}

function adicionarCard() {
    if (listaDeCards.length >= LIMITE_CARDS) {
        alert(`Você atingiu o limite máximo de ${LIMITE_CARDS} anotações.`);
        return;
    }

    const titulo = document.getElementById('card-titulo').value.trim();
    const subtitulo = document.getElementById('card-subtitulo').value.trim();
    const texto = document.getElementById('card-texto').value.trim();
    const cor = document.getElementById('card-cor').value;

    if (!titulo || !texto) {
        alert("O Título e as Anotações são obrigatórios!");
        return;
    }

    const novoCard = {
        titulo: titulo,
        subtitulo: subtitulo,
        texto: texto,
        cor: cor,
        id: Date.now() 
    };

    listaDeCards.push(novoCard);
    salvarNoLocalStorage();
    
    document.getElementById('card-titulo').value = '';
    document.getElementById('card-subtitulo').value = '';
    document.getElementById('card-texto').value = '';
    
    renderizarCards();
}

function excluirCard(id) {
    listaDeCards = listaDeCards.filter(card => card.id !== id);
    salvarNoLocalStorage();
    renderizarCards();
}

function renderizarCards() {
    const container = document.getElementById('grid-cards');
    const contador = document.getElementById('contador-cards');
    
    container.innerHTML = ''; 
    contador.innerText = listaDeCards.length;

    if (listaDeCards.length === 0) {
        container.innerHTML = '<p id="mensagem-vazia">Nenhum card criado ainda.</p>';
        return;
    }

    listaDeCards.forEach((card) => {
        container.innerHTML += `
            <div class="card-anotacao" style="background-color: ${card.cor};">
                <button class="btn-excluir" onclick="excluirCard(${card.id})" title="Excluir anotação" style="position: absolute; top: 10px; right: 10px; background: transparent; border: none; color: #ff4d4d; font-weight: bold; cursor: pointer; font-size: 1.2rem;">×</button>
                <h4>${card.titulo}</h4>
                ${card.subtitulo ? `<h5 style="color: #555; margin-bottom: 8px;">${card.subtitulo}</h5>` : ''}
                <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 8px 0;">
                <p style="white-space: pre-wrap;">${card.texto}</p>
            </div>
        `;
    });
}

function gerarPDF() {
    if (listaDeCards.length === 0) {
        alert("Você precisa criar pelo menos um card para gerar o PDF.");
        return;
    }

    const botoesExcluir = document.querySelectorAll('.btn-excluir');
    botoesExcluir.forEach(btn => btn.style.display = 'none');

    const elementoAlvo = document.getElementById('grid-cards');
    
    const opcoesPDF = {
        margin:       10,
        filename:     'Minhas_Anotacoes_MathPasso.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, 
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const btn = document.querySelector('.btn-pdf');
    const textoOriginal = btn.innerText;
    btn.innerText = "Gerando PDF...";
    btn.disabled = true;

    html2pdf().set(opcoesPDF).from(elementoAlvo).save().then(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
        botoesExcluir.forEach(btn => btn.style.display = 'block');
    });
}

// ==========================================
// 6. CHAT COM API REAL DO GEMINI 
// ==========================================

// --- ATENÇÃO: COLE SUA CHAVE NA LINHA ABAIXO ---
const API_KEY = 'AIzaSyAq3j-0Nwxd9gl_bg0LSmGn165Fbe7Z3To'; 
// -----------------------------------------------

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

async function enviarMensagemIA() {
    const inputField = document.getElementById('ia-input');
    const mensagem = inputField.value.trim();
    
    if (!mensagem) return;

    adicionarMensagemNaTela('usuario', mensagem);
    inputField.value = ''; 
    rolarChatParaBaixo();

    const idPensando = Date.now();
    adicionarMensagemNaTela('ia', 'Pensando...', idPensando);
    rolarChatParaBaixo();

    try {
        const respostaReal = await consultarGemini(mensagem);
        atualizarMensagemNaTela(idPensando, respostaReal);
    } catch (error) {
        atualizarMensagemNaTela(idPensando, "Desculpe, ocorreu um erro ao conectar com a IA.");
        console.error("Erro na chamada da API:", error);
    }
    
    rolarChatParaBaixo();
}

async function consultarGemini(pergunta) {
    const promptDeContexto = `Você é um tutor acadêmico especialista em Matemática Computacional. 
    Responda de forma clara, objetiva e amigável. 
    Pergunta do aluno: ${pergunta}`;

    const corpoRequisicao = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: promptDeContexto }
                ]
            }
        ]
    };

    const resposta = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(corpoRequisicao)
    });

    if (!resposta.ok) {
        throw new Error(`Erro na requisição: ${resposta.status}`);
    }

    const dados = await resposta.json();
    return dados.candidates[0].content.parts[0].text;
}

function adicionarMensagemNaTela(remetente, texto, id = null) {
    const chatHistorico = document.getElementById('ia-chat-historico');
    const div = document.createElement('div');
    div.className = `mensagem ${remetente}`;
    if (id) div.id = `msg-${id}`;
    
    const textoFormatado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    div.innerHTML = textoFormatado;
    
    chatHistorico.appendChild(div);
}

function atualizarMensagemNaTela(id, novoTexto) {
    const div = document.getElementById(`msg-${id}`);
    if (div) {
        const textoFormatado = novoTexto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        div.innerHTML = textoFormatado;
    }
}

function rolarChatParaBaixo() {
    const chatHistorico = document.getElementById('ia-chat-historico');
    if (chatHistorico) {
        chatHistorico.scrollTop = chatHistorico.scrollHeight;
    }
}