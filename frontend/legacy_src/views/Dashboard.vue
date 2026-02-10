<template>
  <div class="dashboard-container">
    <div class="header flex justify-between items-start">
      <div>
        <h2>VR Spaces</h2>
        <p>Manage your immersive environments.</p>
      </div>
      <!-- ADMIN PURGE BUTTON -->
      <button @click="purgeGhosts" class="btn-danger">
         ⚠️ PURGE GHOSTS
      </button>
    </div>

    <!-- Create Custom Space Section -->
    <div class="create-section">
      <h3>Create New Space</h3>
      
      <div class="form-group">
        <label>Space Name</label>
        <input v-model="newSpaceName" placeholder="Enter space name..." class="input-field" />
      </div>

      <div class="form-group">
        <label>Space Type</label>
        <select v-model="selectedType" class="input-field">
          <option value="SHOWROOM">Showroom (Static)</option>
          <option value="WORKSHOP">Workshop (Interactive)</option>
        </select>
      </div>

      <div v-if="selectedType === 'WORKSHOP'" class="form-group">
        <label>Select Template</label>
        <select v-model="selectedTemplateId" class="input-field">
          <option v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>

      <button @click="handleCreate" :disabled="!newSpaceName" class="btn-create">
        Create Space
      </button>
    </div>

    <!-- Existing Spaces List -->
    <div class="spaces-grid">
      <div v-for="space in spaces" :key="space.id" class="space-card">
        <div class="space-thumb" :style="{ backgroundImage: 'url(' + space.thumbnailUrl + ')' }">
          <span class="status-badge">{{ space.status }}</span>
        </div>
        <div class="space-info">
          <h4>{{ space.name }}</h4>
          <p class="template-name">{{ space.templateId }}</p>
          <button @click="$emit('enter-space', space)" class="btn-enter">Enter Space</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { api } from '../../services/api';

export default {
  name: 'Dashboard',
  data() {
    return {
      spaces: [],
      templates: [],
      newSpaceName: '',
      selectedType: 'SHOWROOM',
      selectedTemplateId: 'kanban'
    };
  },
  mounted() {
    this.loadSpaces();
    this.templates = api.spaces.getWorkshopTemplates();
  },
  methods: {
    async loadSpaces() {
      // Assuming 'org_default' for now as per api seeds
      this.spaces = await api.spaces.list('org_default');
    },
    async purgeGhosts() {
        if (!confirm("⚠️ This will remove ALL avatars from the database (except yours). Use this if 'ghost' players are stuck in the scene. Continue?")) return;
        
        const myId = sessionStorage.getItem('gg_player_id');
        try {
            await api.multiplayer.adminPurgeGhosts(myId);
            alert("Ghosts purged! Reloading...");
            window.location.reload();
        } catch(e) {
            console.error(e);
            alert("Failed to purge ghosts.");
        }
    },
    async handleCreate() {
      let templateId = 'boardroom'; // Default for showroom
      let workshopTemplateId = undefined;

      if (this.selectedType === 'WORKSHOP') {
        templateId = 'studio'; // Use studio as base container for workshops
        workshopTemplateId = this.selectedTemplateId;
      }

      const newSpace = {
        id: `space_${Date.now()}`,
        name: this.newSpaceName,
        status: 'draft',
        templateId: templateId,
        updatedAt: new Date().toISOString(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
        orgId: 'org_default'
      };

      await api.spaces.create(newSpace, workshopTemplateId);
      this.newSpaceName = '';
      this.loadSpaces();
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  color: white;
}
.header {
  margin-bottom: 2rem;
}
.create-section {
  background: #1E293B;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  border: 1px solid #334155;
}
.form-group {
  margin-bottom: 15px;
}
.input-field {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  background: #0B1120;
  border: 1px solid #334155;
  color: white;
  margin-top: 5px;
}
.btn-create {
  background: #06B6D4;
  color: #0B1120;
  font-weight: bold;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}
.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-danger {
  background: #7f1d1d;
  color: #fca5a5;
  border: 1px solid #f87171;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.8rem;
}
.btn-danger:hover {
  background: #991b1b;
}
.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.space-card {
  background: #1E293B;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #334155;
}
.space-thumb {
  height: 150px;
  background-size: cover;
  position: relative;
}
.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #22c55e;
  color: black;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.space-info {
  padding: 15px;
}
.btn-enter {
  width: 100%;
  background: #8B5CF6;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-start {
  align-items: flex-start;
}
</style>