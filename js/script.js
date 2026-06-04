// ==========================================
// 1. CONTROLO DE TEMA (DARK / LIGHT MODE)
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

inicializarTema();

// ==========================================
// 2. INICIALIZAÇÃO GERAL (DOM LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Se estiver na Página Inicial (index.html)
    if (document.getElementById('lista-cursos')) {
        carregarListaHome();
    }
    
    // Se estiver na Página da Aula (aula.html)
    if (document.getElementById('video-aula')) {
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('id') || 'mintermos';
        
        carregarDadosDaAula(cursoId);
        carregarDoServidor();       // Ativa o mural de notas
        carregarQuizDaAba(cursoId); // Liga o motor do quiz dinâmico
    }
});

// ==========================================
// 3. RENDERIZAÇÃO DA PÁGINA INICIAL E VÍDEOS
// ==========================================
const conteudoCursos = {
    "mintermos": { 
        titulo: "Mintermos (Soma de Produtos)", 
        descricao: "Aprenda a extrair expressões booleanas focando nos resultados '1' da tabela verdade." 
    },
    "maxtermos": { 
        titulo: "Maxtermos (Produto de Somas)", 
        descricao: "Aprenda a extrair expressões booleanas focando nos resultados '0' da tabela verdade." 
    },
    "karnaugh": { 
        titulo: "Mapa de Karnaugh", 
        descricao: "A técnica visual para simplificar circuitos lógicos de forma rápida e intuitiva, agrupando bits adjacentes." 
    }
};

function carregarListaHome() {
    const container = document.getElementById('lista-cursos');
    if (!container) return;
    container.innerHTML = "";
    
    Object.keys(conteudoCursos).forEach(id => {
        const curso = conteudoCursos[id];
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.onclick = () => window.location.href = `aula.html?id=${id}`;
        card.innerHTML = `
            <h3>${curso.titulo}</h3>
            <p>${curso.descricao}</p>
        `;
        container.appendChild(card);
    });
}

async function carregarDadosDaAula(cursoId) {
    try {
        const resposta = await fetch(`http://localhost:3000/api/cursos/${cursoId}`);
        if (!resposta.ok) throw new Error("Erro ao buscar dados da aula");
        const dados = await resposta.json();
        
        document.getElementById('titulo-aula').innerText = dados.titulo;
        document.getElementById('video-aula').src = `https://www.youtube.com/embed/${dados.videoId}`;
    } catch (erro) {
        console.error("Erro ao carregar dados da aula:", erro);
    }
}

// ==========================================
// 4. LÓGICA DO MURAL DE ANOTAÇÕES (COM BACK-END)
// ==========================================
let listaDeCards = [];
let idCardEmEdicao = null;
const LIMITE_CARDS = 1000;

async function carregarDoServidor() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('id') || 'mintermos';

        const resposta = await fetch(`http://localhost:3000/api/notas?cursoId=${cursoId}`);
        listaDeCards = await resposta.json();
        renderizarCards();
    } catch (erro) {
        console.error("Erro ao carregar notas do servidor:", erro);
    }
}

async function adicionarCard() {
    const tituloInput = document.getElementById('nota-titulo');
    const subtuloInput = document.getElementById('nota-subtitulo');
    const textoInput = document.getElementById('nota-texto');
    const corInput = document.getElementById('nota-cor');

    const titulo = tituloInput.value.trim();
    const subtitulo = subtuloInput.value.trim();
    const texto = textoInput.value.trim();
    const cor = corInput.value;

    if (!titulo || !texto) {
        alert("Por favor, preencha o título e o conteúdo da anotação.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = urlParams.get('id') || 'mintermos';

    const dadosNota = { titulo, subtitulo, texto, cor, cursoId };

    try {
        if (idCardEmEdicao !== null) {
            await fetch(`http://localhost:3000/api/notas/${idCardEmEdicao}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosNota)
            });
            idCardEmEdicao = null;
            document.querySelector('.btn-sucesso').innerText = 'Salvar Anotação';
        } else {
            if (listaDeCards.length >= LIMITE_CARDS) {
                alert(`Atingiu o limite máximo de ${LIMITE_CARDS} anotações.`);
                return;
            }
            await fetch('http://localhost:3000/api/notas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosNota)
            });
        }

        tituloInput.value = "";
        subtuloInput.value = "";
        textoInput.value = "";
        
        await carregarDoServidor();
        mostrarToast("Anotação guardada com sucesso! 📝");
    } catch (erro) {
        console.error("Erro ao salvar anotação:", erro);
    }
}

function iniciarEdicao(id) {
    const card = listaDeCards.find(c => c.id === id);
    if (!card) return;

    document.getElementById('nota-titulo').value = card.titulo;
    document.getElementById('nota-subtitulo').value = card.subtitulo || "";
    document.getElementById('nota-texto').value = card.texto;
    document.getElementById('nota-cor').value = card.cor;

    idCardEmEdicao = id;
    document.querySelector('.btn-sucesso').innerText = 'Atualizar Anotação';
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

async function excluirCard(id) {
    if (!confirm("Deseja eliminar esta anotação?")) return;
    
    try {
        await fetch(`http://localhost:3000/api/notas/${id}`, { method: 'DELETE' });
        await carregarDoServidor();
        mostrarToast("Anotação eliminada! 🗑️");
    } catch (erro) {
        console.error("Erro ao eliminar a nota:", erro);
    }
}

function renderizarCards() {
    const container = document.getElementById('grid-cards');
    if (!container) return;
    container.innerHTML = "";

    listaDeCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-anotacao';
        cardElement.style.backgroundColor = card.cor;
        
        cardElement.innerHTML = `
            <h3>${card.titulo}</h3>
            ${card.subtitulo ? `<h4>${card.subtitulo}</h4>` : ''}
            <p>${card.texto}</p>
            <div class="card-rodape">
                <button class="btn-card-ver" onclick="alternarExpansaoCard(this)">📄 Ver mais</button>
                <div>
                    <button class="btn-card-acao" onclick="iniciarEdicao(${card.id})">✏️</button>
                    <button class="btn-card-acao" onclick="excluirCard(${card.id})">🗑️</button>
                </div>
            </div>
        `;
        container.appendChild(cardElement);
    });

    const contador = document.getElementById('contador-cards');
    if (contador) contador.innerText = listaDeCards.length;
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast-notificacao');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('visivel');
    setTimeout(() => toast.classList.remove('visivel'), 3000);
}

// ==========================================
// 5. CHAT COM A IA (ALTURA FIXA E SEGURO)
// ==========================================
async function enviarMensagemIA() {
    const inputField = document.getElementById('ia-input');
    if (!inputField) return;
    
    const mensagem = inputField.value.trim();
    if (!mensagem) return;

    adicionarMensagemNaTela('user', mensagem);
    inputField.value = "";
    rolarChatParaBaixo();

    const idMsgIA = Date.now();
    adicionarMensagemNaTela('ia', 'A processar...', idMsgIA);
    rolarChatParaBaixo();

    try {
        const resposta = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pergunta: mensagem })
        });
        
        const dados = await resposta.json();
        atualizarMensagemNaTela(idMsgIA, dados.resposta);
    } catch (erro) {
        atualizarMensagemNaTela(idMsgIA, "Erro ao contactar a IA. Verifique o servidor.");
    }
    rolarChatParaBaixo();
}

function adicionarMensagemNaTela(remetente, texto, id = null) {
    const chatHistorico = document.getElementById('ia-chat-historico');
    if (!chatHistorico) return;
    
    const div = document.createElement('div');
    div.className = `mensagem ${remetente}`;
    if (id) div.id = `msg-${id}`;
    div.innerText = texto;
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
        setTimeout(() => {
            chatHistorico.scrollTop = chatHistorico.scrollHeight;
        }, 50);
    }
}

// ==========================================
// 6. LÓGICA DO QUIZ DINÂMICO (BLOCO SUBSTITUÍDO)
// ==========================================
let questoesAtuais = [];
let indiceQuestaoAtual = 0;
let pontuacaoQuiz = 0;
let respondido = false;

async function carregarQuizDaAba(cursoId) {
    try {
        const resposta = await fetch(`http://localhost:3000/api/quiz/${cursoId}`); 
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

function rolarParaQuiz() {
    const secaoQuiz = document.getElementById('painel-quiz');
    if (secaoQuiz) {
        secaoQuiz.scrollIntoView({ behavior: 'smooth' });
    }
}