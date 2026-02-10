<template>
  <div class="space-view-fullscreen">
    <VRScene 
      ref="vrScene" 
      :space-id="spaceId" 
      @exit="$emit('exit')"
    />
  </div>
</template>

<script>
import VRScene from '../components/VRScene.vue';

export default {
  name: 'SpaceView',
  components: { VRScene },
  props: {
    spaceId: { type: String, required: true }
  }
}
</script>

<style scoped>
.space-view-fullscreen {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  background: #F5F5F7;
  overflow: hidden;
}
</style>