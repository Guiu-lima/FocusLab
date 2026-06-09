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

// BANCO DE DADOS DO QUIZ (Corrigido e Estruturado)
const bancoQuiz = {
  "mintermos": [
    {
      "id": 1,
      "pergunta": "O que representa fundamentalmente um mintermo?",
      "opcoes": [
        "Um produto lógico (AND) que resulta em 1 para uma única combinação.",
        "Uma soma lógica (OR) que resulta em 0 para uma única combinação.",
        "A simplificação máxima de uma expressão booleana.",
        "O mapeamento de saídas em alta impedância."
      ],
      "correta": 0
    },
    {
      "id": 2,
      "pergunta": "Na tabela verdade, em quais saídas focamos para extrair os mintermos?",
      "opcoes": [
        "Nas saídas de valor 0.",
        "Nas saídas de valor 1.",
        "Nas saídas irrelevantes (Don't Care).",
        "Apenas na última linha da tabela."
      ],
      "correta": 1
    },
    {
      "id": 3,
      "pergunta": "Se uma variável de entrada A tem valor 0 numa determinada linha, como ela é representada no mintermo?",
      "opcoes": [
        "A (forma normal)",
        "A' (forma invertida ou barrada)",
        "1 (nível lógico alto)",
        "Ela é omitida do produto"
      ],
      "correta": 1
    },
    {
      "id": 4,
      "pergunta": "Uma expressão obtida através da soma de vários mintermos é formalmente conhecida como:",
      "opcoes": [
        "Produto de Somas (PoS)",
        "Forma Canónica de Maxtermos",
        "Soma de Produtos (SoP)",
        "Expressão Linear Universal"
      ],
      "correta": 2
    },
    {
      "id": 5,
      "pergunta": "Para 3 variáveis de entrada (A, B, C), quantos mintermos possíveis existem no total?",
      "opcoes": [
        "3 mintermos",
        "6 mintermos",
        "8 mintermos",
        "16 mintermos"
      ],
      "correta": 2
    },
    {
      "id": 6,
      "pergunta": "Se uma função booleana possui as variáveis A, B e C, qual mintermo abaixo corresponde à linha decimal 5 (binário 101)?",
      "opcoes": [
        "A' B C'",
        "A B' C",
        "A B C'",
        "A' B' C"
      ],
      "correta": 1
    },
    {
      "id": 7,
      "pergunta": "Se as variáveis de entrada são A=1, B=0, C=1, qual é o mintermo correspondente?",
      "opcoes": [
        "A' B C'",
        "A B' C",
        "A' B' C'",
        "A B C"
      ],
      "correta": 1
    },
    {
      "id": 8,
      "pergunta": "O conceito de mintermo está diretamente associado à lógica de decodificação. Se a expressão de um mintermo é A B C' D, qual é a única combinação de entradas que activa este termo em nível alto (1)?",
      "opcoes": [
        "A=0, B=0, C=1, D=0",
        "A=1, B=1, C=1, D=1",
        "A=1, B=1, C=0, D=1",
        "A=0, B=1, C=0, D=1"
      ],
      "correta": 2
    },
    {
      "id": 9,
      "pergunta": "Por que dizemos que a porta lógica AND realiza nativamente a operação de um mintermo isolado?",
      "opcoes": [
        "Porque a porta AND só produz uma saída nível alto (1) se todas as suas entradas forem verdadeiras, simulando exatamente a condição única de ativação do mintermo.",
        "Porque a porta AND inverte os bits de entrada automaticamente antes de somá-los.",
        "Porque ela força qualquer combinação de zeros a virar um resultado nulo na saída do circuito ou.",
        "Porque o mintermo trabalha exclusivamente com a soma lógica de variáveis não invertidas."
      ],
      "correta": 0
    },
    {
      "id": 10,
      "pergunta": "Por que motivo chamamos os mintermos de representação canónica bruta?",
      "opcoes": [
        "Porque contêm todas as variáveis da função em cada termo, antes de qualquer simplificação.",
        "Porque usam apenas inversores lógicos.",
        "Porque resultam sempre numa saída igual a 0.",
        "Porque não podem ser convertidos para mapas de Karnaugh."
      ],
      "correta": 0
    }
  ],
  "maxtermos": [
    {
      "id": 1,
      "pergunta": "Qual das seguintes afirmações define corretamente um maxtermo?",
      "opcoes": [
        "Um produto lógico (AND) que resulta em 1.",
        "Uma soma lógica (OR) que resulta em 0 para uma única combinação de variáveis.",
        "Uma função lógica universal que não aceita inversões.",
        "O inverso absoluto de um mapa de Karnaugh."
      ],
      "correta": 1
    },
    {
      "id": 2,
      "pergunta": "Ao extrair a primeira forma canónica por maxtermos, in quais saídas da tabela verdade nos devemos focar?",
      "opcoes": [
        "Nas saídas de valor 1.",
        "Nas saídas irrelevantes (Don't Care).",
        "Nas saídas de valor 0.",
        "Apenas nas linhas pares da tabela verdade."
      ],
      "correta": 2
    },
    {
      "id": 3,
      "pergunta": "Na lógica dos maxtermos, se a variável de entrada A vale 1 numa linha, como ela entra na expressão da soma?",
      "opcoes": [
        "A (forma normal)",
        "A' (forma invertida ou barrada)",
        "0 (nível lógico baixo)",
        "Ela é multiplicada por zero"
      ],
      "correta": 1
    },
    {
      "id": 4,
      "pergunta": "Ao analisar um maxtermo isolado expressa por (A + B' + C), qual alternativa descreve o comportamento correto da sua porta OR correspondente?",
      "opcoes": [
        "A saída será obrigatoriamente 0 se, e somente se, as entradas forem A=0, B=1 e C=0.",
        "A saída será 1 para qualquer combinação que contenha a variável A em nível baixo.",
        "Esta expressão representa uma multiplicação camuflada que gera nível alto.",
        "O circuito falhará se a variável B for desconectada do barramento principal."
      ],
      "correta": 0
    },
    {
      "id": 5,
      "pergunta": "Se uma função booleana é expressa na sua forma canónica de maxtermos como F(A,B,C) = ΠM(1, 4), o que isso significa sobre o comportamento do circuito?",
      "opcoes": [
        "A saída do circuito será igual a 0 apenas nas linhas decimais 1 e 4 da tabela verdade.",
        "O circuito terá saídas em nível alto (1) apenas nas lines 1 e 4.",
        "Existem apenas duas linhas válidas em toda a tabela verdade.",
        "As linhas 1 e 4 devem ser ignoradas por serem condições irrelevantes."
      ],
      "correta": 0
    },
    {
      "id": 6,
      "pergunta": "Para 3 variáveis, o maxtermo M0 (M-zero) representa a combinação A=0, B=0 e C=0. Como fica a sua soma lógica?",
      "opcoes": [
        "A' + B' + C'",
        "A . B . C",
        "A + B + C",
        "A' . B' . C'"
      ],
      "correta": 2
    },
    {
      "id": 7,
      "pergunta": "Se as variáveis de entrada são A=1, B=1, C=0, qual é o maxtermo correspondente para essa linha?",
      "opcoes": [
        "A' + B' + C",
        "A + B + C'",
        "A' . B' . C",
        "A + B + C"
      ],
      "correta": 0
    },
    {
      "id": 8,
      "pergunta": "Qual porta lógica realiza nativamente a operação de um maxtermo individual?",
      "opcoes": [
        "Porta AND",
        "Porta NAND",
        "Porta OR",
        "Porta NOT"
      ],
      "correta": 2
    },
    {
      "id": 9,
      "pergunta": "Num sistema de 3 variáveis, o termo (A' + B + C') corresponde a qual índice de maxtermo?",
      "opcoes": [
        "M2 (010)",
        "M5 (101)",
        "M7 (111)",
        "M4 (100)"
      ],
      "correta": 1
    },
    {
      "id": 10,
      "pergunta": "Quando é mais vantajoso utilizar a simplificação por Maxtermos (Produto de Somas) em vez de Mintermos?",
      "opcoes": [
        "Quando a tabela verdade possui muito menos saídas '0' do que saídas '1'.",
        "Quando o circuito não pode usar inversores.",
        "親 Quando o número de variáveis é ímpar.",
        "Sempre que o circuito for puramente sequencial."
      ],
      "correta": 0
    }
  ],
  "karnaugh": [
    {
      "id": 1,
      "pergunta": "Por que razão a ordem das colunas num Mapa de Karnaugh de 4 variáveis segue a sequência 00, 01, 11, 10 em vez da ordem binária convencional?",
      "opcoes": [
        "Para garantir a adjacência lógica, onde apenas uma variável muda de estado por vez entre células vizinhas.",
        "Para reduzir o espaço físico ocupado pelo diagrama na interface.",
        "Porque a eletrónica digital impede a leitura consecutiva de bits pares.",
        "Para seguir o padrão de contagem dos microcontroladores clássicos."
      ],
      "correta": 0
    },
    {
      "id": 2,
      "pergunta": "O Mapa de Karnaugh pode ser visto graficamente como uma representação plana de qual forma geométrica tridimensional devido à propriedade de suas bordas?",
      "opcoes": [
        "Um Toroide (formato de rosca/cilindro fechado nas extremidades).",
        "Uma Pirâmide de base quadrangular.",
        "Um Esferoide perfeito.",
        "Um Prisma triangular regular."
      ],
      "correta": 0
    },
    {
      "id": 3,
      "pergunta": "Ao fazer agrupamentos num Mapa de Karnaugh, os grupos de células contendo '1' devem conter obrigatoriamente quantidades baseadas em:",
      "opcoes": [
        "Números múltiplos de 3 (3, 6, 9...)",
        "Potências de 2 (1, 2, 4, 8, 16...)",
        "Apenas números ímpares (1, 3, 5, 7...)",
        "Qualquer quantidade, desde que formem um quadrado"
      ],
      "correta": 1
    },
    {
      "id": 4,
      "pergunta": "O que acontece com uma variável de entrada quando ela muda de estado (de 0 para 1 ou vice-versa) dentro de um mesmo grupo enlaçado?",
      "opcoes": [
        "Ela é mantida na sua forma barrada.",
        "Ela é eliminada da expressão simplificada final.",
        "Ela duplica o seu peso na equação.",
        "Causa um erro de indeterminação no circuito."
      ],
      "correta": 1
    },
    {
      "id": 5,
      "pergunta": "Um agrupamento de 4 bits adjacentes (uma quadra) num Mapa de Karnaugh elimina quantas variáveis da expressão final?",
      "opcoes": [
        "1 variável",
        "2 variáveis",
        "3 variáveis",
        "4 variáveis"
      ],
      "correta": 1
    },
    {
      "id": 6,
      "pergunta": "As bordas extremas de um Mapa de Karnaugh (esquerda/direita e topo/fundo) podem ser agrupadas entre si?",
      "opcoes": [
        "Não, os agrupamentos só valem para células que partilham bordas internas.",
        "Sim, porque o mapa é geometricamente considerado toroidal (funciona como um cilindro fechado).",
        "Apenas se todas as outras células centrais forem zero.",
        "Apenas em mapas de 2 variáveis."
      ],
      "correta": 1
    },
    {
      "id": 7,
      "pergunta": "Ao agrupar os '1s' num Mapa de Karnaugh, qual das seguintes regras de seleção de vizinhos é totalmente proibida?",
      "opcoes": [
        "Fazer agrupamentos na diagonal.",
        "Agrupar células na vertical.",
        "Agrupar células na horizontal.",
        "Unir os quatro cantos extremos do mapa."
      ],
      "correta": 0
    },
    {
      "id": 8,
      "pergunta": "Um grupo de 8 células agrupadas (um octeto) num mapa de 4 variáveis resulta num termo final com quantas variáveis?",
      "opcoes": [
        "Apenas 1 variável.",
        "2 variáveis.",
        "3 variáveis.",
        "Nenhuma, a saída vira uma constante estável."
      ],
      "correta": 0
    },
    {
      "id": 9,
      "pergunta": "Ao simplificar expressões lógicas, qual é o principal objetivo prático de se obter grupos o maior possível no Mapa de Karnaugh?",
      "opcoes": [
        "Minimizar o atraso de propagação dos sinais através da redução de literais e do hardware necessário.",
        "Reduzir o custo financeiro, a quantidade de portas lógicas e o consumo de hardware do circuito integrado.",
        "Garantir que a resposta seja enviada em formato JSON.",
        "Forçar a expressão a virar um Produto de Somas."
      ],
      "correta": 1
    },
    {
      "id": 10,
      "pergunta": "Ao resolver um problem prático no papel, tens um mapa de 3 variáveis com '1s' localizados nas células m0, m2, m4 e m6. Qual é a estratégia correta de desenho para obter a resposta simplificada?",
      "opcoes": [
        "Desenhar um único enlace de 4 células (quadra) unindo as duas colunas externas, o que elimina duas variáveis e resulta apenas na variável estável em zero.",
        "Desenhar quatro laços isolados de 1 célula cada para manter a precisão bruta.",
        "Ligar m0 a m2 na horizontal e m4 a m6 na horizontal, criando dois grupos separados que não se cruzam.",
        "O problema não pode ser resolvido no papel por falta de adjacências diretas no meio do mapa."
      ],
      "correta": 0
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

// 3. Rota segura para o Gemini
app.post('/api/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        const { pergunta } = req.body; 

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
