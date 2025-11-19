<template>
    <div class="h-full w-full">
        <canvas ref="chartCanvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
// Using Chart.js directly

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
    data: {
        type: Object,
        required: true,
    },
    options: {
        type: Object,
        default: () => ({}),
    },
});

const chartCanvas = ref(null);
let chartInstance = null;

const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                    size: 12,
                    family: 'Inter, sans-serif',
                },
            },
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
                size: 14,
                family: 'Inter, sans-serif',
            },
            bodyFont: {
                size: 13,
                family: 'Inter, sans-serif',
            },
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
        },
    },
};

onMounted(() => {
    if (chartCanvas.value) {
        chartInstance = new ChartJS(chartCanvas.value, {
            type: 'doughnut',
            data: props.data,
            options: { ...defaultOptions, ...props.options },
        });
    }
});

watch(
    () => [props.data, props.options],
    () => {
        if (chartInstance) {
            chartInstance.data = props.data;
            chartInstance.options = { ...defaultOptions, ...props.options };
            chartInstance.update();
        }
    },
    { deep: true }
);

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
    }
});
</script>

