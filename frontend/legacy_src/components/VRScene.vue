<template>
  <div style="width: 100%; height: 100%; position: relative;">

    <div class="miro-overlay-forced" v-if="!loading">
      <div style="font-size:9px; color:#888; font-weight:bold; margin-bottom:5px;">WORKSPACE</div>
      <button @click="updateScreen('https://calendar.google.com', '#4285F4')" title="Calendar" style="background: #4285F4; color: white;">📅</button>
      <button @click="updateScreen('https://sheets.google.com', '#0F9D58')" title="Sheets" style="background: #0F9D58; color: white;">📊</button>
      <button @click="updateScreen('Gemini AI Analysis', '#8E24AA')" title="Gemini AI" style="background: #8E24AA; color: white;">🤖</button>
      
      <div style="height: 1px; background: #eee; margin: 5px 0;"></div>
      <button @click="restoreRoom" title="Fix Layout" style="background: #00cec9; color: white;">🛠️</button>
      <button @click="purge" title="Reset" style="background: #ff7675; color: white;">🧹</button>
    </div>

    <div v-if="loading" style="position: absolute; inset: 0; background: white; z-index: 99999; display: flex; align-items: center; justify-content: center;">
      <h3>🚀 Configuring Room...</h3>
    </div>

    <a-scene embedded background="color: #ffffff" renderer="antialias: true; colorManagement: true;">
      <a-assets><img id="grid-tex" src="https://cdn.aframe.io/a-painter/images/floor.jpg" crossorigin="anonymous"></a-assets>

      <a-entity light="type: ambient; color: #ffffff; intensity: 0.9"></a-entity>
      <a-entity light="type: directional; color: #ffffff; intensity: 0.5; position: -1 4 2"></a-entity>
      <a-plane src="#grid-tex" repeat="200 200" rotation="-90 0 0" width="500" height="500" color="#f5f6fa" opacity="0.5" transparent="true"></a-plane>

      <a-entity id="rig" movement-controls="fly: true; speed: 2.0" position="0 2 0">
        <a-entity camera position="0 1.6 0" look-controls="pointerLockEnabled: false">
          <a-cursor fuse="false" color="#333" scale="0.8 0.8 0.8" raycaster="objects: .clickable; far: 100"></a-cursor>
        </a-entity>
      </a-entity>

      <a-entity v-for="obj in sceneObjects" :key="obj.id" :position="`${obj.pos.x} ${obj.pos.y} ${obj.pos.z}`" :rotation="`${obj.rot.x || 0} ${obj.rot.y || 0} ${obj.rot.z || 0}`">
        
        <a-entity v-if="obj.type === 'screen'">
           <a-box :width="obj.size.w" :height="obj.size.h" depth="0.1" :color="obj.color || '#111'" shadow></a-box>
           <a-text :value="obj.content || 'WORKSPACE'" align="center" position="0 0 0.1" width="10" color="white"></a-text>
        </a-entity>

        <a-entity v-if="obj.type === 'model'" 
                  :gltf-model="obj.url" 
                  scale="1 1 1" 
                  shadow="cast:true; receive:true">
        </a-entity>
        
        <a-entity v-if="obj.type === 'box'"><a-box :width="obj.size.w" :height="obj.size.h" :depth="obj.size.d" :color="obj.color" shadow></a-box></a-entity>
        <a-entity v-if="obj.type === 'cylinder'"><a-cylinder :height="obj.size.h" :radius="obj.size.r" :color="obj.color" shadow></a-cylinder></a-entity>
        <a-entity v-if="obj.type === 'board_col'"><a-box :width="obj.size.w" :height="obj.size.h" depth="0.2" :color="obj.color"></a-box><a-text :value="obj.title" color="#FFF" :position="`0 ${obj.size.h/2 - 1} 0.15`" align="center" width="15"></a-text></a-entity>
        <a-entity v-if="obj.type === 'floor_zone'"><a-plane :width="obj.size.w" :height="obj.size.h" :color="obj.color"></a-plane><a-text :value="obj.title" position="0 0.5 0" align="center" width="20" color="#333" rotation="0 0 0"></a-text></a-entity>
        <a-entity v-if="obj.type === 'teleport'" class="clickable" @click="teleportUser(obj.target)"><a-cylinder height="0.05" radius="1.5" :color="obj.color" opacity="0.8"></a-cylinder><a-text :value="obj.label" align="center" position="0 2 0" width="10" color="#333" side="double"></a-text></a-entity>

      </a-entity>
    </a-scene>
  </div>
</template>

<script>
import { api } from '@/services/api';
import { db } from '../logic.js'; 
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';

export default {
  props: ['spaceId'],
  data() { return { sceneObjects: [], loading: false, hasTriedBuild: false } },
  mounted() {
    if (!this.spaceId) return;
    
    const spaces = JSON.parse(localStorage.getItem('gg_db_spaces') || '[]');
    const currentSpace = spaces.find(s => s.id === this.spaceId);

    const q = query(collection(db, 'spaces', this.spaceId, 'sceneObjects'), orderBy('createdAt'));
    this.unsubscribe = onSnapshot(q, async (snapshot) => {
      
      // AUTO HYDRATE (STRICT)
      if (snapshot.empty && !this.hasTriedBuild) {
         this.loading = true; this.hasTriedBuild = true;
         
         // 1. Custom GLB Check
         if (currentSpace && currentSpace.customAssets && currentSpace.customAssets.length > 0) {
             currentSpace.customAssets.forEach(asset => api.scenes.addSceneObject(this.spaceId, { type: 'model', url: asset.url, pos: {x:0, y:0, z:0} }));
         }
         // 2. Fixed Template Check
         else {
             let tid = null;
             if (this.spaceId === 'seed_boardroom') tid = 'template_boardroom';
             if (this.spaceId === 'seed_studio') tid = 'template_studio';
             if (this.spaceId === 'seed_zen') tid = 'template_zen';
             if (this.spaceId === 'seed_mall') tid = 'template_mall';
             
             if (tid) await api.spaces.hydrateSpace(this.spaceId, tid);
         }
         this.loading = false;
         return;
      }
      this.sceneObjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
  },
  beforeUnmount() { if (this.unsubscribe) this.unsubscribe(); },
  methods: {
    async updateScreen(content, color) {
        const screen = this.sceneObjects.find(o => o.type === 'screen');
        if (screen) await updateDoc(doc(db, 'spaces', this.spaceId, 'sceneObjects', screen.id), { color, content });
    },
    teleportUser(target) { document.getElementById('rig').object3D.position.set(target.x, target.y, target.z); },
    spawn(type, content) { api.scenes.addSceneObject(this.spaceId, { type, content, color: '#fab1a0', size: {w:1, h:1, d:1}, pos: {x:0,y:2,z:-2} }); },
    async purge() { if(confirm("RESET?")) await api.multiplayer.adminPurgeGhosts(); },
    
    async restoreRoom() {
        if(confirm("Fix Layout?")) {
            let tid = 'template_boardroom'; 
            if (this.spaceId === 'seed_studio') tid = 'template_studio';
            if (this.spaceId === 'seed_zen') tid = 'template_zen';
            if (this.spaceId === 'seed_mall') tid = 'template_mall';
            await api.spaces.hydrateSpace(this.spaceId, tid);
        }
    }
  }
}
</script>

<style scoped>
.miro-overlay-forced {
  position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
  z-index: 9999; display: flex; flex-direction: column; gap: 8px;
  background: white; padding: 12px; border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}
.miro-overlay-forced button { width: 45px; height: 45px; font-size: 20px; cursor: pointer; border: none; border-radius: 8px; transition: 0.1s; }
.miro-overlay-forced button:hover { transform: scale(1.1); }
</style>