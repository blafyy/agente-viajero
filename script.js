var letras = "ABCDEFGHIJKLMNO";
var MAX_CIUDADES_CALCULO = 8;

var n = 6;
var costos = [];
var modoManual = false;

function porId(id) {
  return document.getElementById(id);
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
  var html = "<table><tr><th></th>";
  for (var j = 0; j < n; j++) {
    html += "<th>" + letras[j] + "</th>";
  }
  html += "</tr>";
  for (var i = 0; i < n; i++) {
    html += "<tr><th>" + letras[i] + "</th>";
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
  var verPesos = porId("pesos").checked;
  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n; j++) {
      svg += "<line x1='" + x[i] + "' y1='" + y[i] + "' x2='" + x[j] + "' y2='" + y[j] + "' stroke='#bbb' stroke-width='1'/>";
      if (verPesos) {
        var mx = (x[i] + x[j]) / 2;
        var my = (y[i] + y[j]) / 2;
        svg += "<rect x='" + (mx - 9) + "' y='" + (my - 8) + "' width='18' height='14' fill='#fff'/>";
        svg += "<text x='" + mx + "' y='" + (my + 3) + "' font-size='10' fill='#555' text-anchor='middle'>" + costos[i][j] + "</text>";
      }
    }
  }
  for (var i = 0; i < n; i++) {
    svg += "<circle cx='" + x[i] + "' cy='" + y[i] + "' r='16' fill='#fff' stroke='#333' stroke-width='1.5'/>";
    svg += "<text x='" + x[i] + "' y='" + (y[i] + 5) + "' font-size='14' fill='#222' text-anchor='middle'>" + letras[i] + "</text>";
  }
  svg += "</svg>";
  porId("grafo").innerHTML = svg;
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
  var puede = n <= MAX_CIUDADES_CALCULO;
  porId("calcular").disabled = !puede;
  if (puede) {
    porId("aviso").textContent = "";
  } else {
    porId("aviso").textContent = "Solo se puede calcular hasta " + MAX_CIUDADES_CALCULO + " ciudades.";
  }
}

function elegirModo(manual) {
  modoManual = manual;
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
  if (isNaN(valor) || valor < 5 || valor > 15) {
    porId("error").textContent = "Ingresa un número entre 5 y 15.";
    return;
  }
  porId("error").textContent = "";
  n = valor;
  porId("contenido").style.display = "block";
  porId("pesos").checked = n <= 8;
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
  fuerzaBruta();
  var texto = "";
  for (var i = 0; i < mejorRuta.length; i++) {
    texto += letras[mejorRuta[i]] + " → ";
  }
  texto += letras[0];
  porId("resultado").innerHTML = "<div class='resultado'><p>Ruta: " + texto + "</p><p>Costo total mínimo: " + mejorCosto + "</p></div>";
});
