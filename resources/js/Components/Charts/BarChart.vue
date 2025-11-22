<template>
    <div class="h-full w-full">
        <canvas ref="chartCanvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
// Using Chart.js directly

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    Title,
    Tooltip,
    Legend
);

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
    plugins: {
        legend: {
            display: true,
            position: 'top',
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
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                font: {
                    size: 11,
                    family: 'Inter, sans-serif',
                },
                color: '#6B7280',
            },
        },
        y: {
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
                font: {
                    size: 11,
                    family: 'Inter, sans-serif',
                },
                color: '#6B7280',
            },
        },
    },
};

onMounted(() => {
    if (chartCanvas.value) {
        chartInstance = new ChartJS(chartCanvas.value, {
            type: 'bar',
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

