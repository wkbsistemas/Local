import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, updateDoc, increment, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Substitua com as credenciais obtidas no Console do Firebase (Geral > Seus aplicativos)
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "simula-voto-para.firebaseapp.com",
    projectId: "simula-voto-para",
    storageBucket: "simula-voto-para.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Atualização de dados em tempo real
onSnapshot(collection(db, "candidatos"), (snapshot) => {
    let totalVotos = 0;
    const dados = {};

    snapshot.forEach((doc) => {
        const val = doc.data().votos || 0;
        dados[doc.id] = val;
        totalVotos += val;
    });

    // Atualiza barras e porcentagens dos documentos 'daniel' e 'hanna'
    ['daniel', 'hanna'].forEach(id => {
        const votos = dados[id] || 0;
        const pct = totalVotos > 0 ? ((votos / totalVotos) * 100).toFixed(1) : 0;
        
        const bar = document.getElementById(`bar-${id}`);
        const pctText = document.getElementById(`pct-${id}`);
        
        if (bar) bar.style.width = `${pct}%`;
        if (pctText) pctText.innerText = `${pct}% (${votos} votos)`;
    });
});

// Registrar voto e bloquear votos duplicados
window.votar = async function(docId) {
    if (localStorage.getItem('ja_votou_simulacao')) {
        alert('Você já registrou seu voto!');
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
        alert('Erro ao computar voto. Verifique se as regras foram publicadas no Firestore.');
    }
};

// Exibição da Data e Hora
function updateClock() {
    const now = new Date();
    const el = document.getElementById('datetime');
    if (el) el.innerText = now.toLocaleString('pt-BR');
}
setInterval(updateClock, 1000);
updateClock();

// Botão para compartilhar
window.compartilhar = function() {
    if (navigator.share) {
        navigator.share({
            title: 'SimulaVotoPará2026',
            text: 'Participe da simulação em tempo real:',
            url: window.location.href,
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiado!');
    }
};
