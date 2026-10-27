// Atividade 1 - Calendário de feriados com a BrasilAPI
const campoAno = document.getElementById('ano');
const tabela = document.getElementById('tabelaFeriados');
const mensagem = document.getElementById('mensagem');
const total = document.getElementById('total');
const proximo = document.getElementById('proximo');
const botao = document.getElementById('btnConsultar');
const diasDaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

campoAno.value = new Date().getFullYear();

// Compara apenas os dias do calendário, evitando diferenças por horário de verão.
function numeroDoDia(data) {
    return Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / 86400000;
}

function mostrarProximoFeriado(feriados) {
    const hoje = numeroDoDia(new Date());
    const futuros = feriados.filter(feriado => {
        return numeroDoDia(new Date(feriado.date + 'T12:00:00')) >= hoje;
    });
    futuros.sort((a, b) => a.date.localeCompare(b.date));
    proximo.hidden = false;

    if (futuros.length === 0) {
        proximo.textContent = 'Não há mais feriados a partir de hoje no ano consultado. Consulte um ano seguinte.';
        return;
    }

    const feriado = futuros[0];
    const data = new Date(feriado.date + 'T12:00:00');
    const dias = numeroDoDia(data) - hoje;
    const prazo = dias === 0 ? 'É hoje!' : (dias === 1 ? 'Falta 1 dia.' : `Faltam ${dias} dias.`);
    proximo.textContent = `Próximo feriado do ano consultado: ${feriado.name} (${data.toLocaleDateString('pt-BR')}). ${prazo}`;
}

function consultarFeriados() {
    if (botao.disabled) return;
    const ano = campoAno.value.trim();
    tabela.replaceChildren();
    total.textContent = '';
    proximo.textContent = '';
    proximo.hidden = true;
    mensagem.className = '';

    if (ano === '' || !Number.isInteger(Number(ano))) {
        mensagem.className = 'erro';
        mensagem.textContent = 'Digite um ano inteiro válido.';
        return;
    }

    mensagem.textContent = 'Consultando feriados...';
    botao.disabled = true;
    campoAno.disabled = true;

    return fetch(`https://brasilapi.com.br/api/feriados/v1/${Number(ano)}`)
        .then(response => {
            if (!response.ok) {
                if (response.status === 400 || response.status === 404 || response.status === 422) {
                    throw new Error('Ano inválido ou não disponível. Consulte um ano entre 1900 e 2199.');
                }
                throw new Error('A API está indisponível no momento. Tente novamente.');
            }
            return response.json();
        })
        .then(feriados => {
            if (!Array.isArray(feriados)) {
                throw new Error('A API retornou uma resposta inesperada.');
            }
            feriados.sort((a, b) => a.date.localeCompare(b.date));
            total.textContent = `Total de feriados em ${Number(ano)}: ${feriados.length}`;

            feriados.forEach(feriado => {
                const data = new Date(feriado.date + 'T12:00:00');
                const dia = data.getDay();
                const linha = document.createElement('tr');
                if (dia === 0 || dia === 6) {
                    linha.classList.add('fim-de-semana');
                }

                // textContent insere os nomes da API como texto, sem interpretar HTML.
                [data.toLocaleDateString('pt-BR'), diasDaSemana[dia], feriado.name].forEach(valor => {
                    const celula = document.createElement('td');
                    celula.textContent = valor;
                    linha.appendChild(celula);
                });
                tabela.appendChild(linha);
            });

            mostrarProximoFeriado(feriados);
            mensagem.textContent = feriados.length ? 'Consulta concluída.' : 'Nenhum feriado encontrado para esse ano.';
        })
        .catch(erro => {
            tabela.replaceChildren();
            total.textContent = '';
            proximo.hidden = true;
            mensagem.className = 'erro';
            mensagem.textContent = erro instanceof TypeError
                ? 'Não foi possível consultar os feriados. Verifique sua conexão e tente novamente.'
                : erro.message;
        })
        .finally(() => {
            botao.disabled = false;
            campoAno.disabled = false;
        });
}

document.getElementById('formulario').addEventListener('submit', function (evento) {
    evento.preventDefault();
    consultarFeriados();
});
