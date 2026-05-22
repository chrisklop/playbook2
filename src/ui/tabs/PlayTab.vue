<script setup lang="ts">
import Masthead from '../components/Masthead.vue';
import Ticker from '../components/Ticker.vue';
import EraBanner from '../components/EraBanner.vue';
import ResourceRow from '../components/ResourceRow.vue';
import BulkBuyBar from '../components/BulkBuyBar.vue';
import EventClaim from '../components/EventClaim.vue';
import GeneratorCard from '../components/GeneratorCard.vue';
import RevealPlaceholder from '../components/RevealPlaceholder.vue';
import CoachBanner from '../components/CoachBanner.vue';
import PrestigeStrip from '../components/PrestigeStrip.vue';
import PrestigeTransition from '../components/PrestigeTransition.vue';
import { visibleGenerators } from '../state';
</script>

<template>
  <div class="play">
    <!-- Sticky top chrome — locked at the top of the scroll viewport -->
    <div class="chrome">
      <Masthead />
      <Ticker />
      <EraBanner />
      <ResourceRow />
      <EventClaim />
      <BulkBuyBar />
    </div>
    <CoachBanner />
    <div class="cards">
      <GeneratorCard v-for="gen in visibleGenerators" :key="gen.id" :gen="gen" />
      <RevealPlaceholder />
    </div>
    <PrestigeStrip />
    <PrestigeTransition />
  </div>
</template>

<style scoped>
.play {
  margin: 0;
  padding: 0 0 80px 0;
  width: 100%;
  box-sizing: border-box;
}
.chrome {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--theme-background, #f2ecd9);
  /* Subtle separator under the chrome so it visually peels from the cards below it */
  box-shadow: 0 1px 0 var(--theme-border, #2a2218);
}
.cards {
  margin: 0;
  padding: 10px 14px;
  width: 100%;
  box-sizing: border-box;
}
</style>
