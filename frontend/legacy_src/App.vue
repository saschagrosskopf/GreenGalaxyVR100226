<template>
  <div id="app">
    <!-- Main View -->
    <Dashboard v-if="!currentSpace" @enter-space="handleEnterSpace" />
    <SpaceView v-else :spaceId="currentSpace.id" @exit="currentSpace = null" />
  </div>
</template>

<script>
import Dashboard from './views/Dashboard.vue';
import SpaceView from './views/SpaceView.vue';

export default {
  name: 'App',
  components: {
    Dashboard,
    SpaceView
  },
  data() {
    return {
        currentSpace: null
    }
  },
  methods: {
      handleEnterSpace(space) {
          this.currentSpace = space;
      }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #F5F5F7;
  color: #333;
}
</style>