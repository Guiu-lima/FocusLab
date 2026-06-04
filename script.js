// ==========================================
// 1. TEMA E NOTIFICAÇÕES (TOAST)
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
    const btnAula = document.getElementById('btn-theme-aula');
    const btnIndex = document.getElementById('btn-theme'); 
    
    if (btnAula) btnAula.innerText = textoBotao;
    if (btnIndex) btnIndex.innerText = textoBotao;
}

function mostrarNotificacao(mensagem) {
    let toast = document.getElementById('toast-mensagem');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-mensagem';
        toast.className = 'toast-notificacao';
        document.body.appendChild(toast);
    }
    toast.innerText = mensagem;
    toast.classList.add('mostrar');
    setTimeout(() => toast.classList.remove('mostrar'), 3500);
}

inicializarTema();

// ==========================================
// 2. INICIALIZAÇÃO GERAL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('lista-cursos')) {
        carregarListaHome();
    }

    if (document.getElementById('video-aula')) {
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('id') || 'mintermos';
        
        carregarDadosDaAula(cursoId);
        carregarDoServidor(); 
        carregarQuizDaAba(cursoId);
    }

    const inputIA = document.getElementById('ia-input');
    if (inputIA) {
        inputIA.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') enviarMensagemIA();
        });
    }
});

// ==========================================
// 3. RENDERIZAÇÃO DA PÁGINA INICIAL
// ==========================================
const conteudoCursos = {
    "mintermos": { titulo: "Mintermos (Soma de Produtos)", descricao: "Aprenda a extrair expressões booleanas focando nos resultados '1' da tabela verdade." },
    "maxtermos": { titulo: "Maxtermos (Produto de Somas)", descricao: "Aprenda a extrair expressões booleanas focando nos resultados '0' da tabela verdade." },
    "karnaugh": { titulo: "Mapa de Karnaugh", descricao: "A técnica visual para simplificar circuitos lógicos de forma rápida e intuitiva, agrupando bits adjacentes." }
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
// 4. VÍDEO DINÂMICO DA AULA
// ==========================================
async function carregarDadosDaAula(aulaId) {
    try {
        const resposta = await fetch(`/api/cursos/${aulaId}`);
        if (!resposta.ok) throw new Error("Curso não encontrado");
        const curso = await resposta.json();

        const iframe = document.getElementById('video-aula');
        const tituloAula = document.querySelector('.video-loader-section h3');

        if (iframe) iframe.src = `https://www.youtube-nocookie.com/embed/${curso.videoId}?rel=0&modestbranding=1`;
        if (tituloAula) tituloAula.innerText = `Aula Atual: ${curso.titulo}`;
    } catch (erro) {
        console.error("Erro ao carregar aula:", erro);
        mostrarNotificacao("❌ Erro ao carregar o vídeo.");
    }
}

// ==========================================
// 5. MURAL DE ANOTAÇÕES (NODE.JS SERVER)
// ==========================================
let listaDeCards = [];
let idCardEmEdicao = null;

async function carregarDoServidor() {
    try {
        const resposta = await fetch('/api/notas');
        listaDeCards = await resposta.json();
        renderizarCards();
    } catch (erro) {
        console.error("Erro ao carregar notas do servidor:", erro);
    }
}

async function adicionarCard() {
    const titulo = document.getElementById('card-titulo').value.trim();
    const subtitulo = document.getElementById('card-subtitulo').value.trim();
    const texto = document.getElementById('card-texto').value.trim();
    const cor = document.getElementById('card-cor').value;

    if (!titulo || !texto) {
        mostrarNotificacao("⚠️ O Título e as Anotações são obrigatórios!");
        return;
    }

    try {
        if (idCardEmEdicao !== null) {
            await fetch(`/api/notas/${idCardEmEdicao}`, { method: 'DELETE' });
            idCardEmEdicao = null;
            document.querySelector('.acoes-criacao .btn-sucesso').innerText = 'Salvar Anotação';
        }

        await fetch('/api/notas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, subtitulo, texto, cor })
        });

        await carregarDoServidor(); 
        mostrarNotificacao("✅ Anotação salva com sucesso!");
        
        document.getElementById('card-titulo').value = '';
        document.getElementById('card-subtitulo').value = '';
        document.getElementById('card-texto').value = '';
    } catch (erro) {
        console.error("Erro ao guardar anotação:", erro);
        mostrarNotificacao("❌ Erro ao salvar anotação no servidor.");
    }
}

function iniciarEdicao(id) {
    const card = listaDeCards.find(c => c.id === id);
    if (!card) return;

    document.getElementById('card-titulo').value = card.titulo;
    document.getElementById('card-subtitulo').value = card.subtitulo || '';
    document.getElementById('card-texto').value = card.texto;
    document.getElementById('card-cor').value = card.cor;

    idCardEmEdicao = id;
    document.querySelector('.acoes-criacao .btn-sucesso').innerText = 'Atualizar Anotação';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirCard(id) {
    if (idCardEmEdicao === id) {
        idCardEmEdicao = null;
        document.querySelector('.acoes-criacao .btn-sucesso').innerText = 'Salvar Anotação';
    }
    try {
        await fetch(`/api/notas/${id}`, { method: 'DELETE' });
        mostrarNotificacao("🗑️ Anotação apagada.");
        await carregarDoServidor(); 
    } catch (erro) {
        console.error("Erro ao eliminar a nota:", erro);
    }
}

function alternarExpansaoCard(btn) {
    const cardElement = btn.closest('.card-anotacao');
    if (cardElement.classList.contains('expandido')) {
        cardElement.classList.remove('expandido');
        btn.innerText = "📄 Ver mais"; 
    } else {
        cardElement.classList.add('expandido');
        btn.innerText = "🔼 Ler menos"; 
    }
}

function renderizarCards() {
    const container = document.getElementById('grid-cards');
    const contador = document.getElementById('contador-cards');
    container.innerHTML = ''; 
    contador.innerText = listaDeCards.length;

    if (listaDeCards.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Nenhuma anotação criada ainda.</p>`;
        return;
    }

    listaDeCards.forEach((card) => {
        container.innerHTML += `
            <div class="card-anotacao" style="background-color: ${card.cor};">
                <div class="card-acoes">
                    <button class="btn-editar" onclick="iniciarEdicao(${card.id})" title="Editar anotação">✏️</button>
                    <button class="btn-excluir" onclick="excluirCard(${card.id})" title="Excluir anotação">×</button>
                </div>
                <h4>${card.titulo}</h4>
                ${card.subtitulo ? `<h5 style="color: #333; margin-bottom: 5px; font-weight: 500;">${card.subtitulo}</h5>` : ''}
                <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 8px 0;">
                <div class="card-texto-conteudo">${card.texto}</div>
                <button class="btn-expandir" onclick="alternarExpansaoCard(this)">📄 Ver mais</button>
            </div>
        `;
    });
}

function gerarPDF() {
    if (listaDeCards.length === 0) {
        mostrarNotificacao("⚠️ Crie pelo menos uma anotação primeiro.");
        return;
    }

    const btn = document.querySelector('.btn-pdf');
    const textoOriginal = btn.innerText;
    btn.innerText = "Preparando PDF...";
    btn.disabled = true;

    const elementoAlvo = document.getElementById('grid-cards');
    elementoAlvo.style.display = 'flex';
    elementoAlvo.style.flexDirection = 'column';
    elementoAlvo.style.gap = '20px';

    const cards = document.querySelectorAll('.card-anotacao');
    cards.forEach(card => {
        card.classList.add('expandido'); 
        card.querySelector('.card-acoes').style.display = 'none';
        card.querySelector('.btn-expandir').style.display = 'none';
    });

    const opcoesPDF = {
        margin: 10,
        filename: 'Minhas_Anotacoes_FocusLab.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
        html2pdf().set(opcoesPDF).from(elementoAlvo).save().then(() => {
            btn.innerText = textoOriginal;
            btn.disabled = false;
            elementoAlvo.removeAttribute('style');
            renderizarCards(); 
            mostrarNotificacao("📥 Download do PDF iniciado!");
        });
    }, 400);
}

// ==========================================
// 6. CHAT DA IA (INTEGRAÇÃO COM GEMINI API)
// ==========================================
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
        atualizarMensagemNaTela(idPensando, "❌ Ocorreu um erro ao conectar com o servidor FocusLab.");
    }
    rolarChatParaBaixo();
}

async function consultarGemini(pergunta) {
    const resposta = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta })
    });
    if (!resposta.ok) throw new Error("Erro de comunicação com o back-end");
    const dados = await resposta.json();
    return dados.resposta;
}

function adicionarMensagemNaTela(remetente, texto, id = null) {
    const chatHistorico = document.getElementById('ia-chat-historico');
    const div = document.createElement('div');
    div.className = `mensagem ${remetente}`;
    if (id) div.id = `msg-${id}`;
    
    div.innerHTML = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    chatHistorico.appendChild(div);
}

function atualizarMensagemNaTela(id, novoTexto) {
    const div = document.getElementById(`msg-${id}`);
    if (div) {
        div.innerHTML = novoTexto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }
}

function rolarChatParaBaixo() {
    const chatHistorico = document.getElementById('ia-chat-historico');
    if (chatHistorico) {
        setTimeout(() => chatHistorico.scrollTop = chatHistorico.scrollHeight, 50);
    }
}

// ==========================================
// 7. LÓGICA DO QUIZ DINÂMICO
// ==========================================
let questoesAtuais = [];
let indiceQuestaoAtual = 0;
let pontuacaoQuiz = 0;
let respondido = false;

async function carregarQuizDaAba(cursoId) {
    try {
        const resposta = await fetch(`/api/quiz/${cursoId}`); 
        if (!resposta.ok) throw new Error("Erro ao buscar quiz");
        
        questoesAtuais = await resposta.json();
        reiniciarQuiz(); 
    } catch (erro) {
        console.error("Erro na requisição do quiz:", erro);
        const painelQuiz = document.getElementById('painel-quiz');
        const btnTeste = document.querySelector('.btn-teste-conhecimento');
        if (painelQuiz) painelQuiz.classList.add('style-hidden');
        if (btnTeste) btnTeste.classList.add('style-hidden');
    }
}

function exibirQuestao() {
    respondido = false;
    document.getElementById('btn-proxima-quiz').disabled = true;
    document.getElementById('conteudo-quiz').classList.remove('style-hidden');
    document.getElementById('resultado-quiz').classList.add('style-hidden');

    const dadosQuestao = questoesAtuais[indiceQuestaoAtual];
    document.getElementById('pergunta-texto').innerText = dadosQuestao.pergunta;
    document.getElementById('quiz-progresso').innerText = `Questão ${indiceQuestaoAtual + 1} de ${questoesAtuais.length}`;

    const containerOpcoes = document.getElementById('quiz-opcoes');
    containerOpcoes.innerHTML = ''; 

    dadosQuestao.opcoes.forEach((opcao, id) => {
        const botaoOpcao = document.createElement('button');
        botaoOpcao.className = 'opcao-card';
        botaoOpcao.innerText = opcao;
        botaoOpcao.onclick = () => verificarResposta(id, botaoOpcao);
        containerOpcoes.appendChild(botaoOpcao);
    });
}

function verificarResposta(idSelecionado, elementoClicado) {
    if (respondido) return; 
    respondido = true;

    const questao = questoesAtuais[indiceQuestaoAtual];
    const todosOsBotoes = document.querySelectorAll('.opcao-card');

    if (idSelecionado === questao.correta) {
        elementoClicado.classList.add('correta');
        pontuacaoQuiz++;
    } else {
        elementoClicado.classList.add('errada');
        todosOsBotoes[questao.correta].classList.add('correta');
    }
    document.getElementById('btn-proxima-quiz').disabled = false;
}

function proximaQuestao() {
    indiceQuestaoAtual++;
    if (indiceQuestaoAtual < questoesAtuais.length) {
        exibirQuestao();
    } else {
        finalizarQuiz();
    }
}

function finalizarQuiz() {
    document.getElementById('conteudo-quiz').classList.add('style-hidden');
    const painelResultado = document.getElementById('resultado-quiz');
    painelResultado.classList.remove('style-hidden');
    document.getElementById('quiz-nota-texto').innerText = `Você acertou ${pontuacaoQuiz} de ${questoesAtuais.length} questões.`;
}

function reiniciarQuiz() {
    indiceQuestaoAtual = 0;
    pontuacaoQuiz = 0;
    if (questoesAtuais.length > 0) exibirQuestao();
}