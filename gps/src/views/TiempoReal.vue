<template>
  <section class="home">
    <div class="overlay"></div>
    <div class="navar">
      <div class="text">
        <h1 class="titulo">{{ displayedText }}</h1>
      </div>

      <div class="actions">
        <!-- Icono de notificación con indicador -->
        <router-link to="/reporte2">
          <button class="notification-btn">
          <i class='bx bx-bell'></i>
          <span class="notification-indicator"></span>
        </button>
        </router-link>
        
        <!-- Menú desplegable de configuración mejorado -->
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
            <li v-for="item in filteredResults" :key="item._id" @click="showAlert(item)">
              <i class='bx bxs-car'></i>
              {{ item.deviceName }}
            </li>
          </ul>
        </div>
      </div>

      <div class="hone2">
        <h1>Dispositivo</h1>
      </div>

      <div id="map" class="map-container"></div>
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

// Configuración de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
});

// Variables reactivas
let map;
const fullText = "Navify";
const displayedText = ref("");
let currentIndex = 0;
let isDeleting = false;
let typingInterval;

const dropdownOpen = ref(false);
const searchQuery = ref('');
const devices = ref([]);
const filteredResults = ref([]);
let trackingIntervalId = null

// Funciones

// Crea el efecto de escritura para el título
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

// Inicializa el mapa de Leaflet
function initMap() {
  var colombia = { lat: 10.9685, lng: -74.7813 };
  const mapOptions = {
    center: colombia,
    zoom: 12.4
    
  };
  
  // Crear el objeto de mapa de Leaflet
  map = L.map('map').setView([colombia.lat, colombia.lng], mapOptions.zoom);

  // Agregar una capa de mapa
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

}

// Alterna la visibilidad del menú desplegable
function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

// Filtra los dispositivos basados en la búsqueda del usuario
function filterResults() {
  const query = searchQuery.value.toLowerCase();
  filteredResults.value = devices.value.filter(item =>
    item.deviceName.toLowerCase().includes(query)
  );
}

// Muestra un dispositivo seleccionado en el mapa
async function showDeviceOnMap(device) {
  console.log('Mostrando dispositivo:', device);
  
  if (!map) {
    console.error('El mapa no está inicializado');
    return;
  }

  try {
    const response = await fetch(`http://3.12.147.103/devices/status/${device.imei}`);
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API');
    }
    const data = await response.json();
    const { lat, lon, fixTime, speed } = data;

    // Limpiar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Centrar el mapa en la ubicación del dispositivo
    map.setView([lat, lon], 18);

    // Añadir un nuevo marcador para el dispositivo
    const marker = L.marker([lat, lon]).addTo(map);

    // Mostrar información del dispositivo en un popup
    marker.bindPopup(`
      <b>${device.deviceName}</b><br>
      Latitud: ${lat}<br>
      Longitud: ${lon}<br>
      tiempo: ${fixTime}<br>
      velocidad${speed}
    `).openPopup();

    // Forzar una actualización del mapa
    map.invalidateSize();

    // Asegurar que el mapa se centre después de un breve retraso
    setTimeout(() => {
      map.setView([lat, lon], 18);
      map.invalidateSize();
    }, 100);

    console.log('Marcador añadido y mapa centrado');
  } catch (error) {
    console.error('Error al obtener la ubicación del dispositivo:', error);
  }
}


function startTracking(device) {
  // Detener cualquier seguimiento anterior
  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
  }

  // Iniciar un nuevo seguimiento
  trackingIntervalId = setInterval(() => {
    showDeviceOnMap(device);
  }, 5000); // Actualizar cada 5 segundos
}

// Muestra una alerta con los detalles del dispositivo
const showAlert = (item) => {
  console.log(JSON.stringify(item, null, 2));
  Swal.fire({
    title: 'Detalles del Dispositivo',
    html: `
      <p><strong>Nombre:</strong> ${item.deviceName}</p>
      <p><strong>Responsable:</strong> ${item.responsible}</p>
      <p><strong>IMEI:</strong> ${item.imei}</p>
      <p><strong>Estado:</strong> ${item.status}</p>
    `,
    confirmButtonText: 'Mostrar en Mapa',
    showCancelButton: true,
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      startTracking(item); // Iniciar el seguimiento del dispositivo
    }
  });
};
// Carga los dispositivos desde la API
const cargarDispositivos = async () => {
  try {
    const response = await fetch('http://3.12.147.103/devices');
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API');
    }
    const data = await response.json();
    console.log(data);
    // Agregar latitud y longitud manualmente a cada dispositivo
    devices.value = data
    filteredResults.value = devices.value;
  } catch (error) {
    console.error('Error al cargar dispositivos:', error);
  }
};

// Lifecycle hooks
onUnmounted(() => {
  clearTimeout(typingInterval);
  if (trackingIntervalId) {
    clearInterval(trackingIntervalId);
  }
});

onMounted(() => {
  initMap();
  typeEffect();
  cargarDispositivos();
});
</script>

<style scoped>
/* Estilos del mapa */
.map-container {
  height: calc(100vh - 60px);
  width: 100%; 
  z-index: 0; 
}

/* Estilos generales */
.home {
  height: 100vh; 
  overflow: hidden; 
  position: relative;
}

/* Estilos de la barra de navegación */
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
  min-width: 100px; /* Ajusta según sea necesario */
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

/* Separador entre elementos */
.dropdown-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--text-colar-rgb), 0.1);
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
  display: flex;
  flex-direction: column;
  border: 1px solid;
}

.hone h1 {
  margin-top: 10px;
  font-size: 16px;
  text-align: center;
  color: var(--text-color);

}

.hone2 {
  margin-left: 30px;
  background-color: var(--sidebar-color);
  height: 50px;
  position: absolute;
  top: 25%;
  z-index: 2; 
  border-radius: 10px;
  padding: 5px 15px;
  border: 1px solid;
}

.hone2 h1 {
  text-align: center;
  margin-top: 10px;
  font-size: 15px;
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

/* Estilos para la barra de desplazamiento */
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
</style>








