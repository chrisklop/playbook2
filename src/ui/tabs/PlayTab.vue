<script setup lang="ts">
import Masthead from '../components/Masthead.vue';
import Ticker from '../components/Ticker.vue';
import EraBanner from '../components/EraBanner.vue';
import ResourceRow from '../components/ResourceRow.vue';
import GeneratorCard from '../components/GeneratorCard.vue';
import { visibleGenerators } from '../state';
</script>

<template>
  <div class="play">
    <Masthead />
    <Ticker />
    <EraBanner />
    <ResourceRow />
    <div class="cards">
      <GeneratorCard v-for="gen in visibleGenerators" :key="gen.id" :gen="gen" />
    </div>
  </div>
</template>

<style scoped>
.play {
  margin: 0;
  padding: 0 0 80px 0;
  width: 100%;
  box-sizing: border-box;
}
.cards {
  margin: 0;
  padding: 10px 14px;
  width: 100%;
  box-sizing: border-box;
}
</style>
