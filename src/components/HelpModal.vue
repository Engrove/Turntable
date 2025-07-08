<script setup>
// Denna komponent behöver bara veta om den ska vara öppen och hur den ska meddela när den vill stängas.
defineProps({
isOpen: {
type: Boolean,
required: true
}
});

const emit = defineEmits(['close']);

const closeModal = () => {
emit('close');
};
</script>

<template>
<transition name="fade">
<div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
<div class="modal-content">
<header class="modal-header">
<slot name="header">Default Header</slot>
<button @click="closeModal" class="close-btn">&times;</button>
</header>
<main class="modal-body">
<slot>
This is the default modal content.
</slot>
</main>
</div>
</div>
</transition>
</template>

<style scoped>
.modal-overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.6);
display: flex;
justify-content: center;
align-items: center;
z-index: 1000;
}

.modal-content {
background: white;
padding: 2rem;
border-radius: 8px;
width: 90%;
max-width: 800px;
max-height: 90vh;
display: flex;
flex-direction: column;
box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.modal-header {
display: flex;
justify-content: space-between;
align-items: center;
border-bottom: 1px solid var(--border-color);
padding-bottom: 1rem;
margin-bottom: 1rem;
}

.modal-header h2 {
margin: 0;
color: var(--header-color);
}

.close-btn {
border: none;
background: none;
font-size: 2rem;
font-weight: bold;
cursor: pointer;
color: #aaa;
line-height: 1;
}
.close-btn:hover {
color: #333;
}

.modal-body {
overflow-y: auto;
line-height: 1.6;
}

/* Fade-animation för modalen */
.fade-enter-active, .fade-leave-active {
transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
opacity: 0;
}
</style>
