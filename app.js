import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Insira as chaves do seu projeto Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "simula-voto-para.firebaseapp.com",
    projectId: "simula-voto-para",
    storageBucket: "simula-voto-para.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mapeamento das informações dos candidatos
const candidatosInfo = {
    'daniel': { nome: 'Daniel', foto: 'daniel.png' },
    'hanna': { nome: 'Hanna', foto: 'hanna.png' }
};

// Escuta em tempo real o Cloud Firestore
onSnapshot(collection(db, "candidatos"), (snapshot) => {
    let totalVotos = 0;
    const listaCandidatos = [];

    snapshot.forEach((doc) => {
        const id = doc.id;
        const votos = doc.data().votos || 0;
        totalVotos += votos;

        if (candidatosInfo[id]) {
            listaCandidatos.push({
                id: id,
                nome: candidatosInfo[id].nome,
                foto: candidatosInfo[id].foto,
                votos: votos
            });
        }
    });

    // REGRA DE ORDENAÇÃO: Ordena do maior para o menor número de votos
    listaCandidatos.sort((a, b) => b.votos - a.votos);

    // Atualiza o total de votos no topo
    const totalEl = document.getElementById('total-votos-header');
    if (totalEl) totalEl.innerText = `Total de votos: ${totalVotos}`;

    // Renderiza a lista na tela já ordenada
    renderizarLista(listaCandidatos, totalVotos);
});

function renderizarLista(candidatos, totalVotos) {
    const container = document.getElementById('candidates-list');
    if (!container) return;

    container.innerHTML = ''; // Limpa para reordenar

    candidatos.forEach((c) => {
        const pct = totalVotos > 0 ? ((c.votos / totalVotos) * 100).toFixed(1) : 0;

        const card = document.createElement('div');
        card.className = 'candidato-card';
        card.innerHTML = `
            <img src="${c.foto}" alt="${c.nome}" class="candidato-img">
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

// Registrar voto com bloqueio LocalStorage
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
        alert('Voto registrado!');
    } catch (err) {
        console.error("Erro ao registrar no Firestore:", err);
        alert('Erro ao registrar voto. Verifique a publicação das regras no Cloud Firestore.');
    }
};

// Relógio
function updateClock() {
    const now = new Date();
    const el = document.getElementById('datetime');
    if (el) el.innerText = now.toLocaleString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

// Compartilhamento
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
