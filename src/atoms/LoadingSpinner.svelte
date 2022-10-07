<script lang="ts">
  export let color = "#FF3E00";
  export let unit = "px";
  export let duration = "0.6s";
  export let size = "60";
  let moonSize: number = +size / 7;
  let top: number = +size / 2 - moonSize / 2;
</script>

<div
  class="wrapper"
  style="--size: {size}{unit}; --color: {color}; --moonSize: {top}{unit}; --duration: {duration};"
>
  <div class="circle-one" />
  <div class="circle-two" />
</div>

<style>
  .wrapper {
    height: var(--size);
    width: var(--size);
    border-radius: 100%;
    animation: moonStretchDelay var(--duration) 0s infinite linear;
    animation-fill-mode: forwards;
    position: relative;
    margin: 0.5rem;
  }
  .circle-one {
    top: var(--moonSize);
    background-color: var(--color);
    width: calc(var(--size) / 4);
    height: calc(var(--size) / 4);
    border-radius: 100%;
    animation: moonStretchDelay var(--duration) 0s infinite linear;
    animation-fill-mode: forwards;
    opacity: 0.8;
    position: absolute;
  }
  .circle-two {
    opacity: 0.3;
    border: calc(var(--size) / 4) solid var(--color);
    height: var(--size);
    width: var(--size);
    border-radius: 100%;
    box-sizing: border-box;
  }
  @keyframes moonStretchDelay {
    100% {
      transform: rotate(360deg);
    }
  }
</style>
