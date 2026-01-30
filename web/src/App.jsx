import { useEffect, useState } from "react";

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
    <div style={{
  minHeight: "100vh",
  background: "#121212",
  color: "#eaeaea",
  padding: 48,
  fontFamily: "Inter, Arial, sans-serif"
}}>
  <div style={{
    maxWidth: 820,
    margin: "0 auto",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 28
  }}>

      <h1>Sistema de Ponto</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Login do usuário</label>
        <br />
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="ex: user1"
          style={{ padding: 8, width: 220 }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          disabled={batidosHoje.ENTRADA}
          onClick={() => baterPonto("ENTRADA")}
        >
          Entrada
        </button>

        <button
          disabled={batidosHoje.SAIDA_ALMOCO}
          onClick={() => baterPonto("SAIDA_ALMOCO")}
        >
          Saída Almoço
        </button>

        <button
          disabled={batidosHoje.VOLTA_ALMOCO}
          onClick={() => baterPonto("VOLTA_ALMOCO")}
        >
          Volta Almoço
        </button>

        <button disabled={batidosHoje.SAIDA} onClick={() => baterPonto("SAIDA")}>
          Saída
        </button>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Marcações de hoje</h3>
        <li>Entrada: {formatHora(horariosHoje.ENTRADA)}</li>
        <li>Saída Almoço: {formatHora(horariosHoje.SAIDA_ALMOCO)}</li>
        <li>Volta Almoço: {formatHora(horariosHoje.VOLTA_ALMOCO)}</li>
        <li>Saída: {formatHora(horariosHoje.SAIDA)}</li>

      </div>

      {mensagem && (
        <div style={{ marginTop: 20 }}>
          <strong>{mensagem}</strong>
        </div>
      )}
    </div>
    </div>

  );
}

export default App;
