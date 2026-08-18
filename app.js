import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "simula-voto-para.firebaseapp.com",
    projectId: "simula-voto-para",
    storageBucket: "simula-voto-para.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Informações padrões caso os nomes no banco venham apenas em minúsculas
const candidatosInfo = {
    'daniel': { nome: 'Daniel', foto: 'daniel.png' },
    'hanna': { nome: 'Hanna', foto: 'hanna.png' }
};

onSnapshot(collection(db, "candidatos"), (snapshot) => {
    let totalVotos = 0;
    const listaCandidatos = [];

    snapshot.forEach((doc) => {
        const id = doc.id.toLowerCase();
        const votos = doc.data().votos || 0;
        totalVotos += votos;

        const info = candidatosInfo[id] || { 
            nome: doc.id.charAt(0).toUpperCase() + doc.id.slice(1), 
            foto: `${id}.png` 
        };

        listaCandidatos.push({
            id: doc.id,
            nome: info.nome,
            foto: info.foto,
            votos: votos
        });
    });

    // Se o banco ainda estiver vazio, insere os dois para não ficar em branco no teste
    if (listaCandidatos.length === 0) {
        listaCandidatos.push(
            { id: 'daniel', nome: 'Daniel', foto: 'daniel.png', votos: 0 },
            { id: 'hanna', nome: 'Hanna', foto: 'hanna.png', votos: 0 }
        );
    }

    // REGRA DE ORDENAÇÃO: Quem tem mais votos fica em 1º lugar
    listaCandidatos.sort((a, b) => b.votos - a.votos);

    const totalEl = document.getElementById('total-votos-header');
    if (totalEl) totalEl.innerText = `Total de votos: ${totalVotos}`;

    renderizarLista(listaCandidatos, totalVotos);
}, (error) => {
    console.error("Erro no Firestore:", error);
    // Caso falhe as regras, renderiza com zero votos para não sumir da tela
    renderizarLista([
        { id: 'daniel', nome: 'Daniel', foto: 'daniel.png', votos: 0 },
        { id: 'hanna', nome: 'Hanna', foto: 'hanna.png', votos: 0 }
    ], 0);
});

function renderizarLista(candidatos, totalVotos) {
    const container = document.getElementById('candidates-list');
    if (!container) return;

    container.innerHTML = '';

    candidatos.forEach((c) => {
        const pct = totalVotos > 0 ? ((c.votos / totalVotos) * 100).toFixed(1) : 0;

        const card = document.createElement('div');
        card.className = 'candidato-card';
        card.innerHTML = `
            <img src="${c.foto}" alt="${c.nome}" class="candidato-img" onerror="this.src='https://via.placeholder.com/50'">
            <div class="candidato-info">
                <div class="candidato-header">
                    <span class="candidato-nome">${c.nome}</span>
                    <span class="candidato-pct">${pct}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${pct}%"></div>
                </div>
                <span class="votos-qtd">${c.votos} votos</span>
            </div>
            <button class="btn-votar" onclick="votar('${c.id}')">Votar</button>
        `;
        container.appendChild(card);
    });
}

window.votar = async function(docId) {
    if (localStorage.getItem('ja_votou_simulacao')) {
        alert('Você já registrou seu voto nesta pesquisa!');
        return;
    }

    const confirmacao = confirm("Deseja confirmar seu voto?");
    if (!confirmacao) return;

    try {
        const docRef = doc(db, "candidatos", docId);
        await updateDoc(docRef, {
            votos: increment(1)
        });
        localStorage.setItem('ja_votou_simulacao', 'true');
        alert('Voto registrado com sucesso!');
    } catch (err) {
        console.error("Erro ao registrar voto:", err);
        alert('Erro ao registrar voto. Verifique se publicou as Regras no Firestore.');
    }
};

function updateClock() {
    const now = new Date();
    const el = document.getElementById('datetime');
    if (el) el.innerText = now.toLocaleString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

window.compartilhar = function() {
    if (navigator.share) {
        navigator.share({
            title: 'Pesquisa Eleitoral',
            text: 'Confira os resultados parciais:',
            url: window.location.href,
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiado!');
    }
};
