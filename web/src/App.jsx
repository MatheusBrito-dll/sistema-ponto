import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [login, setLogin] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [batidosHoje, setBatidosHoje] = useState({
    ENTRADA: false,
    SAIDA_ALMOCO: false,
    VOLTA_ALMOCO: false,
    SAIDA: false,
  });

  const [horariosHoje, setHorariosHoje] = useState({
    ENTRADA: null,
    SAIDA_ALMOCO: null,
    VOLTA_ALMOCO: null,
    SAIDA: null,
  });

  useEffect(() => {
    async function carregarBatidos() {
      if (!login) {
        setBatidosHoje({
          ENTRADA: false,
          SAIDA_ALMOCO: false,
          VOLTA_ALMOCO: false,
          SAIDA: false,
        });
        setHorariosHoje({
          ENTRADA: null,
          SAIDA_ALMOCO: null,
          VOLTA_ALMOCO: null,
          SAIDA: null,
        });
        return;
      }

      try {
        const resp = await fetch(
          `http://localhost:3001/pontos/hoje?login=${encodeURIComponent(login)}`
        );
        const data = await resp.json();

        if (!resp.ok) {
          setMensagem(data.error || "Erro ao carregar marcações de hoje");
          return;
        }

        setMensagem("");
        setBatidosHoje({
          ENTRADA: !!data.batidos?.ENTRADA,
          SAIDA_ALMOCO: !!data.batidos?.SAIDA_ALMOCO,
          VOLTA_ALMOCO: !!data.batidos?.VOLTA_ALMOCO,
          SAIDA: !!data.batidos?.SAIDA,
        });

        setHorariosHoje({
          ENTRADA: data.horarios?.ENTRADA,
          SAIDA_ALMOCO: data.horarios?.SAIDA_ALMOCO,
          VOLTA_ALMOCO: data.horarios?.VOLTA_ALMOCO,
          SAIDA: data.horarios?.SAIDA,
        });
      } catch (err) {
        setMensagem("Erro de conexão ao carregar marcações de hoje");
      }
    }

    carregarBatidos();
  }, [login]);

  async function baterPonto(tipo) {
    if (!login) {
      setMensagem("Informe o login do usuário");
      return;
    }

    try {
      const resp = await fetch("http://localhost:3001/pontos/bater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, tipo }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setMensagem(data.error || "Erro ao bater ponto");
        return;
      }

      setMensagem(`Ponto registrado: ${tipo}`);
      setBatidosHoje((prev) => ({ ...prev, [tipo]: true }));
      setHorariosHoje((prev) => ({
        ...prev,
        [tipo]: new Date().toISOString(),
      }));
    } catch (err) {
      setMensagem("Erro de conexão com a API");
    }
  }

  function formatHora(valor) {
    if (!valor) return "-";
    const d = new Date(valor);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="app">
      <div className="app__glow" aria-hidden="true" />
      <main className="app__container">
        <header className="app__header">
          <div>
            <p className="app__eyebrow">Sistema de ponto</p>
            <h1>Controle de jornada</h1>
            <p className="app__subtitle">
              Registre entradas e pausas com poucos cliques e acompanhe as
              marcações do dia em tempo real.
            </p>
          </div>
          <div className="app__badge">
            <span>Hoje</span>
            <strong>Fluxo rápido</strong>
          </div>
        </header>

        <section className="card">
          <div className="card__header">
            <div>
              <h2>Identificação</h2>
              <p>Informe o login para carregar as marcações atuais.</p>
            </div>
            <div className="input">
              <label htmlFor="login">Login do usuário</label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="ex: user1"
              />
            </div>
          </div>

          <div className="actions">
            <button
              className="btn btn--primary"
              disabled={batidosHoje.ENTRADA}
              onClick={() => baterPonto("ENTRADA")}
            >
              Entrada
            </button>

            <button
              className="btn"
              disabled={batidosHoje.SAIDA_ALMOCO}
              onClick={() => baterPonto("SAIDA_ALMOCO")}
            >
              Saída Almoço
            </button>

            <button
              className="btn"
              disabled={batidosHoje.VOLTA_ALMOCO}
              onClick={() => baterPonto("VOLTA_ALMOCO")}
            >
              Volta Almoço
            </button>

            <button
              className="btn btn--ghost"
              disabled={batidosHoje.SAIDA}
              onClick={() => baterPonto("SAIDA")}
            >
              Saída
            </button>
          </div>

          <div className="status">
            <div>
              <h3>Marcações de hoje</h3>
              <p>Acompanhe o status do dia em um só lugar.</p>
            </div>
            <ul>
              <li>
                <span>Entrada</span>
                <strong>{formatHora(horariosHoje.ENTRADA)}</strong>
              </li>
              <li>
                <span>Saída Almoço</span>
                <strong>{formatHora(horariosHoje.SAIDA_ALMOCO)}</strong>
              </li>
              <li>
                <span>Volta Almoço</span>
                <strong>{formatHora(horariosHoje.VOLTA_ALMOCO)}</strong>
              </li>
              <li>
                <span>Saída</span>
                <strong>{formatHora(horariosHoje.SAIDA)}</strong>
              </li>
            </ul>
          </div>

          {mensagem && (
            <div className="alert">
              <strong>{mensagem}</strong>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
