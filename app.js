// ---------- Constantes ----------
const DIAS = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const PEN = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const money = (n) => PEN.format(Number.isFinite(n) ? n : 0);

const KEY = "pedido_dom";
const SESION_KEY = "sesion";
const HIST_KEY = "historial_boletas";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const safeJSON = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  del(key) { localStorage.removeItem(key); }
};

// ---------- Codigo ----------
const uid = () => {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  const seq = Math.floor(Math.random()*9000)+1000;
  return `ORD-${y}${m}${day}-${seq}`;
};

const groupBy = (arr, keyFn) =>
  arr.reduce((a,x)=>((a[keyFn(x)] ||= []).push(x),a),{});

// ---------- Notificaciones ----------
function notify(text, type = "info") {
  // tipos: info | success | warning | error
  if (window.Toastify) {
    const bg = {
      info: "linear-gradient(to right,#3b82f6,#60a5fa)",
      success: "linear-gradient(to right,#22c55e,#86efac)",
      warning: "linear-gradient(to right,#f59e0b,#fbbf24)",
      error: "linear-gradient(to right,#ef4444,#f87171)"
    }[type] || undefined;

    Toastify({ text, gravity: "top", position: "right", style: { background: bg } }).showToast();
  } else {
    alert(text);
  }
}

async function confirmDialog(title, text, confirmText = "Confirmar") {
  if (window.Swal) {
    const res = await Swal.fire({
      title, text, icon: "question", showCancelButton: true,
      confirmButtonText: confirmText, cancelButtonText: "Cancelar"
    });
    return res.isConfirmed;
  }
  return window.confirm(`${title}\n${text ?? ""}`);
}

// ---------- Datos ----------
const MENU = [
  // Entradas
  { id: "1", nombre: "Ceviche", tipo: "entrada", precio: 15.0, dias: ["lun", "mie", "sab"] },
  { id: "2", nombre: "Sopa de Pollo", tipo: "entrada", precio: 12.0, dias: ["lun", "mie", "mar", "dom"] },
  { id: "3", nombre: "Ocopa", tipo: "entrada", precio: 10.0, dias: ["mie", "mar", "jue"] },
  { id: "4", nombre: "Papa a la Huancaina", tipo: "entrada", precio: 10.0, dias: ["mar", "jue"] },
  { id: "5", nombre: "Causa Limeña", tipo: "entrada", precio: 12.0, dias: ["vie", "sab", "dom"] },
  { id: "6", nombre: "Choros a la Chalaca", tipo: "entrada", precio: 14.0, dias: ["sab", "dom"] },
  // Segundos
  { id: "7", nombre: "Lomo Saltado", tipo: "segundo", precio: 18.5, dias: ["lun", "mie", "sab"] },
  { id: "8", nombre: "Ají de Gallina", tipo: "segundo", precio: 12.0, dias: ["vie", "jue", "dom"] },
  { id: "9", nombre: "Pollo a la Brasa", tipo: "segundo", precio: 20.0, dias: ["vie", "sab", "dom"] },
  { id: "10", nombre: "Tallarines con salsa roja", tipo: "segundo", precio: 20.0, dias: ["mar", "jue"] },
  { id: "11", nombre: "Arroz con Pollo", tipo: "segundo", precio: 16.0, dias: ["lun", "mie", "vie"] },
  { id: "12", nombre: "Seco de Res", tipo: "segundo", precio: 19.0, dias: ["mar", "jue", "sab"] },
  { id: "13", nombre: "Chaufa de Pollo", tipo: "segundo", precio: 16.5, dias: ["sab", "dom"] },
  { id: "14", nombre: "Bistec a lo Pobre", tipo: "segundo", precio: 22.0, dias: ["vie", "sab"] },
  { id: "15", nombre: "Pescado a la Plancha", tipo: "segundo", precio: 21.0, dias: ["mie", "vie"] },
  // Guarniciones
  { id: "16", nombre: "Ensalada", tipo: "guarnicion", precio: 6.0, dias: ["lun", "mie", "sab", "dom"] },
  { id: "17", nombre: "Arroz", tipo: "guarnicion", precio: 4.0, dias: ["sab", "mar","dom" ] },
  { id: "18", nombre: "Papas fritas", tipo: "guarnicion", precio: 8.0, dias: ["sab", "mar", "vie"] },
  { id: "19", nombre: "Yuca frita", tipo: "guarnicion", precio: 7.0, dias: ["jue", "mar"] },
  { id: "20", nombre: "Canchita", tipo: "guarnicion", precio: 7.5, dias: ["jue", "mar", "vie"] },
  // Bebidas
  { id: "21", nombre: "Gaseosa Personal", tipo: "bebida", precio: 3.5, dias: ["lun", "mar", "mie", "sab", "dom"] },
  { id: "22", nombre: "Té Helado", tipo: "bebida", precio: 2.0, dias: ["lun", "mar", "mie"] },
  { id: "23", nombre: "Jugo de Maracuyá", tipo: "bebida", precio: 5.0, dias: ["lun", "mar", "mie", "sab", "dom"] },
  { id: "24", nombre: "Agua", tipo: "bebida", precio: 1.5, dias: ["lun", "mar", "mie",  "jue", "vie", "sab", "dom"] },
  { id: "25", nombre: "Chicha Morada", tipo: "bebida", precio: 4.5, dias: ["lun", "mar", "mie", "jue", "vie"] },
  { id: "26", nombre: "Limonada", tipo: "bebida", precio: 4.0, dias: ["lun", "mar", "mie", "jue", "vie"] },
];

// ---------- Fecha (Zona Horaria) ----------
function diaActualLima() {
  const fmt = new Intl.DateTimeFormat("es-PE", { timeZone:"America/Lima", weekday:"short" });
  const abre = fmt.format(new Date()).toLowerCase().replace(/\./g,"");
  const map  = { dom:"dom", lun:"lun", mar:"mar", mie:"mie", "mié":"mie", jue:"jue", vie:"vie", sab:"sab", "sáb":"sab" };
  return map[abre] ?? DIAS[new Date().getDay()];
}
const disponibleHoy = (it, h=diaActualLima()) => !it.dias || it.dias.includes(h);
const byTypeHoy = (tipo) => MENU.filter(x => x.tipo===tipo && disponibleHoy(x));


// ---------- Sesiones e Historial ----------
const nuevaSesionId = () => `SES-${Date.now()}-${Math.floor(Math.random()*10000)}`;
const loadSesionId  = () => {
  let id = localStorage.getItem(SESION_KEY);
  if (!id) { id = nuevaSesionId(); localStorage.setItem(SESION_KEY, id); }
  return id;
};
const setSesionId = (id)=>localStorage.setItem(SESION_KEY, id);

let sesionId = loadSesionId();

const cargarHistorial = () => safeJSON.get(HIST_KEY, []);
const guardarHistorial = (arr) => safeJSON.set(HIST_KEY, arr);
const agregarBoletaAlHistorial = (b) => { const arr = cargarHistorial(); arr.push(b); guardarHistorial(arr); };

// ---------- Estado ----------
const initialState = {
  id: uid(),
  fecha: new Date(),
  cliente: null,           // {nombre,telefono,dni,direccion}
  items: [],               // [{id,nombre,tipo,precio,qty}]
  menuTipo: null,          // "completo" | "medio"
  etapa: null,             // "menu" | "checkout" | "boleta"
  boletaTexto: null
};
const load = () => safeJSON.get(KEY, null);
const save = (s) => safeJSON.set(KEY, s);
const clear = () => safeJSON.del(KEY);

const state = Object.assign({}, initialState, load() ?? {});

// ---------- Resetei----------
function resetState({ etapa = null } = {}) {
  state.id = uid();
  state.fecha = new Date();
  state.cliente = null;
  state.items = [];          // siempre nuevo
  state.menuTipo = null;
  state.etapa = etapa;
  state.boletaTexto = null;
  save(state);
}

// ---------- Validación de datos cliente ----------
function validarCliente({ nombre, telefono, dni, direccion }) {
  const errs = [];
  if (!/^[a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]{2,60}$/.test(nombre || "")) {
    errs.push("Nombre y apellido: solo letras y espacios, mínimo 2 caracteres.");
  }
  if (!/^\d{7,15}$/.test(telefono || "")) {
    errs.push("Teléfono: entre 7 y 15 dígitos.");
  }
  if (!/^\d{8}$/.test(dni || "")) {
    errs.push("DNI: exactamente 8 dígitos.");
  }
  if ((direccion || "").trim().length < 5) {
    errs.push("Dirección: mínimo 5 caracteres.");
  }
  return errs;
}

// ---------- HTML (DOM) ----------
const etiquetaDia = $("#etiquetaDia");
const menuCompleto = $("#menuCompleto");
const ContenidoCarrito = $("#ContenidoCarrito");
const listarCarrito = $("#listarCarrito");
const subtotalEl = $("#subtotal");
const totalEl = $("#total");
const vaciarCarritoBtn = $("#vaciarCarrito");
const btnPagoBtn = $("#btnPago");

const checkout = $("#checkout");
const formCliente = $("#formCliente");
const regresarMenuBtn = $("#regresarMenu");

const boletaPago = $("#boletaPago");
const boletaPagoTexto = $("#boletaPagoTexto");
const btnSeguirComprando = $("#btnSeguirComprando");
const btnTerminarCompra = $("#btnTerminarCompra");

const historial = $("#historial");
const historialLista = $("#historialLista");
const cerrarHistorial = $("#cerrarHistorial");

// ---------- UI Helpers ----------
function ocultarMenuYCarrito(ocultar = true) {
  const action = ocultar ? "add" : "remove";
  menuCompleto.classList[action]("oculto");
  ContenidoCarrito.classList[action]("oculto");
  etiquetaDia.classList[action]("oculto");
}

function cancelarYBloquear(msg = "Pedido cancelado. Para volver a pedir, recarga la página.") {
  notify(msg, "warning");
  // Oculta TODO
  ContenidoCarrito.classList.add("oculto");
  checkout.classList.add("oculto");
  boletaPago.classList.add("oculto");
  historial.classList.add("oculto");
  menuCompleto.classList.remove("oculto");
  etiquetaDia.classList.remove("oculto");

  // Vacía estado y guarda (sin referencias compartidas)
  resetState({ etapa: null });

  // Aviso
  menuCompleto.innerHTML = `
    <div style="padding:16px;border:1px solid #e5e7eb;background:#f9fafb;border-radius:8px;font-size:16px;">
      ${msg}
    </div>`;
}

function verHistorial() {
  const arr = cargarHistorial().filter((b) => b.sessionId === sesionId);
  if (!arr.length) {
    historialLista.innerHTML = `<p class="muted">Aún no hay boletas registradas en esta ocasión.</p>`;
    return;
  }
  historialLista.innerHTML = arr.map((b) => `
    <article class="card" style="margin-bottom:12px">
      <div><strong>${b.id}</strong> — ${b.fecha}</div>
      <pre style="white-space:pre-wrap">${b.texto}</pre>
    </article>
  `).join("");
}

// ---------- Menú y Carrito ----------
function armarMenuPrincipal() {
  etiquetaDia.textContent = `Hoy: ${diaActualLima().toUpperCase()} — Tipo de Menú: ${state.menuTipo?.toUpperCase() ?? "SIN ELEGIR"}`;

  const secciones = [];
  if (state.menuTipo === "completo") secciones.push({key:"entrada", title:"Entradas"});
  secciones.push({key:"segundo", title:"Segundos"});
  secciones.push({key:"bebida",  title:"Bebidas"});
  secciones.push({key:"guarnicion", title:"Guarniciones"});

  menuCompleto.innerHTML = secciones.map(g => {
    const data = byTypeHoy(g.key);
    if (!data.length) {
      return `<section><h3>${g.title}</h3><p class="muted">No hay ${g.title.toLowerCase()} disponibles hoy.</p></section>`;
    }
    return `
      <section>
        <h3>${g.title}</h3>
        <div class="grid">
          ${data.map(p => `
            <article class="card">
              <h4>${p.nombre}</h4>
              <div class="flex">
                <span class="price">${money(p.precio)}</span>
                <button class="btn small primary" data-add="${p.id}">Agregar</button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function calcularTotales(items = state.items) {
  const subtotal = items.reduce((a, i) => a + (i.precio * i.qty), 0);
  return { subtotal, total: subtotal };
}

function armarCarritoCompras() {
  if (!state.items.length) {
    listarCarrito.innerHTML = `<p class="muted">Tu pedido está vacío.</p>`;
  } else {
    listarCarrito.innerHTML = state.items.map(i => `
      <div class="cart-item" data-id="${i.id}">
        <div>
          <div><strong>${i.nombre}</strong> <span class="muted">(${i.tipo})</span></div>
          <div class="price">${money(i.precio)} c/u</div>
        </div>
        <div class="qty">
          <button data-dec="${i.id}" aria-label="Disminuir cantidad">-</button>
          <input type="number" min="1" value="${i.qty}" data-qty="${i.id}" />
          <button data-inc="${i.id}" aria-label="Aumentar cantidad">+</button>
          <button class="btn small outline" data-del="${i.id}" aria-label="Eliminar">x</button>
        </div>
      </div>
    `).join("");
  }
  const { subtotal, total } = calcularTotales();
  subtotalEl.textContent = money(subtotal);
  totalEl.textContent = money(total);
  save(state);
}


// ---------- Validaciones  ----------
const tieneEntrada = ()=> state.items.some(i => i.tipo==="entrada" && i.qty>0);
const tieneSegundo = ()=> state.items.some(i => i.tipo==="segundo" && i.qty>0);
const tieneBebida  = ()=> state.items.some(i => i.tipo==="bebida"  && i.qty>0);

function faltantesSegunTipo() {
  const faltas = [];
  if (state.menuTipo === "completo") {
    if (!tieneEntrada()) faltas.push("Entrada");
    if (!tieneSegundo()) faltas.push("Segundo");
    if (!tieneBebida())  faltas.push("Bebida");
  } else if (state.menuTipo === "medio") {
    if (!tieneSegundo()) faltas.push("Segundo");
    if (!tieneBebida())  faltas.push("Bebida");
  }
  return faltas;
}

// ---------- Generación de Boleta ----------
function fechaLimaStr(date = new Date()) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

function crearTextoBoleta({ id, fecha, cliente, items, total }) {
  const porTipo = groupBy(items, (it) => it.tipo);
  let texto = "===== BOLETA =====\n";
  texto += `N°: ${id}\n`;
  texto += `Fecha: ${fecha}\n\n`;
  texto += `Cliente:\n  ${cliente.nombre}\n  Tel: ${cliente.telefono}\n  DNI: ${cliente.dni}\n  Dir: ${cliente.direccion}\n\n`;
  texto += `Detalle:\n`;
  Object.keys(porTipo).forEach((tipo) => {
    texto += `— ${tipo.toUpperCase()} —\n`;
    porTipo[tipo].forEach((it) => {
      texto += `  ${it.nombre} x ${it.qty}  ${money(it.precio)} c/u\n`;
    });
  });
  texto += `\nTOTAL: ${money(total)}\n`;
  texto += "===============================\n¡Gracias por tu compra!";
  return texto;
}

// ---------- Eventos // Acciones ----------
menuCompleto.addEventListener("click", (e)=>{
  const id = e.target.dataset.add;
  if (!id) return;
  const item = MENU.find(m=>m.id===id);
  if (!item) return;

  if (item.tipo==="entrada" && state.menuTipo!=="completo") {
    notify("El menú Medio no incluye Entrada.", "warning");
    return;
  }

  const exist = state.items.find(x=>x.id===id);
  if (exist) exist.qty++;
  else state.items.push({ ...item, qty:1 });

  armarCarritoCompras();
  notify("Producto agregado", "success");
});

ContenidoCarrito.addEventListener("click", (e)=>{
  const {dec,inc,del} = e.target.dataset;
  if (dec) {
    const it = state.items.find(x=>x.id===dec);
    if (it && it.qty>1) it.qty--; else state.items = state.items.filter(x=>x.id!==dec);
    return armarCarritoCompras();
  }
  if (inc) {
    const it = state.items.find(x=>x.id===inc);
    if (it) it.qty++;
    return armarCarritoCompras();
  }
  if (del) {
    state.items = state.items.filter(x=>x.id!==del);
    return armarCarritoCompras();
  }
});

ContenidoCarrito.addEventListener("change", (e)=>{
  const id = e.target.dataset.qty;
  if (!id) return;
  const n = parseInt(e.target.value,10);
  const it = state.items.find(x=>x.id===id);
  if (it && Number.isInteger(n) && n>=1) it.qty = n;
  else if (it) it.qty = 1;
  armarCarritoCompras();
});

vaciarCarritoBtn.addEventListener("click", async () => {
  if (!state.items.length) return;
  const ok = await confirmDialog("Vaciar carrito", "¿Seguro que deseas vaciar tu carrito?", "Vaciar");
  if (!ok) return;
  state.items = [];
  armarCarritoCompras();
  notify("Carrito vacío", "info");
});

btnPagoBtn.addEventListener("click", () => {
  if (!state.items.length) { notify("Tu pedido está vacío.", "warning"); return; }
  const faltas = faltantesSegunTipo();
  if (faltas.length) {
    const regla = state.menuTipo === "completo" ? "Entrada, Segundo y Bebida" : "Segundo y Bebida";
    notify(`Para el menú ${String(state.menuTipo || "").toUpperCase()} necesitas: ${regla}. Te falta: ${faltas.join(", ")}.`, "warning");
    return;
  }
  state.etapa = "checkout";
  save(state);
  checkout.classList.remove("oculto");
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});

regresarMenuBtn.addEventListener("click", ()=>{
  checkout.classList.add("oculto");
});

formCliente.addEventListener("submit", (e)=>{
  e.preventDefault();

  const nombre = $("#cliNombre").value.trim();
  const telefono = $("#cliTelefono").value.trim();
  const dni = $("#cliDni").value.trim();
  const direccion = $("#cliDireccion").value.trim();

  const errores = validarCliente({ nombre, telefono, dni, direccion });
  if (errores.length) {
    notify(errores.join("\n"), "warning");
    return;
  }

  state.cliente = { nombre, telefono, dni, direccion };
  state.id = state.id || uid();
  state.fecha = state.fecha ? new Date(state.fecha) : new Date();

  const { total } = calcularTotales();
  const fechaLegible = fechaLimaStr(state.fecha);

  // Boleta
  const texto = crearTextoBoleta({
    id: state.id,
    fecha: fechaLegible,
    cliente: state.cliente,
    items: state.items,
    total
  });

  // Solo Mostrar boleta
  boletaPagoTexto.textContent = texto;
  boletaPago.classList.remove("oculto");
  ocultarMenuYCarrito(true);

  state.boletaTexto = texto;
  state.etapa = "boleta";
  save(state);

  // Guardar en historial 
  agregarBoletaAlHistorial({
    id: state.id,
    fecha: fechaLegible,
    total,
    cliente: state.cliente,
    items: state.items,
    texto,
    sessionId: sesionId
  });

  // Limpiar carrito
  state.items = [];
  save(state);
  armarCarritoCompras();
  checkout.classList.add("oculto");
  notify("Pago registrado", "success");
});

// Seguir comprando (sin recargar pagina)
btnSeguirComprando.addEventListener("click", async () => {
  boletaPago.classList.add("oculto");

  resetState({ etapa: "menu" }); // <- reset seguro

  const tipo = await elegirTipoMenu();
  if (!tipo) { cancelarYBloquear(); return; }
  state.menuTipo = tipo; save(state);

  ocultarMenuYCarrito(false);
  armarMenuPrincipal();
  armarCarritoCompras();
});

// Terminar compra (muestra historial SOLO lo que has echo en esta sesion y crea nueva sesion)
btnTerminarCompra.addEventListener("click", ()=>{
  boletaPago.classList.add("oculto");
  verHistorial();
  historial.classList.remove("oculto");

  // Reseteo para próxima ocasión
  resetState({ etapa: null });

  // Nueva sesión
  sesionId = nuevaSesionId();
  setSesionId(sesionId);
});

cerrarHistorial.addEventListener("click", async () => {
  historial.classList.add("oculto");
  // Más simple y confiable: recargar para iniciar flujo limpio
  window.location.reload();
});

// ---------- TipoMenu ----------
function elegirTipoMenu() {
  return new Promise((resolve) => {
    const modal = document.getElementById("tipoMenuModal");

    const onClick = (e) => {
      const target = e.target.closest("[data-choice], #cerrarTipoMenu");
      if (!target) return;

      if (target.id === "cerrarTipoMenu") {
        cleanup();
        resolve(null);
        return;
      }

      const val = target.dataset.choice;
      if (val === "completo" || val === "medio") {
        cleanup();
        resolve(val);
      }
    };

    const onEsc = (ev) => {
      if (ev.key === "Escape") { cleanup(); resolve(null); }
    };

    function cleanup() {
      modal.classList.add("oculto");
      modal.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onEsc);
    }

    modal.classList.remove("oculto");
    modal.addEventListener("click", onClick);
    document.addEventListener("keydown", onEsc);
  });
}


// ----------  Init(FUNCION PRINCIPAL) ----------
(function init(){
  const draft = load();

  // Si lo último fue boleta y se recarga no preguntar “pedido en proceso?”
  if (draft && draft.etapa === "boleta") {
    clear();
    resetState({ etapa: null });
  }

  // Si hay un proceso(eleccion de menu) sin boleta haber generado boletas, ofrecer continuar
  const tieneBorrador = draft && (
    (Array.isArray(draft.items) && draft.items.length>0) ||
    draft.cliente || draft.menuTipo
  );

  (async () => {
    if (tieneBorrador) {
      const cont = await confirmDialog("Pedido en proceso", "¿Deseas continuar con el pedido anterior?", "Continuar");
      if (cont) {
        Object.assign(state, {
          id: draft.id ?? state.id,
          fecha: draft.fecha ? new Date(draft.fecha) : new Date(),
          cliente: draft.cliente ?? null,
          items: Array.isArray(draft.items) ? draft.items : [],
          menuTipo: draft.menuTipo ?? null,
          etapa: draft.etapa ?? "menu",
          boletaTexto: draft.boletaTexto ?? null
        });
        save(state);
      } else {
        clear();
        resetState({ etapa: null });
      }
    }

  // Si aún no hay nada, pedirlo
    if (!state.menuTipo) {
      const tipo = await elegirTipoMenu();
      if (!tipo) { cancelarYBloquear(); return; }
      state.menuTipo = tipo;
      state.etapa = "menu";
      save(state);
    }

    armarMenuPrincipal();
    armarCarritoCompras();
  })();
})();
