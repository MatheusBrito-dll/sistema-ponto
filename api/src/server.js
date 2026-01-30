import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// health check
app.get("/health", async (req, res) => {
  const r = await pool.query("SELECT 1 as ok");
  res.json({ ok: true, db: r.rows[0].ok });
});

/**
 * Bater ponto
 * POST /pontos/bater
 * body: { login: "user1", tipo: "ENTRADA" | "SAIDA_ALMOCO" | "VOLTA_ALMOCO" | "SAIDA", momento?: ISO string }
 */
app.post("/pontos/bater", async (req, res) => {
  try {
    const { login, tipo, momento } = req.body ?? {};

    if (!login || !tipo) {
      return res.status(400).json({ ok: false, error: "login e tipo são obrigatórios" });
    }

    const tiposValidos = new Set(["ENTRADA", "SAIDA_ALMOCO", "VOLTA_ALMOCO", "SAIDA"]);
    if (!tiposValidos.has(tipo)) {
      return res.status(400).json({ ok: false, error: "tipo inválido" });
    }

    // Momento: se vier do cliente, usa. Senão, usa now() do banco.
    // Vamos usar o fuso America/Cuiaba para calcular a "data" corretamente.
    const momentoISO = momento ? new Date(momento).toISOString() : null;

    // 1) pega usuario_id pelo login
    const u = await pool.query(
      "SELECT usuario_id, nome, ativo FROM usuarios WHERE login = $1",
      [login]
    );
    if (u.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "usuário não encontrado" });
    }
    if (!u.rows[0].ativo) {
      return res.status(403).json({ ok: false, error: "usuário inativo" });
    }

    const usuarioId = u.rows[0].usuario_id;

    // 2) Insere o ponto
    // data = (momento no fuso Cuiaba) :: date
    // Se momento não vier, usa now() do banco
    const insertSql = `
      INSERT INTO pontos (usuario_id, data, tipo, momento, origem_pc, ip)
      VALUES (
        $1,
        (COALESCE($2::timestamptz, now()) AT TIME ZONE 'America/Cuiaba')::date,
        $3,
        COALESCE($2::timestamptz, now()),
        $4,
        $5
      )
      RETURNING ponto_id, usuario_id, data, tipo, momento
    `;

    const origemPc =
      req.headers["x-pc-name"] ? String(req.headers["x-pc-name"]).slice(0, 120) : null;

    const ip =
      req.headers["x-forwarded-for"]
        ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
        : req.socket.remoteAddress;

    const r = await pool.query(insertSql, [usuarioId, momentoISO, tipo, origemPc, ip]);

    return res.json({ ok: true, ponto: r.rows[0] });
  } catch (err) {
    // conflito de "já bateu esse tipo no dia"
    if (String(err?.code) === "23505") {
      return res.status(409).json({
        ok: false,
        error: "Já existe essa marcação (tipo) para este usuário nesse dia",
      });
    }
    console.error(err);
    return res.status(500).json({ ok: false, error: "Erro interno" });
  }
});
/**
 * Ver quais marcações já foram batidas hoje
 * GET /pontos/hoje?login=user1
 */
app.get("/pontos/hoje", async (req, res) => {
  try {
    const login = String(req.query.login || "").trim();
    if (!login) {
      return res.status(400).json({ ok: false, error: "login é obrigatório" });
    }

    const u = await pool.query(
      "SELECT usuario_id, ativo FROM usuarios WHERE login = $1",
      [login]
    );

    if (u.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "usuário não encontrado" });
    }
    if (!u.rows[0].ativo) {
      return res.status(403).json({ ok: false, error: "usuário inativo" });
    }

    const usuarioId = u.rows[0].usuario_id;

    // Data de hoje no fuso de Cuiabá
    const hojeRes = await pool.query(
      "SELECT (now() AT TIME ZONE 'America/Cuiaba')::date AS hoje"
    );
    const hoje = hojeRes.rows[0].hoje;

    const r = await pool.query(
  "SELECT tipo, momento FROM pontos WHERE usuario_id = $1 AND data = $2 ORDER BY momento ASC",
  [usuarioId, hoje]
);
const horarios = {
  ENTRADA: null,
  SAIDA_ALMOCO: null,
  VOLTA_ALMOCO: null,
  SAIDA: null,
};


    const batidos = {
      ENTRADA: false,
      SAIDA_ALMOCO: false,
      VOLTA_ALMOCO: false,
      SAIDA: false,
      data: hoje,
    };

   for (const row of r.rows) {
  if (tipos.includes(row.tipo)) {
    batidos[row.tipo] = true;
    horarios[row.tipo] = row.momento;
  }
}


    return res.json({ ok: true, batidos, horarios });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Erro interno" });
  }
});


app.listen(3001, () => {
  console.log("API rodando na porta 3001");
});
