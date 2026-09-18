/* Marea de Verrath — servidor de salas en Cloudflare
   El Worker sirve el juego como archivos estáticos y enruta /ws a un
   Durable Object: uno por código de sala. El objeto no simula nada, es un
   relé — la partida la sigue llevando el anfitrión, igual que en la versión
   del artifact. Así el servidor es diminuto y entra de sobra en el plan
   gratuito (los mensajes de WebSocket se facturan 20 a 1). */

import { DurableObject } from "cloudflare:workers";

const CODE_RE = /^[A-Z0-9]{4,8}$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const code = (url.searchParams.get("sala") || "").toUpperCase();
      if (!CODE_RE.test(code)) {
        return new Response("Código de sala inválido", { status: 400 });
      }
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Se esperaba un WebSocket", { status: 426 });
      }
      const id = env.SALA.idFromName(code);
      return env.SALA.get(id).fetch(request);
    }

    // salud, por si quieres comprobar el despliegue desde el navegador
    if (url.pathname === "/estado") {
      return Response.json({ ok: true, servicio: "marea-de-verrath" });
    }

    // cualquier otra cosa la sirven los estáticos (binding "assets")
    return env.ASSETS.fetch(request);
  }
};

export class Sala extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    // la presencia vive en memoria; si el objeto se reinicia, cada cliente
    // la vuelve a publicar en su siguiente latido (estado absoluto)
    this.pres = new Map();
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];

    // hibernación: el objeto puede dormirse entre mensajes sin cerrar nada
    this.ctx.acceptWebSocket(server);

    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    server.serializeAttachment({ id });
    this.pres.set(id, {});

    // al recién llegado: quién es y quién hay ya
    server.send(JSON.stringify({ t: "hi", id }));
    server.send(JSON.stringify({ t: "peers", list: this.peerList() }));
    this.broadcast({ t: "join", id }, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  peerList() {
    const out = [];
    for (const [id, p] of this.pres) out.push({ id, pres: p });
    return out;
  }

  idOf(ws) {
    const a = ws.deserializeAttachment();
    return a && a.id;
  }

  broadcast(obj, except) {
    const text = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try { ws.send(text); } catch (e) { /* socket ya cerrado */ }
    }
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string") return;
    if (message.length > 60000) return;          // techo defensivo
    let m;
    try { m = JSON.parse(message); } catch (e) { return; }
    const id = this.idOf(ws);
    if (!id) return;

    if (m.t === "p") {
      // parche de presencia: se fusiona y se reenvía tal cual
      const cur = this.pres.get(id) || {};
      const patch = m.d || {};
      for (const k in patch) {
        if (patch[k] === null) delete cur[k];
        else cur[k] = patch[k];
      }
      this.pres.set(id, cur);
      this.broadcast({ t: "p", id, d: patch }, ws);
    } else if (m.t === "ev") {
      // momento suelto: draft, arranque, fin de partida
      if (typeof m.topic !== "string" || m.topic.length > 24) return;
      this.broadcast({ t: "ev", id, topic: m.topic, d: m.d }, ws);
    } else if (m.t === "ping") {
      try { ws.send(JSON.stringify({ t: "pong", n: m.n })); } catch (e) {}
    }
  }

  async webSocketClose(ws) {
    const id = this.idOf(ws);
    if (id) {
      this.pres.delete(id);
      this.broadcast({ t: "left", id }, ws);
    }
  }

  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
}
