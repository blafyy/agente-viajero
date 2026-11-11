var letras = "ABCDEFGHIJKLMNO";
var MAX_CIUDADES_CALCULO = 8;
var MAX_CIUDADES_PODA = 15;
var MAX_CIUDADES = 15;

var n = 6;
var costos = [];
var modoManual = false;
var nombres = null;
var rutaFinal = null;
var pasoActual = 0;

function porId(id) {
  return document.getElementById(id);
}

function nombreCiudad(i) {
  if (nombres) {
    return nombres[i].etiqueta;
  }
  return n <= MAX_CIUDADES_PODA ? letras[i] : String(i + 1);
}

function matrizVacia(tam) {
  var m = [];
  for (var i = 0; i < tam; i++) {
    m.push([]);
    for (var j = 0; j < tam; j++) {
      m[i].push(0);
    }
  }
  return m;
}

function matrizAleatoria(tam) {
  var m = matrizVacia(tam);
  for (var i = 0; i < tam; i++) {
    for (var j = i + 1; j < tam; j++) {
      var valor = Math.floor(Math.random() * 45) + 5;
      m[i][j] = valor;
      m[j][i] = valor;
    }
  }
  return m;
}

function matrizEnUnos(tam) {
  var m = matrizVacia(tam);
  for (var i = 0; i < tam; i++) {
    for (var j = i + 1; j < tam; j++) {
      m[i][j] = 1;
      m[j][i] = 1;
    }
  }
  return m;
}

function dibujarMatriz() {
  if (n > MAX_CIUDADES_PODA) {
    porId("matriz").innerHTML = "<p class='ayuda'>Con más de " + MAX_CIUDADES_PODA + " ciudades la matriz (" + n + " × " + n + ") no se muestra, pero se genera igual que en los otros casos.</p>";
    return;
  }
  var html = "<table><tr><th></th>";
  for (var j = 0; j < n; j++) {
    html += "<th>" + nombreCiudad(j) + "</th>";
  }
  html += "</tr>";
  for (var i = 0; i < n; i++) {
    html += "<tr><th>" + nombreCiudad(i) + "</th>";
    for (var j = 0; j < n; j++) {
      if (i == j) {
        html += "<td class='gris'>0</td>";
      } else if (modoManual && j > i) {
        html += "<td><input type='number' min='1' max='999' data-i='" + i + "' data-j='" + j + "' value='" + costos[i][j] + "'></td>";
      } else {
        html += "<td class='gris' id='c-" + i + "-" + j + "'>" + costos[i][j] + "</td>";
      }
    }
    html += "</tr>";
  }
  html += "</table>";
  porId("matriz").innerHTML = html;

  if (modoManual) {
    var campos = porId("matriz").querySelectorAll("input");
    for (var k = 0; k < campos.length; k++) {
      campos[k].addEventListener("input", cambioManual);
    }
  }
}

function cambioManual(e) {
  var campo = e.target;
  var i = parseInt(campo.getAttribute("data-i"));
  var j = parseInt(campo.getAttribute("data-j"));
  var valor = parseInt(campo.value);
  if (isNaN(valor) || valor < 1) {
    valor = 1;
  }
  costos[i][j] = valor;
  costos[j][i] = valor;
  porId("c-" + j + "-" + i).textContent = valor;
  porId("resultado").innerHTML = "";
  borrarRuta();
  dibujarGrafo();
}

function dibujarGrafo() {
  var tam = 460;
  var radio = tam / 2 - 55;
  var centro = tam / 2;
  var x = [];
  var y = [];
  for (var i = 0; i < n; i++) {
    var angulo = -Math.PI / 2 + i * (2 * Math.PI / n);
    x.push(centro + radio * Math.cos(angulo));
    y.push(centro + radio * Math.sin(angulo));
  }

  var svg = "<svg width='" + tam + "' height='" + tam + "'>";
  var verPesos = porId("pesos").checked && n <= MAX_CIUDADES_PODA;
  if (rutaFinal && n > MAX_CIUDADES_PODA) {
    for (var k = 0; k < pasoActual; k++) {
      var a = rutaFinal[k];
      var b = rutaFinal[(k + 1) % n];
      svg += "<line x1='" + x[a] + "' y1='" + y[a] + "' x2='" + x[b] + "' y2='" + y[b] + "' stroke='#c0392b' stroke-width='3'/>";
    }
  }
  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n && n <= MAX_CIUDADES_PODA; j++) {
      if (enRuta(i, j)) {
        svg += "<line x1='" + x[i] + "' y1='" + y[i] + "' x2='" + x[j] + "' y2='" + y[j] + "' stroke='#c0392b' stroke-width='3'/>";
      } else {
        svg += "<line x1='" + x[i] + "' y1='" + y[i] + "' x2='" + x[j] + "' y2='" + y[j] + "' stroke='#bbb' stroke-width='1'/>";
      }
      if (verPesos) {
        var mx = (x[i] + x[j]) / 2;
        var my = (y[i] + y[j]) / 2;
        svg += "<rect x='" + (mx - 9) + "' y='" + (my - 8) + "' width='18' height='14' fill='#fff'/>";
        svg += "<text x='" + mx + "' y='" + (my + 3) + "' font-size='10' fill='#555' text-anchor='middle'>" + costos[i][j] + "</text>";
      }
    }
  }
  var radioNodo = n <= MAX_CIUDADES_PODA ? 16 : 9;
  var letra = n <= MAX_CIUDADES_PODA ? 14 : 8;
  for (var i = 0; i < n; i++) {
    svg += "<circle cx='" + x[i] + "' cy='" + y[i] + "' r='" + radioNodo + "' fill='#fff' stroke='#333' stroke-width='1.5'/>";
    svg += "<text x='" + x[i] + "' y='" + (y[i] + letra / 3) + "' font-size='" + letra + "' fill='#222' text-anchor='middle'>" + nombreCiudad(i) + "</text>";
  }
  svg += "</svg>";
  porId("grafo").innerHTML = svg;
  dibujarLeyenda();
}

var mejorCosto;
var mejorRuta;
var ruta;
var visitada;

function buscar(actual, cantidad, costo) {
  if (cantidad == n) {
    var total = costo + costos[actual][0];
    if (total < mejorCosto) {
      mejorCosto = total;
      mejorRuta = ruta.slice();
    }
    return;
  }
  for (var j = 1; j < n; j++) {
    if (!visitada[j]) {
      visitada[j] = true;
      ruta.push(j);
      buscar(j, cantidad + 1, costo + costos[actual][j]);
      ruta.pop();
      visitada[j] = false;
    }
  }
}

function fuerzaBruta() {
  mejorCosto = Infinity;
  mejorRuta = [];
  ruta = [0];
  visitada = [];
  for (var i = 0; i < n; i++) {
    visitada.push(false);
  }
  visitada[0] = true;
  buscar(0, 1, 0);
}

function actualizarCalculo() {
  porId("calcular").disabled = false;
  porId("aviso").className = n <= MAX_CIUDADES_CALCULO ? "error" : "ayuda";
  if (n <= MAX_CIUDADES_CALCULO) {
    porId("aviso").textContent = "";
  } else if (n <= MAX_CIUDADES_PODA) {
    porId("aviso").textContent = "Con " + n + " ciudades se usa la fuerza bruta con poda.";
  } else {
    porId("aviso").textContent = "Con más de " + MAX_CIUDADES_PODA + " ciudades se usa la heurística (vecino más cercano + 2-opt): la ruta es buena, pero no se asegura que sea la óptima.";
  }
}

function elegirModo(manual) {
  modoManual = manual && n <= MAX_CIUDADES_PODA;
  manual = modoManual;
  nombres = null;
  borrarRuta();
  porId("auto").className = manual ? "" : "activo";
  porId("manual").className = manual ? "activo" : "";
  if (manual) {
    costos = matrizEnUnos(n);
  } else {
    costos = matrizAleatoria(n);
  }
  dibujarMatriz();
  dibujarGrafo();
  porId("resultado").innerHTML = "";
}

porId("construir").addEventListener("click", function () {
  var valor = parseInt(porId("n").value);
  if (isNaN(valor) || valor < 5 || valor > MAX_CIUDADES) {
    porId("error").textContent = "Ingresa un número entre 5 y " + MAX_CIUDADES + ".";
    return;
  }
  porId("error").textContent = "";
  n = valor;
  porId("contenido").style.display = "block";
  porId("pesos").checked = n <= 8;
  porId("manual").disabled = n > MAX_CIUDADES_PODA;
  porId("ayudaMatriz").textContent = "La diagonal es 0. Las celdas blancas se escriben; las grises se copian solas.";
  actualizarCalculo();
  elegirModo(false);
});

porId("auto").addEventListener("click", function () {
  elegirModo(false);
});

porId("manual").addEventListener("click", function () {
  elegirModo(true);
});

porId("nueva").addEventListener("click", function () {
  if (!modoManual) {
    elegirModo(false);
  }
});

porId("pesos").addEventListener("change", dibujarGrafo);

porId("calcular").addEventListener("click", function () {
  var inicio = Date.now();
  var metodo;
  if (n <= MAX_CIUDADES_CALCULO) {
    fuerzaBruta();
    metodo = "Fuerza bruta (enumeración completa)";
  } else if (n <= MAX_CIUDADES_PODA) {
    fuerzaBrutaConPoda();
    metodo = "Fuerza bruta con poda";
  } else {
    heuristica();
    metodo = "Heurística: vecino más cercano + 2-opt (no asegura el óptimo)";
  }
  var tiempo = Date.now() - inicio;
  var texto = "";
  for (var i = 0; i < mejorRuta.length; i++) {
    texto += nombreCiudad(mejorRuta[i]) + " → ";
  }
  texto += nombreCiudad(0);
  var etiquetaCosto = n <= MAX_CIUDADES_PODA ? "Costo total mínimo: " : "Costo total de la ruta: ";
  porId("resultado").innerHTML = "<div class='resultado'><p>Método: " + metodo + "</p><p>Ruta: " + texto + "</p><p>" + etiquetaCosto + redondear(mejorCosto) + "</p><p class='ayuda'>Tiempo de cálculo: " + tiempo + " ms</p></div>";
  rutaFinal = mejorRuta.slice();
  pasoActual = n;
  porId("pasos").style.display = "block";
  dibujarGrafo();
  dibujarPasos();
});

// ---------------- Versión final: lo que se agregó ----------------

function borrarRuta() {
  rutaFinal = null;
  pasoActual = 0;
  porId("pasos").style.display = "none";
}

// indica si la arista i-j está entre los tramos de la ruta que se muestran
function enRuta(i, j) {
  if (!rutaFinal) {
    return false;
  }
  for (var k = 0; k < pasoActual; k++) {
    var a = rutaFinal[k];
    var b = rutaFinal[(k + 1) % n];
    if ((a == i && b == j) || (a == j && b == i)) {
      return true;
    }
  }
  return false;
}

function redondear(valor) {
  return Math.round(valor * 10) / 10;
}

function costoDeRuta(r) {
  var total = 0;
  for (var i = 0; i < r.length; i++) {
    total += costos[r[i]][r[(i + 1) % r.length]];
  }
  return total;
}

// Fuerza bruta con poda: igual que buscar(), pero abandona la ruta parcial si su costo
// más lo mínimo que falta recorrer ya alcanza al mejor costo conocido.
var salidaMinima;

function buscarConPoda(actual, cantidad, costo, faltaMinimo) {
  if (cantidad == n) {
    var total = costo + costos[actual][0];
    if (total < mejorCosto) {
      mejorCosto = total;
      mejorRuta = ruta.slice();
    }
    return;
  }
  if (costo + salidaMinima[actual] + faltaMinimo >= mejorCosto) {
    return;
  }
  var siguientes = [];
  for (var j = 1; j < n; j++) {
    if (!visitada[j]) {
      siguientes.push(j);
    }
  }
  siguientes.sort(function (a, b) {
    return costos[actual][a] - costos[actual][b];
  });
  for (var k = 0; k < siguientes.length; k++) {
    var j = siguientes[k];
    visitada[j] = true;
    ruta.push(j);
    buscarConPoda(j, cantidad + 1, costo + costos[actual][j], faltaMinimo - salidaMinima[j]);
    ruta.pop();
    visitada[j] = false;
  }
}

function fuerzaBrutaConPoda() {
  // la primera mejor ruta es la de la heurística, así se poda desde el inicio
  heuristica();
  salidaMinima = [];
  var faltaMinimo = 0;
  for (var i = 0; i < n; i++) {
    var minimo = Infinity;
    for (var j = 0; j < n; j++) {
      if (i != j && costos[i][j] < minimo) {
        minimo = costos[i][j];
      }
    }
    salidaMinima.push(minimo);
    if (i > 0) {
      faltaMinimo += minimo;
    }
  }
  ruta = [0];
  visitada = [];
  for (var i = 0; i < n; i++) {
    visitada.push(false);
  }
  visitada[0] = true;
  buscarConPoda(0, 1, 0, faltaMinimo);
}

// Heurística para casos grandes
function vecinoMasCercano(inicio) {
  var r = [inicio];
  var usada = [];
  for (var i = 0; i < n; i++) {
    usada.push(false);
  }
  usada[inicio] = true;
  var actual = inicio;
  for (var k = 1; k < n; k++) {
    var mejor = -1;
    for (var j = 0; j < n; j++) {
      if (!usada[j] && (mejor == -1 || costos[actual][j] < costos[actual][mejor])) {
        mejor = j;
      }
    }
    r.push(mejor);
    usada[mejor] = true;
    actual = mejor;
  }
  return r;
}

// 2-opt: invierte un tramo de la ruta mientras eso la acorte
function dosOpt(r) {
  var mejoro = true;
  while (mejoro) {
    mejoro = false;
    for (var i = 0; i < n - 1; i++) {
      for (var j = i + 2; j < n; j++) {
        if (i == 0 && j == n - 1) {
          continue;
        }
        var a = r[i], b = r[i + 1], c = r[j], d = r[(j + 1) % n];
        if (costos[a][c] + costos[b][d] < costos[a][b] + costos[c][d] - 1e-9) {
          var tramo = r.slice(i + 1, j + 1).reverse();
          for (var k = 0; k < tramo.length; k++) {
            r[i + 1 + k] = tramo[k];
          }
          mejoro = true;
        }
      }
    }
  }
  return r;
}

function heuristica() {
  mejorCosto = Infinity;
  mejorRuta = [];
  for (var inicio = 0; inicio < n; inicio++) {
    var r = dosOpt(vecinoMasCercano(inicio));
    var c = costoDeRuta(r);
    if (c < mejorCosto) {
      mejorCosto = c;
      mejorRuta = r;
    }
  }
  // la ruta se muestra empezando en la primera ciudad
  var pos = mejorRuta.indexOf(0);
  mejorRuta = mejorRuta.slice(pos).concat(mejorRuta.slice(0, pos));
}

// Costo acumulado y paso a paso
function dibujarPasos() {
  var html = "<table><tr><th>Paso</th><th>Tramo</th><th>Costo del tramo</th><th>Costo acumulado</th></tr>";
  var acumulado = 0;
  for (var k = 0; k < n; k++) {
    var a = rutaFinal[k];
    var b = rutaFinal[(k + 1) % n];
    acumulado += costos[a][b];
    var clase = (k == pasoActual - 1) ? " class='actual'" : "";
    html += "<tr" + clase + "><td>" + (k + 1) + "</td><td>" + nombreCiudad(a) + " → " + nombreCiudad(b) + "</td><td>" + redondear(costos[a][b]) + "</td><td>" + redondear(acumulado) + "</td></tr>";
  }
  html += "</table>";
  porId("tablaPasos").innerHTML = html;
}

function irAlPaso(k) {
  if (!rutaFinal) {
    return;
  }
  pasoActual = Math.max(0, Math.min(n, k));
  dibujarGrafo();
  dibujarPasos();
}

porId("anterior").addEventListener("click", function () {
  irAlPaso(pasoActual - 1);
});

porId("siguiente").addEventListener("click", function () {
  irAlPaso(pasoActual + 1);
});

porId("todo").addEventListener("click", function () {
  irAlPaso(n);
});

function dibujarLeyenda() {
  var html = "";
  if (nombres) {
    for (var i = 0; i < n; i++) {
      html += nombres[i].etiqueta + " = " + nombres[i].nombre + (i == 0 ? " (punto de recojo)" : "") + "<br>";
    }
  }
  porId("leyenda").innerHTML = html;
}

// Caso de estudio: reparto de última milla de Rappi en Lima.
// Coordenadas aproximadas del centro de cada distrito (supuesto del caso).
// Costo = distancia en línea recta (Haversine) × 1.3 para aproximar el recorrido por calles, en km.
var CASO_RAPPI = [
  { etiqueta: "A", nombre: "Miraflores", lat: -12.1219, lon: -77.0297 },
  { etiqueta: "B", nombre: "San Isidro", lat: -12.0977, lon: -77.0365 },
  { etiqueta: "C", nombre: "Barranco", lat: -12.1497, lon: -77.0219 },
  { etiqueta: "D", nombre: "Surquillo", lat: -12.1120, lon: -77.0120 },
  { etiqueta: "E", nombre: "Santiago de Surco", lat: -12.1450, lon: -76.9917 },
  { etiqueta: "F", nombre: "San Borja", lat: -12.1090, lon: -76.9990 },
  { etiqueta: "G", nombre: "Lince", lat: -12.0840, lon: -77.0360 },
  { etiqueta: "H", nombre: "Jesús María", lat: -12.0710, lon: -77.0510 },
  { etiqueta: "I", nombre: "Magdalena del Mar", lat: -12.0900, lon: -77.0720 },
  { etiqueta: "J", nombre: "Pueblo Libre", lat: -12.0720, lon: -77.0630 },
  { etiqueta: "K", nombre: "San Miguel", lat: -12.0780, lon: -77.0900 },
  { etiqueta: "L", nombre: "Chorrillos", lat: -12.1700, lon: -77.0100 }
];

function haversine(lat1, lon1, lat2, lon2) {
  var radio = 6371;
  var rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad;
  var dLon = (lon2 - lon1) * rad;
  var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * radio * Math.asin(Math.sqrt(h));
}

porId("caso").addEventListener("click", function () {
  n = CASO_RAPPI.length;
  porId("n").value = n;
  modoManual = false;
  nombres = CASO_RAPPI;
  costos = matrizVacia(n);
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n; j++) {
      if (i != j) {
        costos[i][j] = redondear(haversine(CASO_RAPPI[i].lat, CASO_RAPPI[i].lon, CASO_RAPPI[j].lat, CASO_RAPPI[j].lon) * 1.3);
      }
    }
  }
  porId("error").textContent = "";
  porId("contenido").style.display = "block";
  porId("pesos").checked = false;
  porId("auto").className = "";
  porId("manual").className = "";
  porId("manual").disabled = true;
  porId("ayudaMatriz").textContent = "Caso de estudio Rappi: costos en km entre el punto de recojo (A, Miraflores) y 11 entregas.";
  actualizarCalculo();
  porId("resultado").innerHTML = "";
  borrarRuta();
  dibujarMatriz();
  dibujarGrafo();
});
