<template>
  <section class="home">
    <div class="overlay"></div>
    <div class="navar">
      <div class="text">
        <h1 class="titulo">{{ displayedText }}</h1>
      </div>

      <div class="actions">
        <router-link to="/reporte2">
          <button class="notification-btn">
          <i class='bx bx-bell'></i>
          <span class="notification-indicator"></span>
        </button>
        </router-link>
        
        <div class="dropdown">
          <button class="dropbtn" @click="toggleDropdown">
            <i class='bx bx-cog confi'></i> Configuración
            <i class='bx bx-chevron-down'></i>
          </button>
          <div class="dropdown-content" :class="{ 'show': dropdownOpen }">
            <a href="#" class="dropdown-item">
              <i class='bx bx-user-circle'></i>
              <span>Perfil</span>
            </a>
            <a href="#" class="dropdown-item">
              <i class='bx bx-lock-alt'></i>
              <span>Contraseña</span>
            </a>
            <a href="#" class="dropdown-item">
              <i class='bx bx-user-x'></i>
              <span>Privacidad</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="arribaBp">
      <div class="hone2">
        <h1>Historial</h1>
      </div>
      <div id="play-content" class="play-content">
          <div class="player-controls">
            <button @click="playRecording" class="control-button">
              <i class='bx bx-play'></i>
            </button>
            <button @click="stopRecording" class="control-button">
              <i class='bx bx-stop'></i>
            </button>
            <button @click="pauseRecording" class="control-button">
              <i class='bx bx-pause'></i>
            </button>
            <button @click="resetRecording" class="control-button">
              <i class='bx bx-reset'></i>
            </button>
          </div>
        </div>
    </div>

    <div class="tituloo">
      <div class="hone">
        <h1>Lista de Dispositivos</h1>
        <div class="group">
          <svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
            <g>
              <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z">
              </path>
            </g>
          </svg>
          <input placeholder="Buscar" type="search" class="input" v-model="searchQuery" @input="filterResults">
        </div>
        <div class="device-list-container">
          <ul class="device-list">
            <li @click="showAlert(item)" v-for="item in filteredResults" :key="item._id">
              <i class='bx bxs-car'></i>
              {{ item.deviceName }}
            </li>
          </ul>
        </div>
      </div>
      <div id="map" class="map-container">
       
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Swal from 'sweetalert2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

let map;
let polyline;
let marker;
let playbackInterval;
const playbackSpeed = 1000;

const fullText = "Navify";
const displayedText = ref("");
let currentIndex = 0;
let isDeleting = false;
let typingInterval;

const dropdownOpen = ref(false);
const searchQuery = ref('');
const devices = ref([]);
const filteredResults = ref([]);

const typeEffect = () => {
  const current = currentIndex;
  
  if (!isDeleting && current < fullText.length) {
    displayedText.value = fullText.slice(0, current + 1);
    currentIndex++;
    if (currentIndex === fullText.length) {
      typingInterval = setTimeout(() => {
        isDeleting = true;
        typeEffect();
      }, 5000);
      return;
    }
  } else if (isDeleting && current > 0) {
    displayedText.value = fullText.slice(0, current - 1);
    currentIndex--;
  } else {
    isDeleting = false;
    currentIndex = 0;
  }

  const typingSpeed = isDeleting ? 100 : 200;
  typingInterval = setTimeout(typeEffect, typingSpeed);
};

function initMap() {
  var colombia = { lat: 10.9685, lng: -74.7813 };
  const mapOptions = {
    center: colombia,
    zoom: 12.4
  };
  
  map = L.map('map').setView([colombia.lat, colombia.lng], mapOptions.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function filterResults() {
  const query = searchQuery.value.toLowerCase();
  filteredResults.value = devices.value.filter(item =>
    item.deviceName.toLowerCase().includes(query)
  );
}

const showAlert = (item) => {
  Swal.fire({
    title: 'Seleccionar rango de fechas y horas',
    html:
      '<label for="start-date">Fecha inicial:</label>' +
      '<input type="date" id="start-date" class="swal2-input">' +
      '<label for="end-date">Fecha fin:</label>' +
      '<input type="date" id="end-date" class="swal2-input">',
    width: '60%',
    confirmButtonText: 'Ver Historial',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const startDate = document.getElementById('start-date').value;
      const endDate = document.getElementById('end-date').value;

      if (!startDate || !endDate) {
        Swal.showValidationMessage('Por favor ingrese todas las fechas');
      }
      return { startDate, endDate };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      showHistory(item, result.value.startDate, result.value.endDate);
    }
  });
};

const showHistory = async (device, startDate, endDate) => {
  if (!device || !device._id) {
    console.error('ID del dispositivo no válido:', device);
    Swal.fire({
      title: 'Error',
      text: 'No se puede obtener el historial del dispositivo.',
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  try {
    const coordenadasManuales = [
      [10.9685, -74.7813],
      [10.9700, -74.7800],
      [10.9720, -74.7790],
      [10.9740, -74.7785],
      [10.9760, -74.7780],
    ];

    const coordenadas = coordenadasManuales;

    if (polyline) {
      map.removeLayer(polyline);
    }

    polyline = L.polyline(coordenadas, { color: 'red' }).addTo(map);

    if (marker) { 
      map.removeLayer(marker);
    }
    marker = L.marker(coordenadas[0]).addTo(map).bindPopup('Inicio');

    map.fitBounds(polyline.getBounds());

    window.recordingCoords = coordenadas;

  } catch (error) {
    console.error('Error al mostrar el historial:', error);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo mostrar el historial del dispositivo.',
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }
};

const playRecording = () => {
  if (!window.recordingCoords) {
    Swal.fire({
      title: 'Error',
      text: 'Por favor, seleccione un dispositivo antes de reproducir el historial.',
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  let index = 0;

  if (playbackInterval) {
    clearInterval(playbackInterval);
  }

  playbackInterval = setInterval(() => {
    if (index < window.recordingCoords.length) {
      const coord = window.recordingCoords[index];
      marker.setLatLng(coord);
      map.setView(coord, map.getZoom());
      index++;
    } else {
      clearInterval(playbackInterval);
    }
  }, playbackSpeed);
};

const cargarDispositivos = async () => {
  try {
    const response = await fetch('http://3.12.147.103/devices');
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API');
    }
    const data = await response.json();
    devices.value = data;
    filteredResults.value = devices.value;
  } catch (error) {
    console.error('Error al cargar dispositivos:', error);
  }
};

const pauseRecording = () => {
  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
};

const resetRecording = () => {
  if (playbackInterval) {
    clearInterval(playbackInterval);
  }
  marker.setLatLng(window.recordingCoords[0]);
  map.setView(window.recordingCoords[0], map.getZoom());
};

onUnmounted(() => {
  clearTimeout(typingInterval);
});

onMounted(() => {
  initMap();
  typeEffect();
  cargarDispositivos();
});
</script>

<style scoped>
.map-container {
  height: calc(100vh - 60px);
  width: 100%; 
  position: relative;
  z-index: 0;
}

.home {
  height: 100vh;
  overflow: hidden;
}

.home .navar {
  background-color: var(--sidebar-color);
  border-bottom: 3px solid var(--body-color);
  z-index: 2;
}

.home .text {
  position: relative;
  z-index: 2;
}

.home .actions {
  display: flex;
  align-items: center;
}

.actions {
  display: flex;
  align-items: center;
}

.notification-btn {
  background: none;
  border: none;
  color: var(--text-colar);
  font-size: 1.7rem;
  cursor: pointer;
  margin-right: 15px;
  margin-top: 10px;
  position: relative;
}

.notification-indicator {
  position: absolute;
  right: -1px;
  width: 15px;
  height: 15px;
  background-color: var(--text-colar);
  border-radius: 50%;
}

.titulo {
  display: inline-block;
  min-width: 100px;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropbtn {
  background-color: var(--sidebar-color);
  color: var(--text-colar);
  padding: 10px 15px;
  font-size: 16px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  border-radius: 5px;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.dropbtn:hover {
  background-color: var(--body-color);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.dropdown-content {
  display: none;
  position: absolute;
  margin-right: 30px;
  background-color: var(--sidebar-color);
  min-width: 200px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  z-index: 3;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-content.show {
  display: block;
  opacity: 1;
  transform: translateY(0);
}

.dropdown-item {
  color: var(--text-colar);
  padding: 12px 16px;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: background-color 0.2s, transform 0.2s;
}

.dropdown-item:hover {
  background-color: var(--body-color);
  transform: translateX(5px);
  color: var(--text-colar);
}

.dropdown-item i {
  margin-right: 12px;
  font-size: 1.2em;
  width: 20px;
  text-align: center;
}

.dropdown-item span {
  font-weight: 500;
}

.dropdown-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--text-colar-rgb), 0.1);
}

.tituloo {
  position: relative;
  z-index: 1;
}

.hone {
  margin-left: 30px;
  width: 17%;
  background-color: var(--sidebar-color);
  height: 280px;
  position: absolute;
  top: 35%;
  z-index: 2;
  border-radius: 10px;
  padding: 10px;
  border: 1px solid;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hone h1 {
  margin-top: 10px;
  font-size: 16px;
  position: relative;
  z-index: 1;
  color: var(--text-color);
  flex-shrink: 0;
  text-align: center;
}

.hone2 {
  margin-left: 30px;
  background-color: var(--sidebar-color);
  height: 50px;
  position: absolute;
  top: 30%;
  z-index: 2;
  border-radius: 10px;
  padding: 5px 15px;
  overflow-y: auto;
  border: 1px solid;
}

.hone2 h1 {
  text-align: center;
  margin-top: 10px;
  font-size: 15px;
  position: relative;
  z-index: 1;
  color: var(--text-color);
}

.group {
  display: flex;
  line-height: 28px;
  align-items: center;
  justify-content: center;
  position: relative;
  max-width: 250px;
  margin-top: 10px;
  flex-shrink: 0;
}

.input {
  width: 100%;
  height: 40px;
  line-height: 28px;
  padding: 0 1rem;
  padding-left: 2.5rem;
  border: 2px solid;
  border-radius: 8px;
  outline: none;
  background-color: var(--body-color);
  color: var(--text-color);
  transition: .3s ease;
}

.input::placeholder {
  color: var(--text-color);
}

.icon {
  position: absolute;
  left: 1rem;
  fill: var(--text-color);
  width: 1rem;
  height: 1rem;
  font-size: 21px;
}

.device-list-container {
  flex-grow: 1;
  overflow-y: auto;
  margin-top: 10px;
}

.device-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.device-list li {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  color: var(--text-color);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.device-list li:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.device-list li i {
  margin-right: 10px;
  font-size: 21px;
  flex-shrink: 0;
}

.device-list-container::-webkit-scrollbar {
  width: 6px;
}

.device-list-container::-webkit-scrollbar-track {
  background: var(--sidebar-color);
}

.device-list-container::-webkit-scrollbar-thumb {
  background-color: var(--body-color);
  border-radius: 3px;
}

.play-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 20%;
  z-index: 10;
  background-color: var(--body-color);
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 10px var(--body-color);
}

.player-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.control-button {
  background: var(--sidebar-color);
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: var(--text-colar);
  position: relative;
  padding: 10px;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.2s;
}

.control-button:hover {
  background-color: var(--body-color);
  transform: scale(1.1);
}

</style>
