// ---------- Constantes  ----------
const DIAS = ["lun","mar","mie","jue","vie","sab","dom"];
const PEN  = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const money = n => PEN.format(n ?? 0);

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


// ---------- Datos ----------
const MENU = [
  // Entradas
  { id:"1", nombre:"Ceviche", tipo:"entrada", precio:15.0, dias:["lun","mie","sab"] },
  { id:"2", nombre:"Sopa de Pollo", tipo:"entrada", precio:12.0, dias:["lun","mie","mar","dom"] },
  { id:"3", nombre:"Ocopa", tipo:"entrada", precio:10.0, dias:["mie","mar","jue"] },
  { id:"4", nombre:"Papa a la Huancaina", tipo:"entrada", precio:10.0, dias:["mar","jue"] },
  { id:"16", nombre:"Causa Limeña", tipo:"entrada", precio:12.0, dias:["vie","sab","dom"] },
  { id:"17", nombre:"Choros a la Chalaca", tipo:"entrada", precio:14.0, dias:["sab","dom"] },
  // Segundos
  { id:"5", nombre:"Lomo Saltado", tipo:"segundo", precio:18.5, dias:["lun","mie","sab"]},
  { id:"6", nombre:"Ají de Gallina", tipo:"segundo", precio:12.0, dias:["vie","jue","dom"] },
  { id:"7", nombre:"Pollo a la Brasa", tipo:"segundo", precio:20.0, dias:["vie","sab","dom"] },
  { id:"8", nombre:"Tallarines con salsa roja", tipo:"segundo", precio:20.0, dias:["mar","jue"] },
  { id:"18", nombre:"Arroz con Pollo", tipo:"segundo", precio:16.0, dias:["lun","mie","vie"] },
  { id:"19", nombre:"Seco de Res", tipo:"segundo", precio:19.0, dias:["mar","jue","sab"] },
  { id:"20", nombre:"Chaufa de Pollo", tipo:"segundo", precio:16.5, dias:["sab","dom"]  },
  { id:"21", nombre:"Bistec a lo Pobre", tipo:"segundo", precio:22.0, dias:["vie","sab"] },
  { id:"22", nombre:"Pescado a la Plancha", tipo:"segundo", precio:21.0, dias:["mie","vie"] },
  // Guarniciones
  { id:"9",  nombre:"Ensalada",tipo:"guarnicion", precio:6.0, dias:["lun","mie","sab"] },
  { id:"10", nombre:"Arroz",  tipo:"guarnicion", precio:4.0, dias:["sab","mar"]},
  { id:"11", nombre:"Papas fritas", tipo:"guarnicion", precio:8.0, dias:["sab","mar"] },
  { id:"23", nombre:"Yuca frita", tipo:"guarnicion", precio:7.0, dias:["sab","mar"] },
  { id:"24", nombre:"Tostones", tipo:"guarnicion", precio:7.5, dias:["sab","mar"] },
  // Bebidas
  { id:"12", nombre:"Gaseosa Personal", tipo:"bebida", precio:3.5, dias:["lun","mar","mie","sab","dom"]},
  { id:"13", nombre:"Té Helado", tipo:"bebida", precio:2.0, dias:["lun","mar","mie","jue","vie"]},
  { id:"14", nombre:"Jugo de Maracuyá", tipo:"bebida", precio:5.0, dias:["lun","mar","mie","sab","dom"]},
  { id:"15", nombre:"Agua", tipo:"bebida", precio:1.5, dias:["lun","mar","mie","sab","dom"] },
  { id:"25", nombre:"Chicha Morada", tipo:"bebida", precio:4.5, dias:["lun","mar","mie","jue","vie"]},
  { id:"26", nombre:"Limonada", tipo:"bebida", precio:4.0, dias:["lun","mar","mie","jue","vie"] },
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


// ----------  Pedido Autoguardado ----------
const KEY = "pedido_dom_v2_tipo";
const save  = (s)=>localStorage.setItem(KEY, JSON.stringify(s));
const load  = ()=>{ try{ const r=localStorage.getItem(KEY); return r?JSON.parse(r):null; } catch { return null; } };
const clear = ()=>localStorage.removeItem(KEY);


// ---------- Generacion de boletas (historial por sesion) ----------
const SESION_KEY = "sesion_actual";
const HIST_KEY   = "historial_boletas";

const nuevaSesionId = () => `SES-${Date.now()}-${Math.floor(Math.random()*10000)}`;
const loadSesionId  = () => {
  let id = localStorage.getItem(SESION_KEY);
  if (!id) { id = nuevaSesionId(); localStorage.setItem(SESION_KEY, id); }
  return id;
};
const setSesionId = (id)=>localStorage.setItem(SESION_KEY, id);

let sesionId = loadSesionId();

const cargarHistorial   = ()=>{ try{ const r=localStorage.getItem(HIST_KEY); return r?JSON.parse(r):[]; } catch { return []; } };
const guardarHistorial  = (arr)=>localStorage.setItem(HIST_KEY, JSON.stringify(arr));
const agregarBoletaAlHistorial = (b)=>{ const arr=cargarHistorial(); arr.push(b); guardarHistorial(arr); };


// ---------- Estado ----------
const state = load() ?? {
  id: uid(),
  fecha: new Date(),
  cliente: null,           // {nombre,telefono,dni,direccion}
  items: [],               // [{id,nombre,tipo,precio,qty}]
  menuTipo: null,          // "completo" | "medio"
  etapa: null,             // "menu" | "checkout" | "boleta"
  boletaTexto: null
};


// ---------- HTML (DOM) ----------
const etiquetaDia       = document.getElementById("etiquetaDia");
const menuCompleto      = document.getElementById("menuCompleto");
const ContenidoCarrito  = document.getElementById("ContenidoCarrito");
const listarCarrito     = document.getElementById("listarCarrito");
const subtotalEl        = document.getElementById("subtotal");
const totalEl           = document.getElementById("total");
const vaciarCarritoBtn  = document.getElementById("vaciarCarrito");
const btnPagoBtn        = document.getElementById("btnPago");

const checkout          = document.getElementById("checkout");
const formCliente       = document.getElementById("formCliente");
const regresarMenuBtn   = document.getElementById("regresarMenu");

const boletaPago        = document.getElementById("boletaPago");
const boletaPagoTexto   = document.getElementById("boletaPagoTexto");
const btnSeguirComprando= document.getElementById("btnSeguirComprando");
const btnTerminarCompra = document.getElementById("btnTerminarCompra");

const historial         = document.getElementById("historial");
const historialLista    = document.getElementById("historialLista");
const cerrarHistorial   = document.getElementById("cerrarHistorial");


// ---------- 8) UI Helpers ----------
function ocultarMenuYCarrito(ocultar = true) {
  const action = ocultar ? "add" : "remove";
  menuCompleto.classList[action]("oculto");
  ContenidoCarrito.classList[action]("oculto");
  etiquetaDia.classList[action]("oculto");
}

function cancelarYBloquear(msg = "Pedido cancelado. Para volver a pedir, recarga la página.") {
  alert(msg);
  // Oculta TODO
  ContenidoCarrito.classList.add("oculto");
  checkout.classList.add("oculto");
  boletaPago.classList.add("oculto");
  historial.classList.add("oculto");
  menuCompleto.classList.remove("oculto");
  etiquetaDia.classList.remove("oculto");

  // Vacía estado y guarda
  state.items = [];
  state.menuTipo = null;
  state.etapa = null;
  state.boletaTexto = null;
  save(state);

  // Aviso de pedido cancelado
  menuCompleto.innerHTML = `
    <div style="padding:16px;border:1px solid #e5e7eb;background:#f9fafb;border-radius:8px;font-size:16px;">
      ${msg}
    </div>`;
}

function verHistorial() {
  const arr = cargarHistorial().filter(b => b.sessionId === sesionId);
  if (!arr.length) {
    historialLista.innerHTML = `<p class="muted">Aún no hay boletas registradas en esta ocasión.</p>`;
    return;
  }
  historialLista.innerHTML = arr.map(b => `
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

function calcularTotales() {
  const subtotal = state.items.reduce((a,i)=>a + i.precio*i.qty, 0);
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
          <button data-dec="${i.id}">-</button>
          <input type="number" min="1" value="${i.qty}" data-qty="${i.id}" />
          <button data-inc="${i.id}">+</button>
          <button class="btn small outline" data-del="${i.id}">x</button>
        </div>
      </div>
    `).join("");
  }
  const { subtotal, total } = calcularTotales();
  subtotalEl.textContent = money(subtotal);
  totalEl.textContent    = money(total);
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


// ---------- Eventos // Acciones ----------
menuCompleto.addEventListener("click", (e)=>{
  const id = e.target.dataset.add;
  if (!id) return;
  const item = MENU.find(m=>m.id===id);
  if (!item) return;

  if (item.tipo==="entrada" && state.menuTipo!=="completo") {
    alert("El menú Medio no incluye Entrada.");
    return;
  }

  const exist = state.items.find(x=>x.id===id);
  if (exist) exist.qty++;
  else state.items.push({ ...item, qty:1 });

  armarCarritoCompras();
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
  armarCarritoCompras();
});

vaciarCarritoBtn.addEventListener("click", ()=>{
  state.items = [];
  armarCarritoCompras();
});

btnPagoBtn.addEventListener("click", ()=>{
  if (!state.items.length) return alert("Tu pedido está vacío.");
  const faltas = faltantesSegunTipo();
  if (faltas.length) {
    const regla = state.menuTipo==="completo" ? "Entrada, Segundo y Bebida" : "Segundo y Bebida";
    alert(`Para el menú de tipo ${String(state.menuTipo||"").toUpperCase()} necesitas: ${regla}.\nTe falta: ${faltas.join(", ")}.`);
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

  const nombre    = document.getElementById("cliNombre").value.trim();
  const telefono  = document.getElementById("cliTelefono").value.trim();
  const dni       = document.getElementById("cliDni").value.trim();
  const direccion = document.getElementById("cliDireccion").value.trim();
  if (!nombre || !telefono || !dni || !direccion) return alert("Completa todos los campos.");

  state.cliente = { nombre, telefono, dni, direccion };
  state.id      = state.id || uid();
  state.fecha   = state.fecha ? new Date(state.fecha) : new Date();

  const { total } = calcularTotales();
  const fechaObj  = new Date(state.fecha);
  const fechaStr  = `${fechaObj.toLocaleDateString()} ${fechaObj.toLocaleTimeString()}`;

  // Boleta 
  const porTipo = groupBy(state.items, it => it.tipo);
  let texto = "===== BOLETA =====\n";
  texto += `N°: ${state.id}\n`;
  texto += `Fecha: ${fechaStr}\n\n`;
  texto += `Cliente:\n  ${nombre}\n  Tel: ${telefono}\n  DNI: ${dni}\n  Dir: ${direccion}\n\n`;
  texto += `Detalle:\n`;
  Object.keys(porTipo).forEach(tipo=>{
    texto += `— ${tipo.toUpperCase()} —\n`;
    porTipo[tipo].forEach(it=>{
      texto += `  ${it.nombre} x ${it.qty}  ${money(it.precio)} c/u\n`;
    });
  });
  texto += `\nTOTAL: ${money(total)}\n`;
  texto += "===============================\n¡Gracias por tu compra!";

  // Solo Mostrar boleta
  boletaPagoTexto.textContent = texto;
  boletaPago.classList.remove("oculto");
  ocultarMenuYCarrito(true);

  state.boletaTexto = texto;
  state.etapa = "boleta";
  save(state);

  // Guardar en historial 
  const fechaLegible = `${fechaObj.toLocaleDateString()} ${fechaObj.toLocaleTimeString()}`;
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
});

// Seguir comprando (sin recargar pagina)
btnSeguirComprando.addEventListener("click", ()=>{
  boletaPago.classList.add("oculto");

  state.id = uid();
  state.fecha = new Date();
  state.cliente = null;
  state.items = [];
  state.menuTipo = null;
  state.etapa = "menu";
  state.boletaTexto = null;
  save(state);

  const tipo = elegirTipoMenu();
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

  // Próximo uso (vaciar todo)
  state.id = uid();
  state.fecha = new Date();
  state.cliente = null;
  state.items = [];
  state.menuTipo = null;
  state.etapa = null;
  state.boletaTexto = null;
  save(state);

  // Nueva sesión
  sesionId = nuevaSesionId();
  setSesionId(sesionId);
});

cerrarHistorial.addEventListener("click", ()=>{
  historial.classList.add("oculto");

  const tipo = elegirTipoMenu();
  if (!tipo) { cancelarYBloquear(); return; }
  state.menuTipo = tipo;
  state.etapa = "menu";
  save(state);

  ocultarMenuYCarrito(false);
  armarMenuPrincipal();
  armarCarritoCompras();
});


// ---------- TipoMenu ----------
function elegirTipoMenu() {
  while (true) {
    const raw = prompt(
      "Elige el tipo de menú:\n" +
      "1) Completo (Entrada + Segundo + Bebida)\n" +
      "2) Medio (Segundo + Bebida)\n" +
      "Ingresa 1 o 2:"
    );
    if (raw === null) return null;
    const t = parseInt(raw,10);
    if (t === 1) return "completo";
    if (t === 2) return "medio";
    alert("Opción inválida. Intenta con 1 o 2.");
  }
}


// ----------  Init(FUNCION PRINCIPAL) ----------
(function init(){
  const draft = load();

  // Si lo último fue boleta y se recarga no preguntar “pedido en proceso?”
  if (draft && draft.etapa === "boleta") {
    clear();
    state.id = uid();
    state.fecha = new Date();
    state.cliente = null;
    state.items = [];
    state.menuTipo = null;
    state.etapa = null;
    state.boletaTexto = null;

    const tipo = elegirTipoMenu();
    if (!tipo) { cancelarYBloquear(); return; }
    state.menuTipo = tipo;
    state.etapa   = "menu";
    save(state);

    armarMenuPrincipal();
    armarCarritoCompras();
    return;
  }

  // Si hay un proceso(eleccion de menu) sin boleta haber generado boletas, ofrecer continuar
  const tieneBorrador = draft && (
    (Array.isArray(draft.items) && draft.items.length>0) ||
    draft.cliente || draft.menuTipo
  );

  if (tieneBorrador) {
    const continuar = confirm("Tienes un pedido en proceso. ¿Deseas continuar con el pedido anterior?");
    if (continuar) {
      state.id          = draft.id ?? state.id;
      state.fecha       = draft.fecha ? new Date(draft.fecha) : new Date();
      state.cliente     = draft.cliente ?? null;
      state.items       = Array.isArray(draft.items) ? draft.items : [];
      state.menuTipo    = draft.menuTipo ?? null;
      state.etapa       = draft.etapa ?? "menu";
      state.boletaTexto = draft.boletaTexto ?? null;
      save(state);
    } else {
      clear();
      state.id = uid();
      state.fecha = new Date();
      state.cliente = null;
      state.items = [];
      state.menuTipo = null;
      state.etapa = null;
      state.boletaTexto = null;

      const tipo = elegirTipoMenu();
      if (!tipo) { cancelarYBloquear(); return; }
      state.menuTipo = tipo;
      state.etapa = "menu";
      save(state);
    }
  }

  // Si aún no hay nada, pedirlo
  if (!state.menuTipo) {
    const tipo = elegirTipoMenu();
    if (!tipo) { cancelarYBloquear(); return; }
    state.menuTipo = tipo;
    state.etapa = "menu";
    save(state);
  }

  armarMenuPrincipal();
  armarCarritoCompras();
})();
