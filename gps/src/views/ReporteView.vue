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

    <div class="crud">
      <div class="titu">
        <h1><i class='bx bxs-report icoon'></i> Reportes Generales</h1>
      </div>

      <div class="cruds">
        <div class="tituloss">
          <div class="tituloA">
            <h1>Generar reporte</h1>
          </div>
          <div class="tituloB">
            <h1>Seleccionar Reportes</h1>

            <div class="submenu">
              <div class="select">
                <input type="text" readonly :value="selectedDevice || 'Seleccione un dispositivo'"
                  @click="toggleDeviceDropdown" />
                <i class="arrow" @click="toggleDeviceDropdown">&#9660;</i>
              </div>
              <ul v-if="deviceDropdownOpen" class="dropdown-menu">
                <li v-for="device in devices" :key="device" @click="selectDevice(device)">
                  <i class='bx bxs-bus iconn'></i>
                  <span>{{ device }}</span>
                </li>
              </ul>
            </div>

            <div class="fechas">
              <div class="derecha">
                <label for="start-date">Fecha inicial:</label>
              </div>
              <div class="centro">
                <label for="end-date">Fecha fin:</label>
              </div>
            </div>

            <div class="dates">
                <input type="text" id="start-date" ref="startDatePicker" placeholder="yy/mm/dd" />
                <input type="text" id="end-date" ref="endDatePicker" placeholder="yy/mm/dd" />
            </div>
            <div class="botonR" @click="generarG">
              <button>Generar Reportes</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container-graph">
      <div class="containerG" v-if="showGraph">
        <Bar :data="chartData" :options="chartOptions" />
      </div>

      <div class="containerPie" v-if="showPieChart">
        <Pie :data="pieChartData" :options="pieChartOptions" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Bar, Pie } from 'vue-chartjs';
import Swal from 'sweetalert2';
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

// Variables reactivas
const chartData = ref({
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
  datasets: [
    {
      label: 'Ventas',
      backgroundColor: '#42A5F5',
      data: [40, 20, 30, 60, 90],
    },
  ],
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      ticks: { color: 'var(--text-colar)' },
      grid: { color: 'rgba(var(--text-colar-rgb), 0.1)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: 'var(--text-colar)' },
      grid: { color: 'var(--text-colar)' },
    },
  },
  plugins: {
    legend: { labels: { color: 'var(--text-colar)' } },
    title: {
      display: true,
      text: 'Gráfica de Barras',
      color: 'var(--text-colar)',
    },
  },
});

const devices = ref([]);
const deviceDropdownOpen = ref(false);
const displayedText = ref("");
const dropdownOpen = ref(false);
const endDatePicker = ref(null);
const fullText = "Navify";
const pieChartData = ref({
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
  datasets: [
    {
      label: 'Distribución',
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      data: [12, 19, 3, 5, 2],
    },
  ],
});

const pieChartOptions = ref({
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: 'var(--text-colar)' },
    },
    title: { color: 'var(--text-colar)' },
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.label || '';
          if (context.parsed !== null) {
            label += `: ${context.parsed}`;
          }
          return label;
        },
      },
      backgroundColor: 'var(--sidebar-color)',
      titleColor: 'var(--text-colar)',
      bodyColor: 'var(--text-colar)',
    },
  },
});

const selectedDevice = ref(null);
const showGraph = ref(false);
const showPieChart = ref(false);
const startDatePicker = ref(null);

let currentIndex = 0;
let isDeleting = false;
let typingInterval;

// Funciones

// Genera el reporte y muestra las gráficas
const generarG = () => {
  // Genera el reporte y muestra las gráficas
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  if (!selectedDevice.value) {
    Swal.fire({
      title: "Error",
      text: "Por favor, seleccione un dispositivo.",
      icon: "warning"
    });
    return;
  }

  if (!startDate || !endDate) {
    Swal.fire({
      title: "Error",
      text: "Por favor, seleccione ambas fechas.",
      icon: "warning"
    });
    return;
  }

  showGraph.value = true;
  showPieChart.value = true;
};

// Selecciona un dispositivo del menú desplegable
const selectDevice = (device) => {
  selectedDevice.value = device;
  deviceDropdownOpen.value = false;
};

// Alterna la visibilidad del menú desplegable de dispositivos
const toggleDeviceDropdown = () => {
  deviceDropdownOpen.value = !deviceDropdownOpen.value;
};

// Alterna la visibilidad del menú desplegable principal
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

// Crea un efecto de escritura para el texto del título
const typeEffect = () => {
  // Crea un efecto de escritura para el texto del título
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

// Función para cargar los dispositivos desde la base de datos
const cargarDispositivos = async () => {
  try {
    const response = await fetch('http://3.12.147.103/devices');
    if (!response.ok) {
      throw new Error('Error en la respuesta de la API');
    }
    const data = await response.json();
    devices.value = data.map(device => device.deviceName);
  } catch (error) {
    console.error('Error al cargar dispositivos:', error);
  }
};

// Hooks del ciclo de vida
onMounted(() => {
  flatpickr(startDatePicker.value, {
    dateFormat: "Y-m-d",
  });
  flatpickr(endDatePicker.value, {
    dateFormat: "Y-m-d",
  });
  typeEffect();
  cargarDispositivos();
});

onUnmounted(() => {
  clearTimeout(typingInterval);
});
</script>

<style scoped>
.home {
  min-height: 160vh;

}

.home .navar {
  background-color: var(--sidebar-color);
  border-bottom: 3px solid var(--body-color);
}

.home .text {
  position: relative;
  z-index: 2;
}

.home .actions {
  display: flex;
  align-items: center;
}

.crud {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.titu {
  margin-left: 50px;
  margin-top: 40px;
  display: flex;
}

.listad {
  margin-left: 50px;
  margin-top: 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.listad h1 {
  font-weight: 400;
  color: var(--text-colar);
}

.listad .boton {
  margin-right: 50px;
}

.titu h1 {
  color: var(--text-colar);
}

.titu h1 i {
  margin-right: 10px;
}

.cruds {
  margin: 20px 20px;
  border-radius: 10px;
  background-color: var(--sidebar-color);
  height: 400px;
  padding: 15px;
}

.cruds .tituloss {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.cruds .tituloA {
  margin: 10px 20px;
}

.cruds .tituloA h1 {
  color: var(--text-colar);
}

.cruds .tituloB {
  margin: 10px 20px;
}

.cruds .tituloB h1 {
  color: var(--text-colar);
  font-weight: 400;
  font-size: 20px;
}

.cruds .submenu {
  margin-top: 10px;
  position: relative;
}

.select {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.select input {
  width: 100%;
  padding: 12px 15px;
  padding-right: 30px;
  border: 1px solid var(--text-colar);
  border-radius: 8px;
  cursor: pointer;
  background-color: var(--sidebar-color);
  color: var(--text-colar);
  font-weight: 500;
  transition: all 0.3s ease;
}

.select input:hover {
  border-color: var(--primary-color);
}

.select .arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-colar);
  pointer-events: none;
  transition: transform 0.3s ease;
}

.select:hover .arrow {
  transform: translateY(-50%) rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--sidebar-color);
  border: 2px solid var(--text-colar);
  border-top: none;
  border-radius: 0 0 8px 8px;
  list-style-type: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-menu li {
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--text-colar);
  transition: background-color 0.3s ease;
}

.dropdown-menu li:hover {
  background-color: var(--primary-color-light);
}

.dropdown-menu .iconn {
  margin-right: 15px;
  font-size: 1.2em;
  color: var(--text-colar);
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
  z-index: 1;
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

.cruds .fechas {
  margin-top: 20px;
  display: flex;
  align-items: center;
}

.cruds .fechas .derecha {
  margin-left: 0 auto;
  color: var(--text-colar);
}

.cruds .fechas .centro {
  margin: auto;
  color: var(--text-colar);
}

.cruds .dates input{
  width: 100%;
  padding: 10px;
  cursor: pointer; 
  border-radius: 5px;
  border: 1px solid var(--text-colar);
  background-color: var(--body-color);
  color: var(--text-colar);
  
}

.cruds .dates {
  margin-top: 20px;
  display: flex;
  align-items: center;
  width: 100%;
  gap: 20px;
}


.arrow {
  pointer-events: none;
}

.botonR {
  margin-top: 30px;
}

.botonR button {
  padding: 12.5px 30px;
  border: 1px solid var(--text-colar);
  border-radius: 100px;
  background-color: var(--body-color);
  color: var(--text-colar);
  font-weight: 500;
  cursor: pointer;
}

.container-graph {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.containerG {
  width: 40%;
  height: 440px;
}

.containerPie {
  width: 32%;
  height: 440px;
}

.containerG canvas,
.containerPie canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
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


</style>




