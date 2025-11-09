import { postStory } from '../data/api';
import { showLoading, hideLoading } from '../utils/loading';
import pushNotifications from '../utils/push-notifications';
import { MAP_TILE_URL, MAP_TILE_ATTR, MAP_TILE_OPTIONS, MAP_TOPO_URL, MAP_TOPO_ATTR } from '../config';

export default class NewStoryPresenter {
  constructor({ view }) {
    this._view = view;
    this._stream = null;
  }

  async init() {
    this._setupControls();
    this._initMap();
  }

  _setupControls() {
    const photoInput = document.getElementById('photo-input');
    const startCameraBtn = document.getElementById('start-camera');
    const captureBtn = document.getElementById('capture-photo');
    const preview = document.getElementById('photo-preview');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');

    let videoEl = null;

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = document.createElement('img');
      img.alt = 'Selected photo';
      img.src = URL.createObjectURL(file);
      preview.innerHTML = '';
      preview.appendChild(img);
    });

    startCameraBtn.addEventListener('click', async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera API is not supported in this browser.');
        return;
      }

      try {
        this._stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        videoEl.srcObject = this._stream;
        preview.innerHTML = '';
        preview.appendChild(videoEl);
        captureBtn.style.display = 'inline-block';
      } catch (err) {
        console.error('Cannot access camera', err);
        alert('Cannot access camera.');
      }
    });

    captureBtn.addEventListener('click', () => {
      if (!videoEl) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth || 640;
      canvas.height = videoEl.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const img = document.createElement('img');
      img.alt = 'Captured photo';
      img.src = canvas.toDataURL('image/png');
      preview.innerHTML = '';
      preview.appendChild(img);

      canvas.toBlob((blob) => {
        const file = new File([blob], 'capture.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        photoInput.files = dt.files;
      }, 'image/png');

      this._stopStream();
      captureBtn.style.display = 'none';
    });

    const form = document.getElementById('new-story-form');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const description = document.getElementById('description').value;
      const file = photoInput.files[0];

      const fd = new FormData();
      fd.append('description', description);
      if (file) fd.append('photo', file);
      if (latInput.value && lonInput.value) {
        fd.append('lat', latInput.value);
        fd.append('lon', lonInput.value);
      }

      try {
        showLoading('Posting story...');
        const token = (typeof window !== 'undefined') ? window.localStorage.getItem('token') : null;
        const result = await postStory(fd, token);

        if (result && !result.error) {
          if (window.Swal) {
            window.Swal.fire({ icon: 'success', title: 'Story berhasil dibuat', text: 'Story berhasil dibuat.' });
          } else alert('Story posted successfully');

          try {
            await pushNotifications.showLocalNotification('Story berhasil dibuat', { body: `Anda telah membuat story baru dengan deskripsi: ${description}` });
          } catch (err) {
            console.error('Notification error', err);
          }
          location.hash = '#/stories';
        } else {
          const msg = (result && result.message) || 'Failed to post story';
          if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: msg });
          else alert(msg);
        }
      } catch (err) {
        console.error('post story error', err);
        if (window.Swal) window.Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Network error' });
      } finally {
        hideLoading();
      }
    });
  }

  _initMap() {
    const mapEl = document.getElementById('story-map');
    if (window.L && mapEl) {
      const map = L.map(mapEl).setView([0, 0], 2);

      const osm = L.tileLayer(MAP_TILE_URL, Object.assign({ attribution: MAP_TILE_ATTR }, MAP_TILE_OPTIONS));

      const topo = L.tileLayer(MAP_TOPO_URL, Object.assign({ attribution: MAP_TOPO_ATTR }, { maxZoom: 17 }));

      osm.addTo(map);
      L.control.layers({ 'OpenStreetMap': osm, 'Topo': topo }).addTo(map);

      const latInput = document.getElementById('lat');
      const lonInput = document.getElementById('lon');
      let pickMarker = null;
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (pickMarker) pickMarker.setLatLng(e.latlng);
        else pickMarker = L.marker(e.latlng).addTo(map);
        latInput.value = lat;
        lonInput.value = lng;
      });
    }
  }

  _stopStream() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }
}
