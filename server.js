require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); // Permite que o front-end comunique com o back-end
// Diz ao Express para servir os arquivos da pasta atual (como index.html, css, js)
app.use(express.static(__dirname));
app.use(express.json()); // Permite receber dados em formato JSON

// --- BASE DE DADOS SIMULADA ---
let listaDeNotas = []; 

const courses = {
    "mintermos": { titulo: "Mintermos (Soma de Produtos)", videoId: "_S8NquuMiz8" },
    "maxtermos": { titulo: "Maxtermos (Produto de Somas)", videoId: "YE4oEqx_D3c" },
    "karnaugh": { titulo: "Mapa de Karnaugh", videoId: "YE4oEqx_D3c" }
};

// BANCO DE DADOS DO QUIZ (Retorna as perguntas estruturadas para o Front-end)
const bancoQuiz = {
  "mintermos": [
    {
      id: 1,
      pergunta: "O que representa fundamentalmente um mintermo?",
      opcoes: [
        "Um produto lógico (AND) que resulta em 1 para uma única combinação.",
        "Uma soma lógica (OR) que resulta em 0 para uma única combinação.",
        "A simplificação máxima de uma expression booleana.",
        "O mapeamento de saídas em alta impedância."
      ],
      correta: 0
    },
    {
      id: 2,
      pergunta: "Na tabela verdade, em quais saídas focamos para extrair os mintermos?",
      opcoes: [
        "Nas saídas de valor 0.",
        "Nas saídas de valor 1.",
        "Nas saídas irrelevantes (Don't Care).",
        "Apenas na última linha da tabela."
      ],
      correta: 1
    }
  ],
  "maxtermos": [
    {
      id: 1,
      pergunta: "Qual das seguintes afirmações define um maxtermo?",
      opcoes: [
        "Um produto lógico (AND) que resulta em 1.",
        "Uma soma lógica (OR) que resulta em 0 para uma única combinação.",
        "Uma função que não pode ser simplificada.",
        "O inverso de um mapa de Karnaugh."
      ],
      correta: 1
    }
  ],
  "karnaugh": [ 
    {
      id: 1,
      pergunta: "Qual código de numeração é utilizado na organização de um Mapa de Karnaugh?",
      opcoes: [
        "Código Binário Natural",
        "Código BCD",
        "Código Gray",
        "Código Hexadecimal"
      ],
      correta: 2
    }
  ]
};

// --- CONFIGURAÇÃO DA IA ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 

// --- ROTAS DA API ---

// 1. Rota para procurar os dados do vídeo
app.get('/api/cursos/:id', (req, res) => {
    const curso = courses[req.params.id];
    if (curso) {
        res.json(curso);
    } else {
        res.status(404).json({ erro: "Curso não encontrado" });
    }
});

// 2. Rotas para as Anotações
app.get('/api/notas', (req, res) => {
    const cursoId = req.query.cursoId;
    if (cursoId) {
        const notasFiltradas = listaDeNotas.filter(nota => nota.cursoId === cursoId); 
        res.json(notasFiltradas);
    } else {
        res.json(listaDeNotas);
    }
});

app.post('/api/notas', (req, res) => {
    const { titulo, subtitulo, texto, cor, cursoId } = req.body;
    const novaNota = { id: Date.now(), titulo, subtitulo, texto, cor, cursoId }; 
    listaDeNotas.push(novaNota);
    res.status(201).json(novaNota);
});

// ROTA ADICIONADA: Permite atualizar/editar uma anotação existente no servidor 
app.put('/api/notas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, subtitulo, texto, cor, cursoId } = req.body;
    
    const indice = listaDeNotas.findIndex(nota => nota.id === id);
    
    if (indice !== -1) {
        listaDeNotas[indice] = { id, titulo, subtitulo, texto, cor, cursoId };
        res.json(listaDeNotas[indice]);
    } else {
        res.status(404).json({ erro: "Anotação não encontrada para edição." });
    }
});

app.delete('/api/notas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    listaDeNotas = listaDeNotas.filter(nota => nota.id !== id); 
    res.json({ mensagem: "Nota excluída com sucesso" }); 
});

// 3. Rota segura para o Gemini (Retornando a pergunta original)
app.post('/api/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        const { pergunta } = req.body; 

        // 👇 AQUI ESTÁ A MODIFICAÇÃO QUE ADICIONEI 👇
        const promptEducacional = `Você é uma IA educacional amigável do FocusLab. Responda de forma curta, didática e use formatação limpa. NUNCA use formatação matemática LaTeX (como os símbolos $ e $$) ou caracteres especiais de código em suas respostas. Use apenas texto simples. Pergunta do aluno: ${pergunta}`;
        
        const result = await model.generateContent(promptEducacional);
        
        res.json({ 
            pergunta: pergunta, 
            resposta: result.response.text() 
        });
    } catch (error) {
        console.error("Erro no Gemini:", error);
        res.status(500).json({ erro: "Falha ao processar a inteligência artificial." });
    }
});

// 4. A ROTA QUE ENVIA AS PERGUNTAS DO QUIZ PARA O FRONT-END
app.get('/api/quiz/:cursoId', (req, res) => {
  const cursoId = req.params.cursoId;
  
  if (bancoQuiz[cursoId]) {
    res.json(bancoQuiz[cursoId]); 
  } else {
    res.status(404).json({ erro: "Quiz não encontrado para esta aba." }); 
  }
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`🚀 Servidor do FocusLab a correr na porta ${PORT}`); 
});
