<template>
<Transition name="trans" mode="out-in">
  <span :key="locale" :class="{flag:1, hide}">{{$t('flags')}}</span>
</Transition>
</template>

<script lang="ts" setup>
const { t, locale } = useI18n();

const hide = ref(false);

watch(locale, () => {
  hide.value = false;
  setTimeout(() => {
    hide.value = true;
  }, 1000);
});

</script>

<style lang="scss">


.flag {
  display: flex;

  justify-content: center;
  align-items: center;
  line-height: 0px;
  width: 95%;
  height: 95%;
  font-size: 40vw;
  position: absolute;
  left: 0px;
  top: 50px;
  user-select: none;
  opacity: 0;
  transform: scale(0.8);
  font-weight:normal;
}
.hide {
  display: none;
}


.trans-leave-to {
  opacity: 1;
  filter: blur(0.5vh) grayscale(1);
}
.trans-enter-from {
  transform: scale(3);
  opacity: 1;
}
.trans-enter-active {
  transition: all .5s;
  filter: blur(0.3vh) grayscale(0.8);
}



</style>